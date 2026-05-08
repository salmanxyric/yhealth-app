/**
 * @file Wiki Index Service
 * @description Maintains a precomputed wiki index per user — counting pages by
 * type/category, detecting orphans/stale/contradictions, and persisting the
 * index to the `wiki_index` table.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface WikiIndexStats {
  pageCount: number;
  countsByType: Record<string, number>;
  countsByCategory: Record<string, number>;
  orphanCount: number;
  staleCount: number;
  contradictedCount: number;
}

// ============================================
// HELPERS
// ============================================

function zeroedStats(): WikiIndexStats {
  return {
    pageCount: 0,
    countsByType: {},
    countsByCategory: {},
    orphanCount: 0,
    staleCount: 0,
    contradictedCount: 0,
  };
}

// ============================================
// WIKI INDEX SERVICE CLASS
// ============================================

class WikiIndexService {
  // ------------------------------------------
  // PUBLIC: rebuildIndex
  // ------------------------------------------

  /**
   * Recomputes all index counters for a user from the live wiki tables, then
   * persists the result to `wiki_index` via an upsert.
   */
  async rebuildIndex(userId: string): Promise<WikiIndexStats> {
    try {
      const [
        totalResult,
        byTypeResult,
        byCategoryResult,
        orphanResult,
        staleResult,
        contradictedResult,
      ] = await Promise.all([
        // 1. Total active/stale page count
        query<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM wiki_pages
           WHERE user_id = $1 AND status IN ('active', 'stale')`,
          [userId]
        ),

        // 2. Counts grouped by page_type
        query<{ page_type: string; count: string }>(
          `SELECT page_type, COUNT(*) AS count
           FROM wiki_pages
           WHERE user_id = $1 AND status IN ('active', 'stale')
           GROUP BY page_type`,
          [userId]
        ),

        // 3. Counts grouped by category
        query<{ category: string; count: string }>(
          `SELECT category, COUNT(*) AS count
           FROM wiki_pages
           WHERE user_id = $1 AND status IN ('active', 'stale')
           GROUP BY category`,
          [userId]
        ),

        // 4. Orphan count (active pages with no inbound links)
        query<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM wiki_pages p
           WHERE p.user_id = $1
             AND p.status = 'active'
             AND NOT EXISTS (
               SELECT 1 FROM wiki_links l WHERE l.target_page_id = p.id
             )`,
          [userId]
        ),

        // 5. Stale count
        query<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM wiki_pages
           WHERE user_id = $1 AND status = 'stale'`,
          [userId]
        ),

        // 6. Contradicted count
        query<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM wiki_pages
           WHERE user_id = $1 AND status = 'contradicted'`,
          [userId]
        ),
      ]);

      // Parse counts
      const pageCount = parseInt(totalResult.rows[0]?.count ?? '0', 10);

      const countsByType: Record<string, number> = {};
      for (const row of byTypeResult.rows) {
        countsByType[row.page_type] = parseInt(row.count, 10);
      }

      const countsByCategory: Record<string, number> = {};
      for (const row of byCategoryResult.rows) {
        countsByCategory[row.category] = parseInt(row.count, 10);
      }

      const orphanCount = parseInt(orphanResult.rows[0]?.count ?? '0', 10);
      const staleCount = parseInt(staleResult.rows[0]?.count ?? '0', 10);
      const contradictedCount = parseInt(contradictedResult.rows[0]?.count ?? '0', 10);

      const stats: WikiIndexStats = {
        pageCount,
        countsByType,
        countsByCategory,
        orphanCount,
        staleCount,
        contradictedCount,
      };

      const indexMarkdown = this.renderIndexMarkdown(stats);

      // Upsert wiki_index row
      await query(
        `INSERT INTO wiki_index (user_id, content, page_count, counts_by_type, counts_by_category, orphan_count, stale_count, contradicted_count, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           content = EXCLUDED.content,
           page_count = EXCLUDED.page_count,
           counts_by_type = EXCLUDED.counts_by_type,
           counts_by_category = EXCLUDED.counts_by_category,
           orphan_count = EXCLUDED.orphan_count,
           stale_count = EXCLUDED.stale_count,
           contradicted_count = EXCLUDED.contradicted_count,
           updated_at = NOW()`,
        [
          userId,
          indexMarkdown,
          pageCount,
          JSON.stringify(countsByType),
          JSON.stringify(countsByCategory),
          orphanCount,
          staleCount,
          contradictedCount,
        ]
      );

      logger.info('Wiki index rebuilt', {
        userId,
        pageCount,
        orphanCount,
        staleCount,
        contradictedCount,
      });

      return stats;
    } catch (error) {
      logger.error('wikiIndexService.rebuildIndex failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return zeroedStats();
    }
  }

  // ------------------------------------------
  // PUBLIC: markStalePages
  // ------------------------------------------

  /**
   * Updates pages whose `updated_at` age exceeds their per-page `stale_after_days`
   * threshold to status = 'stale'. Returns the number of pages marked stale.
   */
  async markStalePages(userId: string): Promise<number> {
    const result = await query<{ id: string; slug: string }>(
      `UPDATE wiki_pages
       SET status = 'stale'
       WHERE user_id = $1
         AND status = 'active'
         AND updated_at < NOW() - (stale_after_days || ' days')::INTERVAL
       RETURNING id, slug`,
      [userId]
    );

    const count = result.rows.length;

    if (count > 0) {
      logger.info('Marked wiki pages as stale', {
        userId,
        count,
        slugs: result.rows.map((r) => r.slug),
      });
    }

    return count;
  }

  // ------------------------------------------
  // PRIVATE: renderIndexMarkdown
  // ------------------------------------------

  private renderIndexMarkdown(stats: WikiIndexStats): string {
    const lines: string[] = [
      '# Wiki Index',
      '',
      `**Total Pages**: ${stats.pageCount}`,
      `**Stale**: ${stats.staleCount}`,
      `**Contradictions**: ${stats.contradictedCount}`,
      `**Orphans**: ${stats.orphanCount}`,
      '',
    ];

    if (Object.keys(stats.countsByType).length > 0) {
      lines.push('## By Type', '');
      for (const [type, count] of Object.entries(stats.countsByType)) {
        lines.push(`- **${type}**: ${count}`);
      }
      lines.push('');
    }

    if (Object.keys(stats.countsByCategory).length > 0) {
      lines.push('## By Category', '');
      for (const [category, count] of Object.entries(stats.countsByCategory)) {
        lines.push(`- **${category}**: ${count}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiIndexService = new WikiIndexService();
