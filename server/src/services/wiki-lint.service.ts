/**
 * @file Wiki Lint Service
 * @description Performs automated health checks on a user's wiki —
 * marking stale pages, detecting orphans, finding broken links,
 * rebuilding the index, and logging results.
 */

import { query } from '../config/database.config.js';
import { wikiService } from './wiki.service.js';
import { wikiIndexService } from './wiki-index.service.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface LintResult {
  staleMarked: number;
  orphansFound: number;
  brokenLinks: number;
  errors: number;
}

// ============================================
// WIKI LINT SERVICE CLASS
// ============================================

class WikiLintService {
  /**
   * Runs a full lint pass on a user's wiki:
   *  1. Mark stale pages
   *  2. Detect orphan pages
   *  3. Detect broken links (target missing or archived)
   *  4. Rebuild the index
   *  5. Log operation if any issues found
   *
   * Each step is wrapped in try/catch — errors increment result.errors
   * and log a warning, but do not abort the lint.
   */
  async lintUser(userId: string): Promise<LintResult> {
    const result: LintResult = {
      staleMarked: 0,
      orphansFound: 0,
      brokenLinks: 0,
      errors: 0,
    };

    // Step 1: Mark stale pages
    try {
      result.staleMarked = await wikiIndexService.markStalePages(userId);
    } catch (error) {
      result.errors++;
      logger.warn('WikiLintService: markStalePages failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Step 2: Detect orphan pages
    try {
      const orphans = await wikiService.getOrphans(userId);
      result.orphansFound = orphans.length;
    } catch (error) {
      result.errors++;
      logger.warn('WikiLintService: getOrphans failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Step 3: Detect broken links
    try {
      const brokenResult = await query<{ id: string; source_slug: string; target_slug: string | null }>(
        `SELECT wl.id, sp.slug AS source_slug, tp.slug AS target_slug
         FROM wiki_links wl
         JOIN wiki_pages sp ON sp.id = wl.source_page_id AND sp.user_id = $1
         LEFT JOIN wiki_pages tp ON tp.id = wl.target_page_id AND tp.user_id = $1
         WHERE tp.id IS NULL OR tp.status = 'archived'`,
        [userId]
      );
      result.brokenLinks = brokenResult.rows.length;
    } catch (error) {
      result.errors++;
      logger.warn('WikiLintService: broken links detection failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Step 4: Rebuild index
    try {
      await wikiIndexService.rebuildIndex(userId);
    } catch (error) {
      result.errors++;
      logger.warn('WikiLintService: rebuildIndex failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Step 5: Log operation if any issues found
    const totalIssues = result.staleMarked + result.orphansFound + result.brokenLinks;
    if (totalIssues > 0) {
      try {
        await wikiService.logOperation(userId, {
          operation: 'lint',
          summary: `Lint found ${result.staleMarked} stale, ${result.orphansFound} orphans, ${result.brokenLinks} broken links`,
          pagesTouched: result.staleMarked,
        });
      } catch (error) {
        result.errors++;
        logger.warn('WikiLintService: logOperation failed', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiLintService = new WikiLintService();
