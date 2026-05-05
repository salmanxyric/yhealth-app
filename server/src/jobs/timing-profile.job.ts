/**
 * @file Timing Profile Job
 *
 * Runs once a day (nightly). For each active user, mines 14 days of
 * engagement signals (messages, check-ins, reminder reads, workout/meal
 * completions) into a 24-hour histogram. Stores the peak and secondary
 * engagement hours so the proactive messaging scorer can bias delivery
 * toward the user's natural activity windows.
 *
 * Cold-start threshold: 14 days since signup + ≥20 events.
 * Staggered at 1260s (21 min) after server boot.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { timingProfileService } from '../services/timing-profile.service.js';

const JOB_INTERVAL_MS = process.env.TIMING_PROFILE_JOB_INTERVAL_MS
  ? parseInt(process.env.TIMING_PROFILE_JOB_INTERVAL_MS, 10)
  : 24 * 60 * 60 * 1000; // daily
const STARTUP_DELAY_MS = process.env.TIMING_PROFILE_STARTUP_DELAY_MS
  ? parseInt(process.env.TIMING_PROFILE_STARTUP_DELAY_MS, 10)
  : 21 * 60 * 1000; // 21 min after boot

const BATCH_SIZE = 5;
const INTER_BATCH_DELAY_MS = 2000;
/** Users fetched per keyset page (avoid loading all stale users into memory). */
const KEYSET_PAGE = 300;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let startupTimeoutId: NodeJS.Timeout | null = null;

async function processOnce(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  const t0 = Date.now();

  try {
    let cursor = '00000000-0000-0000-0000-000000000000';
    let totalSeen = 0;
    let computed = 0;
    let skipped = 0;
    let errors = 0;

    while (true) {
      const page = await query<{ id: string }>(
        `SELECT u.id
         FROM users u
         WHERE u.is_active = true
           AND u.id > $1::uuid
           AND (
             NOT EXISTS (SELECT 1 FROM user_timing_profiles tp WHERE tp.user_id = u.id)
             OR EXISTS (
               SELECT 1 FROM user_timing_profiles tp2
               WHERE tp2.user_id = u.id
                 AND tp2.last_computed_at <= NOW() - INTERVAL '24 hours'
             )
           )
         ORDER BY u.id ASC
         LIMIT $2`,
        [cursor, KEYSET_PAGE]
      );

      if (page.rows.length === 0) break;

      totalSeen += page.rows.length;
      cursor = page.rows[page.rows.length - 1]!.id;

      for (let i = 0; i < page.rows.length; i += BATCH_SIZE) {
        const batch = page.rows.slice(i, i + BATCH_SIZE).map((r) => r.id);
        for (const userId of batch) {
          try {
            const profile = await timingProfileService.computeProfile(userId);
            if (profile) {
              computed++;
            } else {
              skipped++;
            }
          } catch (err) {
            errors++;
            logger.error('[TimingProfileJob] Error computing profile', {
              userId: userId.slice(0, 8),
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
        if (i + BATCH_SIZE < page.rows.length) {
          await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
        }
      }

      if (page.rows.length < KEYSET_PAGE) break;
    }

    logger.info('[TimingProfileJob] Completed', {
      eligibleSeen: totalSeen,
      computed,
      skippedColdStart: skipped,
      errors,
      durationMs: Date.now() - t0,
    });
  } catch (err) {
    logger.error('[TimingProfileJob] Fatal error', {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    isRunning = false;
  }
}

export function startTimingProfileJob(): void {
  if (intervalId) {
    logger.warn('[TimingProfileJob] Already running');
    return;
  }
  logger.info('[TimingProfileJob] Starting', {
    intervalMs: JOB_INTERVAL_MS,
    startupDelayMs: STARTUP_DELAY_MS,
  });
  startupTimeoutId = setTimeout(() => {
    startupTimeoutId = null;
    processOnce().catch(() => {});
    intervalId = setInterval(() => {
      processOnce().catch(() => {});
    }, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopTimingProfileJob(): void {
  if (startupTimeoutId) {
    clearTimeout(startupTimeoutId);
    startupTimeoutId = null;
  }
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export const timingProfileJob = {
  start: startTimingProfileJob,
  stop: stopTimingProfileJob,
  runOnce: processOnce,
};
