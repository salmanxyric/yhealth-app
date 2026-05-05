/**
 * @file Memory Decay Job
 * @description Applies time-based confidence decay to memories not accessed recently.
 * Archives memories below threshold. Expires memories past their hard expiry date.
 * Runs daily at 3 AM.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { memoryEngineService } from '../services/memory-engine.service.js';

const JOB_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function processMemoryDecay(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const usersResult = await query(
      `SELECT DISTINCT user_id FROM intelligence_memories WHERE status IN ('active', 'verified')`
    );

    let totalDecayed = 0;
    let totalArchived = 0;

    for (const row of usersResult.rows) {
      const userId = row.user_id as string;
      try {
        const result = await memoryEngineService.applyDecay(userId);
        totalDecayed += result.decayed;
        totalArchived += result.archived;
      } catch (err) {
        logger.error('[MemoryDecay] Failed for user', { userId, error: (err as Error).message });
      }
    }

    logger.info('[MemoryDecay] Completed', {
      usersProcessed: usersResult.rows.length,
      totalDecayed,
      totalArchived,
    });
  } catch (err) {
    logger.error('[MemoryDecay] Job failed', { error: (err as Error).message });
  } finally {
    isRunning = false;
  }
}

export function startMemoryDecay(): void {
  if (intervalId) {
    logger.warn('[MemoryDecay] Already running');
    return;
  }

  logger.info('[MemoryDecay] Starting memory decay job (daily)');
  intervalId = setInterval(processMemoryDecay, JOB_INTERVAL_MS);

  // Run first time after a delay (3 AM offset approximation)
  const now = new Date();
  const msUntil3AM = ((3 - now.getUTCHours() + 24) % 24) * 60 * 60 * 1000;
  setTimeout(processMemoryDecay, msUntil3AM || JOB_INTERVAL_MS);
}

export function stopMemoryDecay(): void {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  logger.info('[MemoryDecay] Stopped');
}

export const memoryDecayJob = {
  start: startMemoryDecay,
  stop: stopMemoryDecay,
  isRunning: () => isRunning,
  processNow: processMemoryDecay,
};
