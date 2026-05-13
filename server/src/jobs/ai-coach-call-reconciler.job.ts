import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { aiCoachCallQueueService } from '../services/ai-coach-call-queue.service.js';
import { getUserLocalDateISO } from '../lib/user-timezone.js';

const BATCH = 200;
const RECONCILER_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STUCK_INITIATED_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

let intervalId: NodeJS.Timeout | null = null;
let isRunning = false;

async function reconcile(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  const start = Date.now();
  let usersProcessed = 0;
  let jobsScheduled = 0;
  let stuckRecovered = 0;

  try {
    // 1. Recover stuck "initiated" rows (server crashed mid-call)
    const stuckThreshold = new Date(Date.now() - STUCK_INITIATED_THRESHOLD_MS).toISOString();
    const stuckResult = await query(
      `UPDATE ai_coach_call_log
       SET status = 'missed', skip_reason = 'stuck_initiated_recovered', updated_at = NOW()
       WHERE status = 'initiated' AND initiated_at < $1`,
      [stuckThreshold],
    );
    stuckRecovered = stuckResult.rowCount || 0;
    if (stuckRecovered > 0) {
      logger.info('[AICoachReconciler] Recovered stuck initiated rows', { count: stuckRecovered });
    }

    // 2. Schedule today's jobs for all eligible users
    if (!aiCoachCallQueueService.isAvailable()) {
      logger.info('[AICoachReconciler] Queue not available, skipping job scheduling');
      return;
    }

    let cursor = '00000000-0000-0000-0000-000000000000';

    while (true) {
      const users = await query<{
        user_id: string;
        timezone: string;
        preferred_call_times: string[];
        ai_call_frequency: string;
        dnd_days: number[];
      }>(
        `SELECT up.user_id,
                COALESCE(u.timezone, 'UTC') AS timezone,
                up.preferred_call_times,
                up.ai_call_frequency,
                COALESCE(up.dnd_days, '{}') AS dnd_days
         FROM user_preferences up
         JOIN users u ON u.id = up.user_id AND u.is_active = true
         WHERE up.user_id > $1::uuid
           AND up.ai_call_frequency != 'off'
           AND up.preferred_call_times IS NOT NULL
           AND array_length(up.preferred_call_times, 1) > 0
         ORDER BY up.user_id ASC
         LIMIT $2`,
        [cursor, BATCH],
      );

      if (users.rows.length === 0) break;

      for (const row of users.rows) {
        usersProcessed++;
        cursor = row.user_id;

        try {
          const today = getUserLocalDateISO(row.timezone);

          // Check DND day
          const dayStr = new Date().toLocaleDateString('en-US', {
            timeZone: row.timezone,
            weekday: 'short',
          });
          const dayMap: Record<string, number> = {
            Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
          };
          if (row.dnd_days.includes(dayMap[dayStr] ?? -1)) continue;

          for (const time of row.preferred_call_times) {
            await aiCoachCallQueueService.scheduleCall(
              row.user_id,
              time,
              row.timezone,
              today,
            );
            jobsScheduled++;
          }
        } catch (error) {
          logger.debug('[AICoachReconciler] Skip user', {
            userId: row.user_id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (users.rows.length < BATCH) break;
    }

    logger.info('[AICoachReconciler] Cycle complete', {
      usersProcessed,
      jobsScheduled,
      stuckRecovered,
      ms: Date.now() - start,
    });
  } catch (error) {
    logger.error('[AICoachReconciler] Fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    isRunning = false;
  }
}

function start(): void {
  if (intervalId) return;
  // Run first reconciliation immediately, then every 24h
  reconcile().catch(() => {});
  intervalId = setInterval(() => {
    reconcile().catch(() => {});
  }, RECONCILER_INTERVAL_MS);
  logger.info('[AICoachReconciler] Started', { intervalMs: RECONCILER_INTERVAL_MS });
}

function stop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  logger.info('[AICoachReconciler] Stopped');
}

export const aiCoachCallReconcilerJob = { start, stop };
