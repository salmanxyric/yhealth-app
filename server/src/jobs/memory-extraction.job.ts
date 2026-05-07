/**
 * @file Memory Extraction Job
 * @description Extracts patterns from daily analysis output and creates/reinforces memories.
 * Runs after daily-analysis completes — patterns seen 3+ times in 14 days become memories.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { memoryEngineService } from '../services/memory-engine.service.js';
import type { IntelligenceCategory, MemoryEvidence } from '@shared/types/domain/intelligence-files.js';

const JOB_INTERVAL_MS = 24 * 60 * 60 * 1000; // Daily
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

async function processMemoryExtraction(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    // Get users with recent daily analysis reports
    const usersResult = await query(
      `SELECT DISTINCT user_id FROM daily_analysis_reports
       WHERE created_at >= CURRENT_DATE - 1`
    );

    let memoriesCreated = 0;
    let memoriesReinforced = 0;

    for (const userRow of usersResult.rows) {
      const userId = userRow.user_id as string;

      try {
        // Fetch recent insights from daily analysis
        const insightsResult = await query(
          `SELECT id, category, insights, created_at::text as date
           FROM daily_analysis_reports
           WHERE user_id = $1 AND created_at >= CURRENT_DATE - 14
           ORDER BY created_at DESC`,
          [userId]
        );

        // Extract recurring patterns
        const patternCounts = new Map<string, {
          count: number;
          category: IntelligenceCategory;
          description: string;
          evidence: MemoryEvidence[];
        }>();

        for (const row of insightsResult.rows) {
          const insights = row.insights as Array<{ claim?: string; category?: string; evidence?: string }> || [];
          for (const insight of insights) {
            if (!insight.claim) continue;

            const key = insight.claim.toLowerCase().trim();
            const existing = patternCounts.get(key) || {
              count: 0,
              category: (insight.category as IntelligenceCategory) || 'cross_domain',
              description: insight.claim,
              evidence: [],
            };

            existing.count++;
            existing.evidence.push({
              source_table: 'daily_analysis_reports',
              source_id: row.id as string,
              date: row.date as string,
              summary: insight.evidence || insight.claim,
            });
            patternCounts.set(key, existing);
          }
        }

        // Create or reinforce memories for patterns seen 3+ times
        for (const [_, pattern] of patternCounts) {
          if (pattern.count < 3) continue;

          try {
            const result = await memoryEngineService.findOrCreatePattern(
              userId,
              pattern.category,
              pattern.description.slice(0, 255),
              pattern.description,
              pattern.evidence.slice(0, 10),
              'ai'
            );

            if (result.wasReinforced) {
              memoriesReinforced++;
            } else {
              memoriesCreated++;
            }
          } catch (err) {
            logger.debug('[MemoryExtraction] Pattern processing failed', {
              userId,
              error: (err as Error).message,
            });
          }
        }
      } catch (err) {
        logger.error('[MemoryExtraction] Failed for user', {
          userId,
          error: (err as Error).message,
        });
      }
    }

    logger.info('[MemoryExtraction] Completed', {
      usersProcessed: usersResult.rows.length,
      memoriesCreated,
      memoriesReinforced,
    });
  } catch (err) {
    logger.error('[MemoryExtraction] Job failed', { error: (err as Error).message });
  } finally {
    isRunning = false;
  }
}

export function startMemoryExtraction(): void {
  if (intervalId) {
    logger.warn('[MemoryExtraction] Already running');
    return;
  }

  logger.info('[MemoryExtraction] Starting memory extraction job (daily)');
  intervalId = setInterval(processMemoryExtraction, JOB_INTERVAL_MS);

  // Run first time after delay (5 AM — after daily analysis at 3-4 AM)
  const now = new Date();
  const msUntil5AM = ((5 - now.getUTCHours() + 24) % 24) * 60 * 60 * 1000;
  setTimeout(processMemoryExtraction, msUntil5AM || JOB_INTERVAL_MS);
}

export function stopMemoryExtraction(): void {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  logger.info('[MemoryExtraction] Stopped');
}

export const memoryExtractionJob = {
  start: startMemoryExtraction,
  stop: stopMemoryExtraction,
  isRunning: () => isRunning,
  processNow: processMemoryExtraction,
};
