// server/src/jobs/wiki-synthesis.job.ts
/**
 * @file Wiki Synthesis Job (Memory Compiler Mode 2)
 * @description Scheduled job that runs every 6 hours. For each user with recent
 * wiki activity, it gathers data signals from the last 24 hours, asks the LLM to
 * rewrite wiki domain page narratives, and persists the updates.
 *
 * Follows the same interval-based lifecycle as daily-analysis.job.ts.
 */

import { query } from '../config/database.config.js';
import { wikiService } from '../services/wiki.service.js';
import { wikiIndexService } from '../services/wiki-index.service.js';
import { modelFactory } from '../services/model-factory.service.js';
import { logger } from '../services/logger.service.js';

// ============================================
// CONFIGURATION
// ============================================

const JOB_INTERVAL_MS = 6 * 60 * 60 * 1000; // Every 6 hours
const STARTUP_DELAY_MS = 1620 * 1000; // 27 minutes
const BATCH_SIZE = 3;
const INTER_BATCH_DELAY_MS = 5000;
const MAX_PAGES_PER_SYNTHESIS = 20;
const MAX_SIGNALS_PER_PAGE = 10;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

// Initialize LLM at module load time so the mock reference is captured once
// and individual test invocations of mockLlmInvoke still work after resetMocks.
const llm = modelFactory.getModel({
  tier: 'default',
  temperature: 0.4,
  maxTokens: 2000,
});

// ============================================
// TYPES
// ============================================

export interface SynthesisResult {
  pagesUpdated: number;
  errors: number;
}

interface DataSignal {
  source_table: string;
  summary: string;
}

// ============================================
// PER-USER SYNTHESIS (exported for testing)
// ============================================

export async function processWikiSynthesisForUser(userId: string): Promise<SynthesisResult> {
  const result: SynthesisResult = { pagesUpdated: 0, errors: 0 };

  try {
    // 1. Get user's domain wiki pages (active only)
    const pagesResult = await query<{ slug: string }>(
      `SELECT slug FROM wiki_pages
       WHERE user_id = $1 AND status = 'active'
       ORDER BY confidence DESC
       LIMIT $2`,
      [userId, MAX_PAGES_PER_SYNTHESIS + 5]
    );

    if (pagesResult.rows.length === 0) {
      return result;
    }

    // 2. Check if there are recent data signals (last 24h)
    const signalCountResult = await query<{ signal_count: string }>(
      `SELECT COUNT(*) as signal_count FROM (
        SELECT id FROM wiki_page_sources
          WHERE page_id IN (SELECT id FROM wiki_pages WHERE user_id = $1)
            AND created_at > NOW() - INTERVAL '24 hours'
        UNION ALL
        SELECT id FROM wiki_log
          WHERE user_id = $1
            AND created_at > NOW() - INTERVAL '24 hours'
      ) combined`,
      [userId]
    );

    const signalCount = parseInt(signalCountResult.rows[0]?.signal_count ?? '0', 10);
    if (signalCount === 0) {
      return result;
    }

    // 3. Process each domain page (capped at MAX_PAGES_PER_SYNTHESIS)
    const pageSlugs = pagesResult.rows.slice(0, MAX_PAGES_PER_SYNTHESIS);

    for (const { slug } of pageSlugs) {
      try {
        const fullPage = await wikiService.getPage(userId, slug);
        if (!fullPage) continue;

        const signalsResult = await query<DataSignal>(
          `SELECT wps.source_table, wps.extract_summary as summary
           FROM wiki_page_sources wps
           WHERE wps.page_id = $1
             AND wps.created_at > NOW() - INTERVAL '24 hours'
           ORDER BY wps.created_at DESC
           LIMIT $2`,
          [fullPage.id, MAX_SIGNALS_PER_PAGE]
        );

        if (signalsResult.rows.length === 0) {
          continue;
        }

        const signalsSummary = signalsResult.rows
          .map((s) => `- [${s.source_table}] ${s.summary}`)
          .join('\n');

        const prompt = `You are updating a wiki page for a health coaching system. Rewrite the page narrative to incorporate new evidence.

CURRENT PAGE:
Title: ${fullPage.title}
Category: ${fullPage.category}
Current Summary: ${fullPage.summary}
Current Body:
${fullPage.body}

Current Confidence: ${fullPage.confidence}

NEW EVIDENCE (last 24 hours):
${signalsSummary}

INSTRUCTIONS:
1. Merge the new evidence into the existing narrative naturally
2. Do NOT delete existing insights — augment them
3. Update the confidence score: bump slightly (+0.02-0.05) if evidence reinforces, or flag contradiction
4. Keep the same markdown structure and [[wiki-link]] references
5. Return ONLY valid JSON with this shape:
{
  "summary": "updated one-line summary (max 500 chars)",
  "body": "updated full markdown body",
  "confidence": 0.XX
}`;

        const response = await llm.invoke(prompt);
        const content = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          logger.warn('[WikiSynthesis] LLM returned non-JSON response, skipping page', {
            userId,
            slug,
          });
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]) as {
          summary?: string;
          body?: string;
          confidence?: number;
        };

        if (!parsed.body && !parsed.summary) {
          continue;
        }

        await wikiService.updatePage(userId, slug, {
          ...(parsed.summary && { summary: parsed.summary }),
          ...(parsed.body && { body: parsed.body }),
          ...(parsed.confidence !== undefined && {
            confidence: Math.min(1.0, Math.max(0, parsed.confidence)),
          }),
          changeReason: `Deep synthesis: incorporated ${signalsResult.rows.length} new signal(s)`,
        });

        result.pagesUpdated++;
      } catch (pageError) {
        result.errors++;
        logger.warn('[WikiSynthesis] Failed to synthesize page', {
          userId,
          slug,
          error: pageError instanceof Error ? pageError.message : String(pageError),
        });
      }
    }

    // 4. Rebuild index if any pages were updated
    if (result.pagesUpdated > 0) {
      await wikiIndexService.rebuildIndex(userId);

      await wikiService.logOperation(userId, {
        operation: 'update',
        summary: `Deep synthesis: updated ${result.pagesUpdated} page(s) from ${signalCount} signal(s)`,
        pagesTouched: result.pagesUpdated,
      });
    }
  } catch (error) {
    logger.error('[WikiSynthesis] processWikiSynthesisForUser failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return result;
}

// ============================================
// JOB PROCESSOR
// ============================================

async function processWikiSynthesis(): Promise<void> {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const usersResult = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM wiki_log
       WHERE created_at > NOW() - INTERVAL '24 hours'
       ORDER BY user_id
       LIMIT 50`,
    );

    if (usersResult.rows.length === 0) {
      logger.debug('[WikiSynthesis] No users with recent wiki activity');
      return;
    }

    let totalUpdated = 0;
    let totalErrors = 0;

    for (let i = 0; i < usersResult.rows.length; i += BATCH_SIZE) {
      const batch = usersResult.rows.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((row) => processWikiSynthesisForUser(row.user_id))
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          totalUpdated += r.value.pagesUpdated;
          totalErrors += r.value.errors;
        } else {
          totalErrors++;
        }
      }

      if (i + BATCH_SIZE < usersResult.rows.length) {
        await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
      }
    }

    if (totalUpdated > 0 || totalErrors > 0) {
      logger.info('[WikiSynthesis] Processing complete', {
        usersProcessed: usersResult.rows.length,
        totalPagesUpdated: totalUpdated,
        totalErrors,
      });
    }
  } catch (error) {
    logger.error('[WikiSynthesis] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isRunning = false;
  }
}

// ============================================
// JOB LIFECYCLE
// ============================================

export function startWikiSynthesis(): void {
  if (intervalId) {
    logger.warn('[WikiSynthesis] Already running');
    return;
  }

  logger.info('[WikiSynthesis] Starting wiki synthesis job', {
    intervalMs: JOB_INTERVAL_MS,
    startupDelayMs: STARTUP_DELAY_MS,
    batchSize: BATCH_SIZE,
  });

  setTimeout(() => {
    processWikiSynthesis();
    intervalId = setInterval(processWikiSynthesis, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopWikiSynthesis(): void {
  if (!intervalId) {
    logger.warn('[WikiSynthesis] Not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  logger.info('[WikiSynthesis] Stopped wiki synthesis job');
}

export function isWikiSynthesisRunning(): boolean {
  return intervalId !== null;
}

// ============================================
// EXPORTS
// ============================================

export const wikiSynthesisJob = {
  start: startWikiSynthesis,
  stop: stopWikiSynthesis,
  isRunning: isWikiSynthesisRunning,
  processNow: processWikiSynthesis,
};

export default wikiSynthesisJob;
