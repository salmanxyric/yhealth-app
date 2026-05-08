/**
 * @file Wiki Compiler Service
 * @description Lightweight memory compiler (Mode 1) that runs after every
 * conversation turn as fire-and-forget. Searches wiki pages matching the
 * user's message and gently bumps their confidence score (reinforcing evidence).
 *
 * This service never delays user responses — it operates non-blocking.
 */

import { wikiService } from './wiki.service.js';
import { logger } from './logger.service.js';
import { wikiSeedService } from './wiki-seed.service.js';

// ============================================
// CONSTANTS
// ============================================

const MAX_PAGES_PER_TURN = 3;
const MIN_MESSAGE_LENGTH = 20;
const CONFIDENCE_BUMP = 0.02;

// ============================================
// TYPES
// ============================================

export interface CompilerResult {
  pagesUpdated: number;
  conversationId: string;
}

// ============================================
// WIKI COMPILER SERVICE
// ============================================

class WikiCompilerService {
  /**
   * Process a single conversation turn.
   *
   * Finds wiki pages matching the user's message and bumps their confidence
   * by CONFIDENCE_BUMP (0.02), capped at 1.0. This reinforces pages that
   * are repeatedly referenced by the user.
   *
   * Fire-and-forget safe — all errors are caught and logged, never rethrown.
   */
  async processConversationTurn(
    userId: string,
    userMessage: string,
    _assistantResponse: string,
    conversationId: string
  ): Promise<CompilerResult> {
    try {
      // Seed wiki for first-time users (no-op if pages already exist)
      await wikiSeedService.seedUser(userId);

      // Skip short messages — not enough signal to be meaningful
      if (userMessage.length < MIN_MESSAGE_LENGTH) {
        return { pagesUpdated: 0, conversationId };
      }

      // Search for wiki pages matching the user's message
      const searchResults = await wikiService.searchPages(userId, userMessage, {
        limit: MAX_PAGES_PER_TURN + 2,
      });

      if (!searchResults || searchResults.length === 0) {
        return { pagesUpdated: 0, conversationId };
      }

      // Limit to top MAX_PAGES_PER_TURN results
      const topResults = searchResults.slice(0, MAX_PAGES_PER_TURN);

      let pagesUpdated = 0;

      for (const pageHit of topResults) {
        const slug = pageHit.page.slug;

        // Load the full page to get current confidence
        const fullPage = await wikiService.getPage(userId, slug);
        if (!fullPage) continue;

        // Bump confidence, capped at 1.0
        const currentConfidence = fullPage.confidence ?? 0.5;
        const newConfidence = Math.min(1.0, currentConfidence + CONFIDENCE_BUMP);

        await wikiService.updatePage(userId, slug, {
          confidence: newConfidence,
          changeReason: `Reinforcing signal from conversation ${conversationId}`,
        });

        pagesUpdated++;
      }

      // Log the compiler run if any pages were updated
      if (pagesUpdated > 0) {
        await wikiService.logOperation(userId, {
          operation: 'update',
          conversationId,
          summary: `Wiki compiler: bumped confidence for ${pagesUpdated} page(s) matching conversation signal`,
          pagesTouched: pagesUpdated,
        });
      }

      return { pagesUpdated, conversationId };
    } catch (error) {
      logger.error('[WikiCompiler] Failed to process conversation turn', {
        error,
        userId,
        conversationId,
      });
      return { pagesUpdated: 0, conversationId };
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiCompilerService = new WikiCompilerService();
