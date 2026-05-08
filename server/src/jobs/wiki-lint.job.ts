// server/src/jobs/wiki-lint.job.ts
import { query } from '../config/database.config.js';
import { wikiLintService } from '../services/wiki-lint.service.js';
import { logger } from '../services/logger.service.js';

const JOB_INTERVAL_MS = 12 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 1800 * 1000;
const BATCH_SIZE = 5;
const INTER_BATCH_DELAY_MS = 3000;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export async function processWikiLintForAllUsers(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const usersResult = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM wiki_pages
       WHERE status != 'archived'
       ORDER BY user_id
       LIMIT 100`,
    );

    if (usersResult.rows.length === 0) {
      logger.debug('[WikiLint] No users with wiki pages');
      return;
    }

    let totalStale = 0;
    let totalOrphans = 0;
    let totalBroken = 0;
    let totalErrors = 0;

    for (let i = 0; i < usersResult.rows.length; i += BATCH_SIZE) {
      const batch = usersResult.rows.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((row) => wikiLintService.lintUser(row.user_id))
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          totalStale += r.value.staleMarked;
          totalOrphans += r.value.orphansFound;
          totalBroken += r.value.brokenLinks;
          totalErrors += r.value.errors;
        } else {
          totalErrors++;
        }
      }

      if (i + BATCH_SIZE < usersResult.rows.length) {
        await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
      }
    }

    if (totalStale > 0 || totalOrphans > 0 || totalBroken > 0 || totalErrors > 0) {
      logger.info('[WikiLint] Processing complete', {
        usersProcessed: usersResult.rows.length,
        totalStale,
        totalOrphans,
        totalBroken,
        totalErrors,
      });
    }
  } catch (error) {
    logger.error('[WikiLint] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isRunning = false;
  }
}

export function startWikiLint(): void {
  if (intervalId) {
    logger.warn('[WikiLint] Already running');
    return;
  }

  logger.info('[WikiLint] Starting wiki lint job', {
    intervalMs: JOB_INTERVAL_MS,
    startupDelayMs: STARTUP_DELAY_MS,
  });

  setTimeout(() => {
    processWikiLintForAllUsers();
    intervalId = setInterval(processWikiLintForAllUsers, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopWikiLint(): void {
  if (!intervalId) {
    logger.warn('[WikiLint] Not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  logger.info('[WikiLint] Stopped wiki lint job');
}

export function isWikiLintRunning(): boolean {
  return intervalId !== null;
}

export const wikiLintJob = {
  start: startWikiLint,
  stop: stopWikiLint,
  isRunning: isWikiLintRunning,
  processNow: processWikiLintForAllUsers,
};

export default wikiLintJob;
