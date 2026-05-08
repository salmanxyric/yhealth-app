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

const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_MAX_PAGES = 5;
const CHARS_PER_TOKEN = 4;

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

      // 1. Search wiki pages
      const results = await wikiService.searchPages(userId, queryText, { limit: maxPages });

      if (!results || results.length === 0) {
        return '';
      }

      // 2. Load full body for the top result (highest similarity = first item)
      const topResult = results[0];
      const fullPage = await wikiService.getPage(userId, topResult.page.slug);

      // 3. Format the output
      const header = 'WIKI KNOWLEDGE (pre-synthesized from user history):';

      // Top result: full body, truncated to 60% of char budget
      const topBudget = Math.floor(maxChars * 0.6);
      const topBody = fullPage?.body ?? topResult.page.body ?? '';
      const truncatedTopBody = topBody.length > topBudget ? topBody.slice(0, topBudget) + '...' : topBody;

      const topSection = [
        `## ${topResult.page.title}`,
        topResult.page.summary ? `*${topResult.page.summary}*` : '',
        '',
        truncatedTopBody,
      ]
        .filter((line) => line !== '')
        .join('\n');

      // Remaining results: summaries as bullet list
      const remainingResults = results.slice(1);
      let remainingSection = '';
      if (remainingResults.length > 0) {
        const bullets = remainingResults
          .map((r) => {
            const summary = r.page.summary ? `: ${r.page.summary}` : '';
            return `- **${r.page.title}**${summary}`;
          })
          .join('\n');
        remainingSection = `\n\n### Related Topics\n${bullets}`;
      }

      let output = `${header}\n\n${topSection}${remainingSection}`;

      // 4. Final truncation if total output exceeds maxChars
      if (output.length > maxChars) {
        output = output.slice(0, maxChars - 3) + '...';
      }

      return output;
    } catch (error) {
      logger.error('WikiContextService.getContextForQuery failed', { userId, queryText, error });
      return '';
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiContextService = new WikiContextService();
