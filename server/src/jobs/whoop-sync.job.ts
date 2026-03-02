/**
 * @file WHOOP Daily Sync Job
 * Runs every hour and syncs WHOOP data for users whose local time is 6:00 AM.
 * This ensures data is fresh even if webhooks are missed or delayed.
 */

import { query } from '../database/pg.js';
import { logger } from '../services/logger.service.js';
import { fetchHistoricalData } from '../services/whoop-data.service.js';

// ============================================
// CONFIGURATION
// ============================================

const JOB_INTERVAL_MS = 60 * 60 * 1000; // Run every hour to catch each timezone's 6am
const STARTUP_DELAY_MS = 240 * 1000; // 4-minute delay to let server warm up
const SYNC_HOUR = 6; // 6 AM local time
const SYNC_DAYS = 1; // Fetch last 1 day of data (daily sync)
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let startupTimeoutId: NodeJS.Timeout | null = null;

// ============================================
// JOB PROCESSOR
// ============================================

async function processWhoopSync(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  const startTime = Date.now();

  try {
    // Find users with active WHOOP integration whose local time is currently 6:XX AM
    const usersResult = await query<{
      id: string;
      timezone: string;
      last_sync_at: string | null;
    }>(
      `SELECT u.id, COALESCE(u.timezone, 'UTC') as timezone, ui.last_sync_at
       FROM users u
       JOIN user_integrations ui ON ui.user_id = u.id
       WHERE ui.provider = 'whoop'
         AND ui.status = 'active'
         AND u.is_active = true
         AND EXTRACT(HOUR FROM (NOW() AT TIME ZONE COALESCE(u.timezone, 'UTC'))) = $1`,
      [SYNC_HOUR]
    );

    const users = usersResult.rows;

    if (users.length === 0) {
      logger.debug('[WhoopSyncJob] No users in 6am window this hour');
      return;
    }

    logger.info('[WhoopSyncJob] Starting daily WHOOP sync', {
      userCount: users.length,
      syncHour: SYNC_HOUR,
    });

    let synced = 0;
    let errors = 0;

    // Process users one at a time to avoid overwhelming WHOOP API
    for (const user of users) {
      try {
        logger.info('[WhoopSyncJob] Syncing WHOOP data', {
          userId: user.id.slice(0, 8),
          timezone: user.timezone,
          lastSync: user.last_sync_at,
        });

        await fetchHistoricalData(user.id, SYNC_DAYS);

        // Update last_sync_at
        await query(
          `UPDATE user_integrations
           SET last_sync_at = NOW(), updated_at = NOW()
           WHERE user_id = $1 AND provider = 'whoop'`,
          [user.id]
        );

        synced++;
      } catch (error) {
        errors++;
        logger.error('[WhoopSyncJob] Failed to sync user', {
          userId: user.id.slice(0, 8),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('[WhoopSyncJob] Daily sync complete', {
      synced,
      errors,
      total: users.length,
      durationMs: duration,
    });
  } catch (error) {
    logger.error('[WhoopSyncJob] Job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  } finally {
    isRunning = false;
  }
}

// ============================================
// JOB CONTROL
// ============================================

export function startWhoopSyncJob(): void {
  if (intervalId !== null) {
    logger.warn('[WhoopSyncJob] Job is already running');
    return;
  }

  logger.info('[WhoopSyncJob] Starting WHOOP sync job', {
    intervalMs: JOB_INTERVAL_MS,
    syncHour: SYNC_HOUR,
    startupDelayMs: STARTUP_DELAY_MS,
  });

  startupTimeoutId = setTimeout(() => {
    startupTimeoutId = null;
    processWhoopSync().catch((error) => {
      logger.error('[WhoopSyncJob] Error in initial run', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    intervalId = setInterval(() => {
      processWhoopSync().catch((error) => {
        logger.error('[WhoopSyncJob] Error in scheduled run', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopWhoopSyncJob(): void {
  logger.info('[WhoopSyncJob] Stopping WHOOP sync job');

  if (startupTimeoutId) {
    clearTimeout(startupTimeoutId);
    startupTimeoutId = null;
  }

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export const whoopSyncJob = {
  start: startWhoopSyncJob,
  stop: stopWhoopSyncJob,
};
