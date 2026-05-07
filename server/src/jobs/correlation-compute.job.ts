/**
 * @file Correlation Compute Job
 * @description Computes daily cross-domain correlations after data source sync.
 * Runs every 45 minutes (staggered from the 30-min sync job) and processes
 * users who have fresh signals but no recent correlation computation.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { crossDomainCorrelatorService } from '../services/cross-domain-correlator.service.js';

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes
const BATCH_SIZE = 50;
const CORRELATION_COOLDOWN_MIN = 30;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

// ============================================
// JOB PROCESSOR
// ============================================

async function processCorrelationCompute(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Find users with signals today who haven't had a correlation computed recently
    const result = await query<{ user_id: string }>(
      `SELECT DISTINCT dss.user_id
       FROM data_source_signals dss
       WHERE dss.signal_date = $1
         AND NOT EXISTS (
           SELECT 1 FROM user_daily_correlations dc
           WHERE dc.user_id = dss.user_id
             AND dc.correlation_date = $1
             AND dc.computed_at > NOW() - INTERVAL '${CORRELATION_COOLDOWN_MIN} minutes'
         )
       LIMIT $2`,
      [today, BATCH_SIZE],
    );

    if (result.rows.length === 0) return;

    let computed = 0;
    let errors = 0;

    // Process in batches with Promise.allSettled
    const results = await Promise.allSettled(
      result.rows.map(async ({ user_id }) => {
        try {
          await crossDomainCorrelatorService.computeDailyCorrelation(user_id, today);
          computed++;
        } catch (err) {
          errors++;
          logger.warn('[CorrelationCompute] Failed for user', {
            userId: user_id,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }),
    );

    const rejected = results.filter((r) => r.status === 'rejected');
    if (rejected.length > 0) {
      logger.error('[CorrelationCompute] Unexpected rejections', {
        count: rejected.length,
      });
    }

    if (computed > 0 || errors > 0) {
      logger.info('[CorrelationCompute] Batch completed', {
        total: result.rows.length,
        computed,
        errors,
      });
    }
  } catch (error) {
    logger.error('[CorrelationCompute] Job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isRunning = false;
  }
}

// ============================================
// JOB LIFECYCLE
// ============================================

export function startCorrelationComputeJob(): void {
  if (intervalId) {
    logger.warn('[CorrelationCompute] Already running');
    return;
  }

  const intervalMs =
    parseInt(process.env.CORRELATION_COMPUTE_INTERVAL_MS || '', 10) || DEFAULT_INTERVAL_MS;

  logger.info('[CorrelationCompute] Starting correlation compute job', {
    intervalMs,
    intervalHuman: `${(intervalMs / (1000 * 60)).toFixed(0)} min`,
  });

  // Delay first run: 3.5 min after server start (staggered after sync job's 2 min delay)
  setTimeout(processCorrelationCompute, 210_000);
  intervalId = setInterval(processCorrelationCompute, intervalMs);
}

export function stopCorrelationComputeJob(): void {
  if (!intervalId) {
    logger.warn('[CorrelationCompute] Not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  logger.info('[CorrelationCompute] Stopped');
}

// ============================================
// EXPORTS
// ============================================

export const correlationComputeJob = {
  start: startCorrelationComputeJob,
  stop: stopCorrelationComputeJob,
  isRunning: () => isRunning,
  processNow: processCorrelationCompute,
};

export default correlationComputeJob;
