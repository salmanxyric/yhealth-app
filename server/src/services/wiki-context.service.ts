/**
 * @file Wiki Context Service
 * @description Loads relevant wiki pages for a given query and formats them
 * as context to inject into the RAG pipeline's system prompt.
 */

import { wikiService } from './wiki.service.js';
import { logger } from './logger.service.js';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_TOKENS = 6000;
const DEFAULT_MAX_PAGES = 8;
const CHARS_PER_TOKEN = 4;
const HIGH_CONFIDENCE_THRESHOLD = 0.7;
const TOP_FULL_BODY_COUNT = 2;

// ============================================
// INTERFACES
// ============================================

interface WikiContextOptions {
  maxTokens?: number;
  maxPages?: number;
}

// ============================================
// WIKI CONTEXT SERVICE
// ============================================

class WikiContextService {
  /**
   * Retrieves and formats wiki pages relevant to a query as an LLM context string.
   *
   * @param userId   - The user whose wiki to search
   * @param queryText - The query to search against
   * @param options   - Optional token/page budget overrides
   * @returns Formatted wiki context string, or '' if no results or on error
   */
  async getContextForQuery(
    userId: string,
    queryText: string,
    options?: WikiContextOptions
  ): Promise<string> {
    try {
      const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
      const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
      const maxChars = maxTokens * CHARS_PER_TOKEN;

      // 1. Search wiki pages + fetch high-confidence pages in parallel
      const [searchResults, highConfidencePages] = await Promise.all([
        wikiService.searchPages(userId, queryText, { limit: maxPages }),
        this.getHighConfidencePages(userId),
      ]);

      // 2. Merge results — high-confidence pages that aren't already in search results
      type PageRef = { slug: string; title: string; summary: string | null; body: string | null };
      const searchSlugs = new Set((searchResults || []).map(r => r.page.slug));
      const merged: PageRef[] = (searchResults || []).map(r => ({
        slug: r.page.slug, title: r.page.title, summary: r.page.summary, body: r.page.body,
      }));
      for (const hcPage of highConfidencePages) {
        if (!searchSlugs.has(hcPage.slug)) {
          merged.push(hcPage);
        }
      }

      if (merged.length === 0) {
        return '';
      }

      // 3. Load full bodies for top results
      const topResults = merged.slice(0, TOP_FULL_BODY_COUNT);
      const fullPages = await Promise.all(
        topResults.map(r => wikiService.getPage(userId, r.slug).catch(() => null))
      );

      // 4. Format output
      const header = 'WIKI KNOWLEDGE (pre-synthesized from user history):';
      const bodyBudgetPerPage = Math.floor(maxChars * 0.7 / TOP_FULL_BODY_COUNT);

      const topSections = topResults.map((r, i) => {
        const body = fullPages[i]?.body ?? r.body ?? '';
        const truncated = body.length > bodyBudgetPerPage ? body.slice(0, bodyBudgetPerPage) + '...' : body;
        return [
          `## ${r.title}`,
          r.summary ? `*${r.summary}*` : '',
          '',
          truncated,
        ].filter(line => line !== '').join('\n');
      }).join('\n\n');

      // Remaining results: summaries as bullet list
      const remainingResults = merged.slice(TOP_FULL_BODY_COUNT);
      let remainingSection = '';
      if (remainingResults.length > 0) {
        const bullets = remainingResults
          .map((r) => {
            const summary = r.summary ? `: ${r.summary}` : '';
            return `- **${r.title}**${summary}`;
          })
          .join('\n');
        remainingSection = `\n\n### Related Topics\n${bullets}`;
      }

      let output = `${header}\n\n${topSections}${remainingSection}`;

      if (output.length > maxChars) {
        output = output.slice(0, maxChars - 3) + '...';
      }

      return output;
    } catch (error) {
      logger.error('WikiContextService.getContextForQuery failed', { userId, queryText, error });
      return '';
    }
  }

  /**
   * Fetch wiki pages with high confidence scores — these represent
   * well-established knowledge that should always be available to the coach.
   */
  private async getHighConfidencePages(userId: string): Promise<Array<{ slug: string; title: string; summary: string | null; body: string | null }>> {
    try {
      const { query } = await import('../config/database.config.js');
      const result = await query<{ slug: string; title: string; summary: string | null; body: string | null }>(
        `SELECT slug, title, summary, body FROM wiki_pages
         WHERE user_id = $1 AND confidence >= $2
         ORDER BY confidence DESC
         LIMIT 5`,
        [userId, HIGH_CONFIDENCE_THRESHOLD]
      );
      return result.rows;
    } catch {
      return [];
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiContextService = new WikiContextService();
