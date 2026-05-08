/**
 * @file Wiki Ingest Service
 * @description Manages domain page initialization for new users and ingests
 * conversation history into wiki evidence, updating matching pages.
 */

import { query } from '../config/database.config.js';
import { wikiService } from './wiki.service.js';
import { wikiIndexService } from './wiki-index.service.js';
import { logger } from './logger.service.js';

// ============================================
// CONSTANTS
// ============================================

const MAX_CONVERSATION_MESSAGES = 20;
const MAX_PAGES_PER_INGEST = 8;

const EVENT_TYPE_TO_SLUG: Record<string, string> = {
  workout: 'fitness-profile',
  nutrition: 'nutrition-profile',
  wellbeing: 'mental-wellbeing',
  participation: 'lifestyle-context',
};

const DATA_EVENT_CONFIDENCE_BUMP = 0.01;

// ============================================
// TYPES
// ============================================

interface DomainPageDef {
  slug: string;
  title: string;
  category: string;
  summary: string;
}

export interface IngestResult {
  conversationId: string;
  pagesCreated: number;
  pagesUpdated: number;
  linksAdded: number;
}

export interface DataEventInput {
  type: 'workout' | 'nutrition' | 'wellbeing' | 'participation';
  eventId: string;
  source: string;
  timestamp: string;
}

// ============================================
// DOMAIN PAGE DEFINITIONS
// ============================================

const DOMAIN_PAGES: DomainPageDef[] = [
  {
    slug: 'user-index',
    title: 'Profile Summary',
    category: 'cross_domain',
    summary: 'Master overview of all user patterns, goals, and insights.',
  },
  {
    slug: 'fitness-profile',
    title: 'Fitness Profile',
    category: 'fitness',
    summary: 'Workout patterns, exercise preferences, and training history.',
  },
  {
    slug: 'nutrition-profile',
    title: 'Nutrition Profile',
    category: 'nutrition',
    summary: 'Dietary habits, meal patterns, and nutrition preferences.',
  },
  {
    slug: 'sleep-profile',
    title: 'Sleep Profile',
    category: 'sleep',
    summary: 'Sleep quality patterns, duration trends, and sleep hygiene habits.',
  },
  {
    slug: 'mental-wellbeing',
    title: 'Mental Wellbeing',
    category: 'wellbeing',
    summary: 'Stress patterns, mood trends, emotional triggers, and coping strategies.',
  },
  {
    slug: 'lifestyle-context',
    title: 'Lifestyle Context',
    category: 'lifestyle',
    summary: 'Daily routines, work-life balance, and social patterns.',
  },
  {
    slug: 'goals-strategy',
    title: 'Goals Strategy',
    category: 'cross_domain',
    summary: 'Active goals, achievement history, and obstacle patterns.',
  },
  {
    slug: 'coaching-relationship',
    title: 'Coaching Relationship',
    category: 'cross_domain',
    summary: 'Coaching style preferences, communication patterns, and trust calibration.',
  },
  {
    slug: 'behavioral-patterns',
    title: 'Behavioral Patterns',
    category: 'behavioral',
    summary: 'Consistency profile, motivation triggers, and failure modes.',
  },
];

// ============================================
// WIKI INGEST SERVICE
// ============================================

class WikiIngestService {
  // ------------------------------------------
  // initializeDomainPages
  // ------------------------------------------

  /**
   * Creates the 9 predefined domain hierarchy pages for a new user.
   * Skips if the user already has any wiki pages.
   */
  async initializeDomainPages(userId: string): Promise<{ pagesCreated: number }> {
    try {
      // Check if user already has wiki pages
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM wiki_pages WHERE user_id = $1`,
        [userId]
      );

      const existingCount = parseInt(countResult.rows[0]?.count ?? '0', 10);
      if (existingCount > 0) {
        logger.info(`[WikiIngest] User already has ${existingCount} wiki pages — skipping initialization`, { userId });
        return { pagesCreated: 0 };
      }

      // Create each domain page
      let pagesCreated = 0;
      for (const def of DOMAIN_PAGES) {
        await wikiService.createPage(userId, {
          slug: def.slug,
          pageType: 'pattern',
          category: def.category,
          title: def.title,
          summary: def.summary,
          body: `No data yet. This page will be populated as ${def.title.toLowerCase()} data is collected from your conversations.`,
          confidence: 0.1,
        });
        pagesCreated++;
      }

      // Create links from user-index to all other domain pages
      const otherPages = DOMAIN_PAGES.filter((p) => p.slug !== 'user-index');
      for (const def of otherPages) {
        try {
          await wikiService.createLink(userId, {
            sourceSlug: 'user-index',
            targetSlug: def.slug,
            linkType: 'reference',
            context: `Domain overview link to ${def.title}`,
          });
        } catch (linkErr) {
          // Log but don't fail the whole initialization if a link fails
          logger.warn(`[WikiIngest] Failed to create link user-index -> ${def.slug}`, {
            userId,
            error: linkErr instanceof Error ? linkErr.message : String(linkErr),
          });
        }
      }

      // Rebuild wiki index after all pages are created
      await wikiIndexService.rebuildIndex(userId);

      // Log the operation
      await wikiService.logOperation(userId, {
        operation: 'create',
        summary: `Initialized ${pagesCreated} domain hierarchy pages for new user`,
        pagesTouched: pagesCreated,
      });

      logger.info(`[WikiIngest] Initialized ${pagesCreated} domain pages`, { userId });
      return { pagesCreated };
    } catch (error) {
      logger.error('[WikiIngest] initializeDomainPages failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { pagesCreated: 0 };
    }
  }

  // ------------------------------------------
  // ingestFromConversation
  // ------------------------------------------

  /**
   * Ingests recent conversation messages into wiki evidence.
   * Searches for matching wiki pages and bumps their confidence.
   */
  async ingestFromConversation(userId: string, conversationId: string): Promise<IngestResult> {
    const emptyResult: IngestResult = {
      conversationId,
      pagesCreated: 0,
      pagesUpdated: 0,
      linksAdded: 0,
    };

    try {
      // Fetch recent conversation messages
      const messagesResult = await query<{ role: string; content: string }>(
        `SELECT role, content FROM rag_messages WHERE conversation_id = $1 ORDER BY sequence_number DESC LIMIT $2`,
        [conversationId, MAX_CONVERSATION_MESSAGES]
      );

      if (!messagesResult.rows || messagesResult.rows.length === 0) {
        return emptyResult;
      }

      // Build combined text from messages, truncated to 2000 chars
      const combinedText = messagesResult.rows
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')
        .slice(0, 2000);

      // Search wiki for matching pages
      const searchResults = await wikiService.searchPages(userId, combinedText, {
        limit: MAX_PAGES_PER_INGEST,
      });

      if (!searchResults || searchResults.length === 0) {
        return emptyResult;
      }

      let pagesUpdated = 0;

      for (const hit of searchResults) {
        const slug = hit.page.slug;

        // Load full page to get current confidence
        const fullPage = await wikiService.getPage(userId, slug);
        if (!fullPage) continue;

        // Bump confidence by 0.03, capped at 1.0
        const newConfidence = Math.min(1.0, (fullPage.confidence ?? 0.1) + 0.03);

        await wikiService.updatePage(userId, slug, {
          confidence: newConfidence,
          changeReason: `Ingest from conversation ${conversationId}`,
        });

        // Add conversation as a source
        await wikiService.addSources(fullPage.id, [
          {
            sourceType: 'conversation',
            sourceId: conversationId,
            sourceTable: 'rag_messages',
            extractSummary: `Conversation evidence: ${combinedText.slice(0, 200)}`,
          },
        ]);

        pagesUpdated++;
      }

      // Rebuild index and log if any pages were touched
      if (pagesUpdated > 0) {
        await wikiIndexService.rebuildIndex(userId);

        await wikiService.logOperation(userId, {
          operation: 'ingest',
          conversationId,
          summary: `Ingested conversation ${conversationId}: updated ${pagesUpdated} wiki page(s)`,
          pagesTouched: pagesUpdated,
        });
      }

      logger.info(`[WikiIngest] Conversation ingest complete`, {
        userId,
        conversationId,
        pagesUpdated,
      });

      return {
        conversationId,
        pagesCreated: 0,
        pagesUpdated,
        linksAdded: 0,
      };
    } catch (error) {
      logger.error('[WikiIngest] ingestFromConversation failed', {
        userId,
        conversationId,
        error: error instanceof Error ? error.message : String(error),
      });
      return emptyResult;
    }
  }

  // ------------------------------------------
  // ingestFromDataEvent
  // ------------------------------------------

  /**
   * Micro-ingest a single data event (workout, meal, mood, etc.)
   * into the matching wiki domain page. No LLM call — just bumps
   * confidence and adds a source reference.
   */
  async ingestFromDataEvent(
    userId: string,
    event: DataEventInput
  ): Promise<{ pagesUpdated: number }> {
    try {
      const slug = EVENT_TYPE_TO_SLUG[event.type];
      if (!slug) {
        return { pagesUpdated: 0 };
      }

      const page = await wikiService.getPage(userId, slug);
      if (!page) {
        return { pagesUpdated: 0 };
      }

      const newConfidence = Math.min(1.0, (page.confidence ?? 0.1) + DATA_EVENT_CONFIDENCE_BUMP);

      await wikiService.updatePage(userId, slug, {
        confidence: newConfidence,
        changeReason: `Micro-ingest: ${event.type} event (${event.source})`,
      });

      await wikiService.addSources(page.id, [
        {
          sourceType: 'activity_event',
          sourceId: event.eventId,
          sourceTable: 'activity_events',
          extractSummary: `${event.type} event from ${event.source} at ${event.timestamp}`,
        },
      ]);

      return { pagesUpdated: 1 };
    } catch (error) {
      logger.error('[WikiIngest] ingestFromDataEvent failed', {
        userId,
        event,
        error: error instanceof Error ? error.message : String(error),
      });
      return { pagesUpdated: 0 };
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiIngestService = new WikiIngestService();
