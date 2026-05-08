/**
 * @file Wiki Seed Service
 * @description Seeds default domain pages for new users in the LLM Wiki layer.
 * Creates the 9 foundational knowledge pages that form the initial structure
 * of a user's personal wiki, then rebuilds the wiki index.
 */

import { query } from '../config/database.config.js';
import { wikiService } from './wiki.service.js';
import { wikiIndexService } from './wiki-index.service.js';
import { logger } from './logger.service.js';
import type { CreateWikiPageInput } from '@shared/types/domain/wiki.js';

// ============================================
// TYPES
// ============================================

export interface SeedResult {
  pagesCreated: number;
  errors: number;
}

// ============================================
// DEFAULT DOMAIN PAGES
// ============================================

interface DefaultPageDef {
  slug: string;
  pageType: CreateWikiPageInput['pageType'];
  category: string;
  title: string;
  summary: string;
  body: string;
}

const OTHER_PAGE_SLUGS = [
  'fitness-profile',
  'nutrition-profile',
  'sleep-profile',
  'mental-wellbeing',
  'lifestyle-context',
  'goals-strategy',
  'coaching-relationship',
  'behavioral-patterns',
];

const DEFAULT_DOMAIN_PAGES: DefaultPageDef[] = [
  {
    slug: 'fitness-profile',
    pageType: 'pattern',
    category: 'fitness',
    title: 'Fitness Profile',
    summary: 'Tracks fitness activities, exercise patterns, and physical performance.',
    body: [
      '# Fitness Profile',
      '',
      'Comprehensive record of fitness activities, exercise habits, and physical performance metrics.',
      '',
      '## Key Areas',
      '',
      '- Exercise frequency and types',
      '- Workout performance trends',
      '- Physical milestones and PRs',
      '- Recovery patterns',
      '- Activity preferences',
    ].join('\n'),
  },
  {
    slug: 'nutrition-profile',
    pageType: 'pattern',
    category: 'nutrition',
    title: 'Nutrition Profile',
    summary: 'Tracks dietary habits, meal patterns, and nutritional intake.',
    body: [
      '# Nutrition Profile',
      '',
      'Record of dietary habits, meal patterns, and nutritional intake over time.',
      '',
      '## Key Areas',
      '',
      '- Daily caloric intake',
      '- Macronutrient balance',
      '- Meal timing patterns',
      '- Dietary preferences and restrictions',
      '- Hydration habits',
    ].join('\n'),
  },
  {
    slug: 'sleep-profile',
    pageType: 'pattern',
    category: 'sleep',
    title: 'Sleep Profile',
    summary: 'Tracks sleep quality, duration, and rest patterns.',
    body: [
      '# Sleep Profile',
      '',
      'Comprehensive record of sleep quality, duration, and rest patterns.',
      '',
      '## Key Areas',
      '',
      '- Sleep duration and consistency',
      '- Sleep quality metrics',
      '- Bedtime and wake routines',
      '- Sleep environment factors',
      '- Nap patterns',
    ].join('\n'),
  },
  {
    slug: 'mental-wellbeing',
    pageType: 'pattern',
    category: 'wellbeing',
    title: 'Mental Wellbeing',
    summary: 'Tracks emotional health, stress levels, and mental wellness patterns.',
    body: [
      '# Mental Wellbeing',
      '',
      'Record of emotional health, stress levels, and mental wellness over time.',
      '',
      '## Key Areas',
      '',
      '- Mood patterns and trends',
      '- Stress triggers and coping strategies',
      '- Mindfulness and meditation practice',
      '- Emotional resilience indicators',
      '- Mental health check-in history',
    ].join('\n'),
  },
  {
    slug: 'lifestyle-context',
    pageType: 'entity',
    category: 'lifestyle',
    title: 'Lifestyle Context',
    summary: 'Captures lifestyle factors that influence health and wellbeing.',
    body: [
      '# Lifestyle Context',
      '',
      'Background context about lifestyle factors that influence health outcomes.',
      '',
      '## Key Areas',
      '',
      '- Work schedule and demands',
      '- Social connections and support',
      '- Living environment',
      '- Daily routines and habits',
      '- Travel and commute patterns',
    ].join('\n'),
  },
  {
    slug: 'goals-strategy',
    pageType: 'synthesis',
    category: 'goals',
    title: 'Goals & Strategy',
    summary: 'Synthesizes health goals, action plans, and progress tracking.',
    body: [
      '# Goals & Strategy',
      '',
      'Synthesis of health and wellness goals with actionable strategies and progress.',
      '',
      '## Key Areas',
      '',
      '- Active health goals',
      '- Goal progress and milestones',
      '- Strategy adjustments',
      '- Motivation and accountability',
      '- Long-term vision',
    ].join('\n'),
  },
  {
    slug: 'coaching-relationship',
    pageType: 'entity',
    category: 'coaching',
    title: 'Coaching Relationship',
    summary: 'Tracks the AI coaching relationship, preferences, and interaction style.',
    body: [
      '# Coaching Relationship',
      '',
      'Record of AI coaching interaction patterns, preferences, and relationship dynamics.',
      '',
      '## Key Areas',
      '',
      '- Communication style preferences',
      '- Coaching tone and approach',
      '- Feedback responsiveness',
      '- Trust and engagement level',
      '- Interaction frequency',
    ].join('\n'),
  },
  {
    slug: 'behavioral-patterns',
    pageType: 'pattern',
    category: 'behavioral',
    title: 'Behavioral Patterns',
    summary: 'Identifies recurring behavioral patterns across health domains.',
    body: [
      '# Behavioral Patterns',
      '',
      'Cross-domain analysis of recurring behavioral patterns that influence health outcomes.',
      '',
      '## Key Areas',
      '',
      '- Habit formation and consistency',
      '- Trigger-response patterns',
      '- Motivation cycles',
      '- Compliance and adherence trends',
      '- Behavioral change progression',
    ].join('\n'),
  },
  {
    slug: 'user-index',
    pageType: 'synthesis',
    category: 'meta',
    title: 'User Index',
    summary: 'Central index linking all domain pages in the user wiki.',
    body: [
      '# User Index',
      '',
      'Central navigation hub for all domain knowledge pages.',
      '',
      '## Domain Pages',
      '',
      ...OTHER_PAGE_SLUGS.map((slug) => `- [[${slug}]]`),
    ].join('\n'),
  },
];

// ============================================
// WIKI SEED SERVICE CLASS
// ============================================

class WikiSeedService {
  /**
   * Seeds default domain pages for a new user.
   *
   * Checks whether the user already has any wiki pages. If so, returns
   * immediately with zero pages created. Otherwise, creates all 9 default
   * domain pages, rebuilds the wiki index, and logs the operation.
   *
   * Individual page creation failures are caught and counted but do not
   * abort the overall seeding process.
   */
  async seedUser(userId: string): Promise<SeedResult> {
    // 1. Check existing pages
    const existingResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM wiki_pages WHERE user_id = $1`,
      [userId]
    );

    const existingCount = parseInt(existingResult.rows[0]?.count ?? '0', 10);

    if (existingCount > 0) {
      logger.info('Wiki seed skipped: user already has pages', {
        userId,
        existingCount,
      });
      return { pagesCreated: 0, errors: 0 };
    }

    // 2. Create default domain pages
    let pagesCreated = 0;
    let errors = 0;

    for (const pageDef of DEFAULT_DOMAIN_PAGES) {
      try {
        await wikiService.createPage(userId, {
          slug: pageDef.slug,
          pageType: pageDef.pageType,
          category: pageDef.category,
          title: pageDef.title,
          summary: pageDef.summary,
          body: pageDef.body,
          confidence: 0.1,
        });
        pagesCreated++;
      } catch (error) {
        errors++;
        logger.error(`Wiki seed: failed to create page "${pageDef.slug}"`, {
          userId,
          slug: pageDef.slug,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 3. Rebuild index
    await wikiIndexService.rebuildIndex(userId);

    // 4. Log operation
    await wikiService.logOperation(userId, {
      operation: 'create',
      summary: `Seeded ${pagesCreated} default domain pages for new user`,
      pagesTouched: pagesCreated,
    });

    logger.info('Wiki seed completed', { userId, pagesCreated, errors });

    return { pagesCreated, errors };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiSeedService = new WikiSeedService();
