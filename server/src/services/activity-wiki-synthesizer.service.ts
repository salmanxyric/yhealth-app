/**
 * @file Activity Wiki Synthesizer Service
 * @description Universal fire-and-forget wiki updater for all user activities.
 * Receives activity events from feature services, updates the appropriate
 * domain wiki page via LLM synthesis, and maintains a "today-digest" page
 * for same-day awareness.
 */

import { logger } from './logger.service.js';
import { modelFactory } from './model-factory.service.js';

// ============================================
// TYPES
// ============================================

export type ActivityDomain =
  | 'workout'
  | 'meal'
  | 'schedule'
  | 'goal'
  | 'mood'
  | 'stress'
  | 'energy'
  | 'habit'
  | 'body-stats'
  | 'water'
  | 'sleep';

export interface ActivityEvent {
  domain: ActivityDomain;
  userId: string;
  eventType: string;
  summary: string;
  payload?: Record<string, unknown>;
}

// ============================================
// CONSTANTS
// ============================================

const DOMAIN_WIKI_SLUG: Record<ActivityDomain, string> = {
  workout: 'fitness-profile',
  meal: 'nutrition-profile',
  schedule: 'lifestyle-context',
  goal: 'goals-strategy',
  mood: 'mental-wellbeing',
  stress: 'mental-wellbeing',
  energy: 'mental-wellbeing',
  habit: 'behavioral-patterns',
  'body-stats': 'fitness-profile',
  water: 'lifestyle-context',
  sleep: 'sleep-profile',
};

const DOMAIN_LABELS: Record<ActivityDomain, string> = {
  workout: 'fitness',
  meal: 'nutrition',
  schedule: 'lifestyle & schedule',
  goal: 'goals & strategy',
  mood: 'mental wellbeing',
  stress: 'mental wellbeing',
  energy: 'mental wellbeing',
  habit: 'behavioral patterns',
  'body-stats': 'fitness & body composition',
  water: 'hydration & lifestyle',
  sleep: 'sleep',
};

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes per domain per user
const TODAY_DIGEST_SLUG = 'today-digest';

// ============================================
// SERVICE
// ============================================

class ActivityWikiSynthesizerService {
  private cooldowns = new Map<string, number>();

  /**
   * Main entry point — called fire-and-forget from feature services.
   * Updates the domain wiki page AND the today-digest page.
   */
  async synthesize(event: ActivityEvent): Promise<void> {
    try {
      // Invalidate comprehensive context cache so next AI coach message sees fresh data
      import('./comprehensive-user-context.service.js')
        .then(({ comprehensiveUserContextService }) => comprehensiveUserContextService.invalidateCache(event.userId))
        .catch(() => {});

      // Always update today's digest (no cooldown — it's a structured append)
      await this.updateTodayDigest(event);

      // Check cooldown for domain wiki synthesis (LLM call)
      const cooldownKey = `${event.userId}:${event.domain}`;
      const lastRun = this.cooldowns.get(cooldownKey) || 0;
      const now = Date.now();

      if (now - lastRun < COOLDOWN_MS) {
        logger.debug('[ActivitySynth] Skipped domain synthesis (cooldown)', {
          domain: event.domain,
          userId: event.userId,
          cooldownRemainingMs: COOLDOWN_MS - (now - lastRun),
        });
        return;
      }

      this.cooldowns.set(cooldownKey, now);
      await this.updateDomainWikiPage(event);
    } catch (error) {
      logger.error('[ActivitySynth] Synthesis failed', {
        domain: event.domain,
        userId: event.userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update the domain-specific wiki page using LLM synthesis.
   * Fetches the existing page body + recent activity context,
   * then asks the LLM to rewrite the page incorporating the new event.
   */
  private async updateDomainWikiPage(event: ActivityEvent): Promise<void> {
    const { wikiService } = await import('./wiki.service.js');
    const slug = DOMAIN_WIKI_SLUG[event.domain];
    const domainLabel = DOMAIN_LABELS[event.domain];

    // Fetch existing wiki page
    const existingPage = await wikiService.getPage(event.userId, slug).catch(() => null);
    const existingBody = existingPage?.body || 'No prior data recorded.';

    const llm = modelFactory.getModel({ tier: 'light', temperature: 0.3, maxTokens: 1024 });

    const prompt = `You are updating a health coaching wiki page about a user's ${domainLabel} patterns.

Current page content:
${existingBody}

New activity event:
- Type: ${event.eventType}
- Summary: ${event.summary}
${event.payload ? `- Details: ${JSON.stringify(event.payload)}` : ''}

Rewrite the page to incorporate the new activity. Rules:
- Keep it concise (10-20 lines of markdown)
- Focus on patterns, trends, and coaching-relevant insights
- Preserve important existing observations
- Note any changes from prior state
- Use bullet points for key facts
- Start with a level-1 heading matching the page topic

Return ONLY the updated page body in markdown.`;

    const response = await llm.invoke([{ role: 'user', content: prompt }]);
    const text = typeof response.content === 'string'
      ? response.content
      : Array.isArray(response.content)
        ? response.content.map((c: any) => c.text || '').join('')
        : '';

    if (!text || text.trim().length < 20) return;

    // Strip markdown code fences if present
    const body = text.replace(/^```(?:markdown)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    if (existingPage) {
      await wikiService.updatePage(event.userId, slug, {
        body,
        confidence: Math.min((existingPage.confidence || 0.3) + 0.03, 1.0),
        changeReason: `Updated from ${event.domain} activity: ${event.eventType}`,
      });
    } else {
      try {
        await wikiService.createPage(event.userId, {
          slug,
          pageType: 'pattern',
          category: event.domain,
          title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          summary: `Tracks ${domainLabel} patterns and coaching insights.`,
          body,
          confidence: 0.3,
        });
      } catch (err) {
        // Race condition: page was created between getPage and createPage — update instead
        if ((err as any)?.code === '23505' || String(err).includes('duplicate key')) {
          await wikiService.updatePage(event.userId, slug, { body, changeReason: `Created from ${event.domain} activity` });
        } else {
          throw err;
        }
      }
    }

    logger.info('[ActivitySynth] Domain wiki updated', {
      userId: event.userId,
      domain: event.domain,
      slug,
    });
  }

  /**
   * Append an entry to the today-digest wiki page.
   * No LLM call — structured chronological append.
   * Auto-resets when the date changes.
   */
  private async updateTodayDigest(event: ActivityEvent): Promise<void> {
    const { wikiService } = await import('./wiki.service.js');
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const domainIcon: Record<ActivityDomain, string> = {
      workout: 'Workout',
      meal: 'Meal',
      schedule: 'Schedule',
      goal: 'Goal',
      mood: 'Mood',
      stress: 'Stress',
      energy: 'Energy',
      habit: 'Habit',
      'body-stats': 'Body Stats',
      water: 'Water',
      sleep: 'Sleep',
    };

    const newEntry = `- **${timeStr}** | ${domainIcon[event.domain]}: ${event.summary}`;

    // Fetch existing digest
    const existingPage = await wikiService.getPage(event.userId, TODAY_DIGEST_SLUG).catch(() => null);

    if (existingPage) {
      const existingBody = existingPage.body || '';

      // Check if this is a new day — reset if date doesn't match
      const dateMatch = existingBody.match(/# Today's Activity Digest — (\d{4}-\d{2}-\d{2})/);
      const isNewDay = !dateMatch || dateMatch[1] !== todayDate;

      let updatedBody: string;
      if (isNewDay) {
        updatedBody = `# Today's Activity Digest — ${todayDate}\n\n## Timeline\n${newEntry}`;
      } else {
        // Append to existing timeline
        updatedBody = existingBody.includes('## Timeline')
          ? existingBody.replace(/(## Timeline\n[\s\S]*?)($)/, `$1\n${newEntry}`)
          : `${existingBody}\n${newEntry}`;
      }

      await wikiService.updatePage(event.userId, TODAY_DIGEST_SLUG, {
        body: updatedBody,
        summary: `Today's activities (${todayDate}). Latest: ${event.summary.slice(0, 60)}`,
        changeReason: `${event.domain} activity logged`,
      });
    } else {
      // Create the digest page for the first time
      const digestBody = `# Today's Activity Digest — ${todayDate}\n\n## Timeline\n${newEntry}`;
      try {
        await wikiService.createPage(event.userId, {
          slug: TODAY_DIGEST_SLUG,
          pageType: 'entity',
          category: 'meta',
          title: `Today's Activity Digest`,
          summary: `Today's activities (${todayDate}). Latest: ${event.summary.slice(0, 60)}`,
          body: digestBody,
          confidence: 0.9,
        });
      } catch (err) {
        // Race condition: page created between getPage and createPage — update instead
        if ((err as any)?.code === '23505' || String(err).includes('duplicate key')) {
          await wikiService.updatePage(event.userId, TODAY_DIGEST_SLUG, { body: digestBody, changeReason: 'First activity of the day' });
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * Convenience method for feature services to call with minimal boilerplate.
   */
  static fireAndForget(event: ActivityEvent): void {
    import('./activity-wiki-synthesizer.service.js')
      .then(({ activityWikiSynthesizer }) => activityWikiSynthesizer.synthesize(event))
      .catch(() => {});
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const activityWikiSynthesizer = new ActivityWikiSynthesizerService();
export default activityWikiSynthesizer;
