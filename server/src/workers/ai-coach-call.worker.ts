import { Worker, Job } from 'bullmq';
import { redisConnection, QueueNames } from '../config/queue.config.js';
import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { communicationPreferencesService } from '../services/communication-preferences.service.js';
import { voiceScheduleService } from '../services/voice-schedule.service.js';
import { chatCallService } from '../services/chat-call.service.js';
import { getUserLocalHour } from '../lib/user-timezone.js';
import type { AICoachCallJobData } from '../services/ai-coach-call-queue.service.js';

const CHECKIN_MISS_SKIP_THRESHOLD = process.env.CHECKIN_MISS_SKIP_THRESHOLD
  ? parseInt(process.env.CHECKIN_MISS_SKIP_THRESHOLD, 10)
  : 3;

interface SkipResult {
  skip: true;
  reason: string;
  status: 'skipped' | 'skipped_offline';
}
interface PassResult {
  skip: false;
}
type GateResult = SkipResult | PassResult;

async function runGateChecks(job: Job<AICoachCallJobData>): Promise<GateResult> {
  const { userId, scheduledTimeHHMM, timezone } = job.data;

  if (process.env.AI_COACH_CALL_BULLMQ_ENABLED !== 'true') {
    return { skip: true, reason: 'feature_flag_disabled', status: 'skipped' };
  }

  // Gate 1: Account active
  const userResult = await query<{ id: string; is_active: boolean }>(
    `SELECT id, is_active FROM users WHERE id = $1`,
    [userId],
  );
  if (!userResult.rows[0]?.is_active) {
    return { skip: true, reason: 'account_inactive', status: 'skipped' };
  }

  // Gate 2: AI calls enabled
  const schedPrefs = await voiceScheduleService.getPreferences(userId);
  if (schedPrefs.aiCallFrequency === 'off') {
    return { skip: true, reason: 'ai_calls_disabled', status: 'skipped' };
  }

  // Gate 3: Check-in push consent
  const commPrefs = await communicationPreferencesService.getForUser(userId);
  if (!commPrefs.checkin_push_enabled) {
    return { skip: true, reason: 'checkin_push_disabled', status: 'skipped' };
  }

  // Gate 4: DND day
  const dayStr = new Date().toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short' });
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDay = dayMap[dayStr] ?? new Date().getDay();
  if (schedPrefs.dndDays.includes(currentDay)) {
    return { skip: true, reason: 'dnd_day', status: 'skipped' };
  }

  // Gate 5: Quiet hours
  if (schedPrefs.quietHoursEnabled) {
    const localHour = getUserLocalHour(timezone);
    const qStart = parseInt(schedPrefs.quietHoursStart.split(':')[0]!, 10);
    const qEnd = parseInt(schedPrefs.quietHoursEnd.split(':')[0]!, 10);
    const inQuiet = qStart < qEnd
      ? localHour >= qStart && localHour < qEnd
      : localHour >= qStart || localHour < qEnd;
    if (inQuiet) {
      return { skip: true, reason: 'quiet_hours', status: 'skipped' };
    }
  }

  // Gate 6: Miss threshold
  const hour = parseInt(scheduledTimeHHMM.split(':')[0]!, 10);
  const missByHour = commPrefs.checkin_miss_count_by_hour || {};
  const missCount = Number(missByHour[String(hour)] ?? 0);
  if (missCount >= CHECKIN_MISS_SKIP_THRESHOLD) {
    return { skip: true, reason: 'miss_threshold', status: 'skipped' };
  }

  // Gate 7: Daily cap
  // Use the higher of max_checkins_per_day and the user's preferred_call_times count,
  // because the default max_checkins_per_day (1) is too low for users with multiple times.
  const timesResult = await query<{ cnt: string }>(
    `SELECT COALESCE(array_length(preferred_call_times, 1), 0)::text AS cnt
     FROM user_preferences WHERE user_id = $1`,
    [userId],
  );
  const preferredTimesCount = parseInt(timesResult.rows[0]?.cnt || '0', 10);
  const effectiveCap = Math.max(commPrefs.max_checkins_per_day, preferredTimesCount);

  const capResult = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM ai_coach_call_log
     WHERE user_id = $1 AND scheduled_date = $2::DATE
       AND status IN ('initiated', 'answered')`,
    [userId, job.data.scheduledDate],
  );
  if (parseInt(capResult.rows[0]?.c || '0', 10) >= effectiveCap) {
    return { skip: true, reason: 'daily_cap', status: 'skipped' };
  }

  // Gate 8 removed: initiateAICoachCall handles offline users via push notification.

  return { skip: false };
}

export async function processAICoachCallJob(job: Job<AICoachCallJobData>): Promise<void> {
  const { userId, scheduledTimeHHMM, scheduledDate, timezone, sessionType } = job.data;

  logger.info('[AICoachCallWorker] Processing job', {
    jobId: job.id,
    userId,
    scheduledTimeHHMM,
    scheduledDate,
  });

  const gateResult = await runGateChecks(job);
  if (gateResult.skip) {
    logger.info('[AICoachCallWorker] Skipped', {
      userId,
      reason: gateResult.reason,
      status: gateResult.status,
    });
    await query(
      `UPDATE ai_coach_call_log
       SET status = $1, skip_reason = $2, updated_at = NOW()
       WHERE user_id = $3 AND scheduled_date = $4::DATE
         AND scheduled_time = $5::TIME AND status = 'scheduled'`,
      [gateResult.status, gateResult.reason, userId, scheduledDate, scheduledTimeHHMM],
    );
    return;
  }

  // Update log to initiated
  await query(
    `UPDATE ai_coach_call_log
     SET status = 'initiated', initiated_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND scheduled_date = $2::DATE
       AND scheduled_time = $3::TIME AND status = 'scheduled'`,
    [userId, scheduledDate, scheduledTimeHHMM],
  );

  try {
    const call = await chatCallService.initiateAICoachCall(userId, {
      preCallContext: `Scheduled ${sessionType} check-in at ${scheduledTimeHHMM} ${timezone}`,
      sessionType,
    });

    // Link the chat_call_id to the log
    await query(
      `UPDATE ai_coach_call_log SET chat_call_id = $1, updated_at = NOW()
       WHERE user_id = $2 AND scheduled_date = $3::DATE
         AND scheduled_time = $4::TIME AND status = 'initiated'`,
      [call.id, userId, scheduledDate, scheduledTimeHHMM],
    );

    logger.info('[AICoachCallWorker] Call initiated', {
      userId,
      callId: call.id,
      scheduledTimeHHMM,
    });
  } catch (error) {
    logger.error('[AICoachCallWorker] Failed to initiate call', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    await query(
      `UPDATE ai_coach_call_log
       SET status = 'skipped', skip_reason = $1, updated_at = NOW()
       WHERE user_id = $2 AND scheduled_date = $3::DATE
         AND scheduled_time = $4::TIME AND status = 'initiated'`,
      [`error: ${(error as Error).message?.substring(0, 100)}`, userId, scheduledDate, scheduledTimeHHMM],
    );

    throw error;
  }
}

// ── Worker instance ──

let aiCoachCallWorker: Worker | null = null;

export function startAICoachCallWorker(): Worker {
  if (aiCoachCallWorker) return aiCoachCallWorker;

  aiCoachCallWorker = new Worker(QueueNames.AI_COACH_CALL, processAICoachCallJob, {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 10000,
    },
  });

  aiCoachCallWorker.on('completed', (job) => {
    logger.debug('[AICoachCallWorker] Job completed', { jobId: job.id });
  });

  aiCoachCallWorker.on('failed', (job, err) => {
    logger.error('[AICoachCallWorker] Job failed', {
      jobId: job?.id,
      error: err.message,
    });
  });

  aiCoachCallWorker.on('error', (err) => {
    logger.error('[AICoachCallWorker] Worker error', { error: err.message });
  });

  aiCoachCallWorker.on('ready', () => {
    logger.info('[AICoachCallWorker] Ready and waiting for jobs');
  });

  logger.info('[AICoachCallWorker] Started', {
    concurrency: 10,
    rateLimit: '50 calls/10s',
  });

  return aiCoachCallWorker;
}
