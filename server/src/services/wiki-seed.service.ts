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
import { modelFactory } from './model-factory.service.js';
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
        // 23505 = unique_violation — page already exists (race condition), not a real error
        const errorCode = (error as any)?.code;
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorCode === '23505' || errorMsg.includes('duplicate key')) {
          logger.debug(`Wiki seed: page "${pageDef.slug}" already exists, skipping`, { userId, slug: pageDef.slug });
        } else {
          errors++;
          logger.error(`Wiki seed: failed to create page "${pageDef.slug}"`, {
            userId,
            slug: pageDef.slug,
            error: errorMsg,
          });
        }
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

  /**
   * Populate wiki pages with real content from onboarding/assessment data.
   * Called fire-and-forget after onboarding completion.
   * Uses LLM to synthesize assessment responses, body stats, goals, and
   * preferences into meaningful wiki page bodies.
   */
  async populateFromAssessment(userId: string): Promise<void> {
    try {
      // Ensure seed pages exist first
      await this.seedUser(userId);

      // Gather all onboarding data in parallel
      const [assessmentRows, goalsRows, prefsRows, bodyStatsRows, profileRows] = await Promise.all([
        query<{
          responses: Array<{ questionId: string; answer: string | string[] | number }> | null;
          body_stats: Record<string, number> | null;
          goal_category: string;
          extracted_insights: Record<string, unknown> | null;
        }>(
          `SELECT responses, body_stats, goal_category, extracted_insights
           FROM assessment_responses
           WHERE user_id = $1 AND is_complete = true
           ORDER BY completed_at DESC LIMIT 1`,
          [userId]
        ),
        query<{
          category: string;
          title: string;
          description: string;
          target_value: number | null;
          target_unit: string | null;
          motivation: string | null;
        }>(
          `SELECT category, title, description, target_value, target_unit, motivation
           FROM user_goals WHERE user_id = $1 AND status = 'active'
           ORDER BY is_primary DESC, created_at DESC`,
          [userId]
        ),
        query<{
          coaching_style: string | null;
          preferred_check_in_time: string | null;
          focus_areas: string[] | null;
        }>(
          `SELECT coaching_style, preferred_check_in_time, focus_areas
           FROM user_preferences WHERE user_id = $1`,
          [userId]
        ),
        query<{
          weight_kg: number | null;
          height_cm: number | null;
          body_fat_percentage: number | null;
        }>(
          `SELECT weight_kg, height_cm, body_fat_percentage
           FROM body_stats WHERE user_id = $1
           ORDER BY measured_at DESC LIMIT 1`,
          [userId]
        ),
        query<{
          full_name: string | null;
          gender: string | null;
          date_of_birth: Date | null;
        }>(
          `SELECT full_name, gender, date_of_birth FROM users WHERE id = $1`,
          [userId]
        ),
      ]);

      const assessment = assessmentRows.rows[0];
      const goals = goalsRows.rows;
      const prefs = prefsRows.rows[0];
      const bodyStats = bodyStatsRows.rows[0];
      const profile = profileRows.rows[0];

      // Build a condensed data summary for LLM synthesis
      const dataSummary = this.buildOnboardingDataSummary(assessment, goals, prefs, bodyStats, profile);

      if (!dataSummary) {
        logger.info('[WikiSeed] No substantial onboarding data to populate', { userId });
        return;
      }

      const llm = modelFactory.getModel({ tier: 'light', temperature: 0.3, maxTokens: 2048 });

      const prompt = `You are populating a health coaching knowledge base for a new user based on their onboarding data. Generate wiki page bodies for each domain below.

ONBOARDING DATA:
${dataSummary}

Generate a JSON object with these keys. Each value should be a concise markdown body (5-15 lines) with factual insights from the data. Focus on what a health coach needs to know. If no data exists for a domain, write "No data collected yet."

{
  "fitness-profile": "markdown body about their fitness level, exercise habits, body stats...",
  "nutrition-profile": "markdown body about dietary preferences, restrictions, eating patterns...",
  "sleep-profile": "markdown body about sleep patterns (from assessment if available)...",
  "mental-wellbeing": "markdown body about stress levels, energy, mental health indicators...",
  "lifestyle-context": "markdown body about work schedule, daily routines, lifestyle factors...",
  "goals-strategy": "markdown body about their stated goals, targets, motivations, timelines...",
  "coaching-relationship": "markdown body about coaching style preferences, check-in times...",
  "behavioral-patterns": "markdown body about current habits, past attempts, challenges...",
  "user-index": "markdown summary: who this person is, their primary goals, and key context"
}

Return ONLY valid JSON.`;

      const response = await llm.invoke([{ role: 'user', content: prompt }]);
      const text = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content.map((c: any) => c.text || '').join('')
          : '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('[WikiSeed] LLM returned no valid JSON for wiki population', { userId });
        return;
      }

      const pageBodies = JSON.parse(jsonMatch[0]) as Record<string, string>;

      // Update each wiki page with real content
      const allSlugs = [...OTHER_PAGE_SLUGS, 'user-index'];
      let updated = 0;
      for (const slug of allSlugs) {
        const body = pageBodies[slug];
        if (!body || body === 'No data collected yet.') continue;

        try {
          await wikiService.updatePage(userId, slug, {
            body,
            confidence: 0.5,
            changeReason: 'Populated from onboarding assessment data',
          });
          updated++;
        } catch {
          // Page might not exist yet — try creating it won't happen since seedUser ran first
          logger.warn('[WikiSeed] Failed to update page from assessment', { userId, slug });
        }
      }

      logger.info('[WikiSeed] Wiki populated from onboarding data', { userId, pagesUpdated: updated });
    } catch (error) {
      logger.error('[WikiSeed] Failed to populate from assessment', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private buildOnboardingDataSummary(
    assessment: { responses: Array<{ questionId: string; answer: string | string[] | number }> | null; body_stats: Record<string, number> | null; goal_category: string; extracted_insights: Record<string, unknown> | null } | undefined,
    goals: Array<{ category: string; title: string; description: string; target_value: number | null; target_unit: string | null; motivation: string | null }>,
    prefs: { coaching_style: string | null; preferred_check_in_time: string | null; focus_areas: string[] | null } | undefined,
    bodyStats: { weight_kg: number | null; height_cm: number | null; body_fat_percentage: number | null } | undefined,
    profile: { full_name: string | null; gender: string | null; date_of_birth: Date | null } | undefined,
  ): string | null {
    const parts: string[] = [];

    if (profile) {
      const age = profile.date_of_birth
        ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;
      parts.push(`Profile: ${profile.full_name || 'Unknown'}, ${profile.gender || 'not specified'}, ${age ? `age ${age}` : 'age unknown'}`);
    }

    if (bodyStats && (bodyStats.weight_kg || bodyStats.height_cm)) {
      const stats: string[] = [];
      if (bodyStats.weight_kg) stats.push(`weight: ${bodyStats.weight_kg}kg`);
      if (bodyStats.height_cm) stats.push(`height: ${bodyStats.height_cm}cm`);
      if (bodyStats.body_fat_percentage) stats.push(`body fat: ${bodyStats.body_fat_percentage}%`);
      parts.push(`Body Stats: ${stats.join(', ')}`);
    }

    if (assessment?.body_stats) {
      const abs = assessment.body_stats;
      const entries = Object.entries(abs).filter(([, v]) => v != null && v > 0);
      if (entries.length > 0) {
        parts.push(`Assessment Body Stats: ${entries.map(([k, v]) => `${k}: ${v}`).join(', ')}`);
      }
    }

    if (goals.length > 0) {
      parts.push('Goals:');
      for (const g of goals) {
        let line = `- ${g.title} (${g.category})`;
        if (g.target_value && g.target_unit) line += ` — target: ${g.target_value} ${g.target_unit}`;
        if (g.motivation) line += ` — motivation: ${g.motivation}`;
        parts.push(line);
      }
    }

    if (assessment?.responses && assessment.responses.length > 0) {
      parts.push('Assessment Responses:');
      for (const r of assessment.responses) {
        const answer = Array.isArray(r.answer) ? r.answer.join(', ') : String(r.answer);
        parts.push(`- ${r.questionId}: ${answer}`);
      }
    }

    if (assessment?.extracted_insights) {
      parts.push(`Extracted Insights: ${JSON.stringify(assessment.extracted_insights)}`);
    }

    if (prefs) {
      const prefParts: string[] = [];
      if (prefs.coaching_style) prefParts.push(`coaching style: ${prefs.coaching_style}`);
      if (prefs.preferred_check_in_time) prefParts.push(`check-in time: ${prefs.preferred_check_in_time}`);
      if (prefs.focus_areas?.length) prefParts.push(`focus areas: ${prefs.focus_areas.join(', ')}`);
      if (prefParts.length > 0) parts.push(`Preferences: ${prefParts.join(', ')}`);
    }

    return parts.length > 1 ? parts.join('\n') : null;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const wikiSeedService = new WikiSeedService();
