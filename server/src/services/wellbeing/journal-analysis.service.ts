/**
 * @file Journal Analysis Service
 * @description AI-powered journal analysis that runs after entry creation.
 * Analyzes entries for life patterns, emotional state, and coaching insights.
 * Stores results as wiki pages for the AI coach's long-term knowledge base.
 * Generates coach reflections saved back to journal entries.
 */

import { query } from '../../config/database.config.js';
import { logger } from '../logger.service.js';
import { modelFactory } from '../model-factory.service.js';

// ============================================
// TYPES
// ============================================

interface JournalAnalysis {
  emotionalState: {
    primary: string;
    secondary: string | null;
    intensity: number; // 1-10
  };
  themes: string[];
  cognitivePatterns: string[];
  growthSignals: string[];
  riskIndicators: string[];
  lifePatterns: string[];
  coachReflection: string;
  wikiSummary: string;
}

interface RecentEntry {
  entry_text: string;
  prompt_category: string | null;
  sentiment_label: string | null;
  logged_at: string;
}

// ============================================
// SERVICE
// ============================================

class JournalAnalysisService {
  /**
   * Main entry point — called fire-and-forget after journal entry creation.
   * Analyzes the entry, saves insights to journal_insights, generates a
   * coach reflection, and writes/updates a wiki page for long-term memory.
   */
  async analyzeAndStore(userId: string, entryId: string, entryText: string, promptCategory?: string | null): Promise<void> {
    try {
      if (!entryText || entryText.trim().length < 30) return;

      const [analysis, recentEntries] = await Promise.all([
        this.analyzeEntry(entryText, promptCategory),
        this.getRecentEntries(userId, 10),
      ]);

      if (!analysis) return;

      await Promise.all([
        this.saveInsights(userId, entryId, analysis),
        this.saveCoachReflection(entryId, analysis.coachReflection),
        this.updateWikiKnowledge(userId, entryText, analysis, recentEntries),
      ]);

      logger.info('[JournalAnalysis] Entry analyzed and stored', {
        userId,
        entryId,
        themes: analysis.themes,
        patterns: analysis.lifePatterns.length,
      });
    } catch (error) {
      logger.error('[JournalAnalysis] Analysis failed', { userId, entryId, error: String(error) });
    }
  }

  /**
   * Use LLM to analyze a journal entry comprehensively.
   */
  private async analyzeEntry(entryText: string, promptCategory?: string | null): Promise<JournalAnalysis | null> {
    try {
      const llm = modelFactory.getModel({ tier: 'light', temperature: 0.3, maxTokens: 1024 });

      const prompt = `Analyze this journal entry and return a JSON object. Be concise and insightful — focus on what a life coach would find valuable.

Journal entry${promptCategory ? ` (category: ${promptCategory})` : ''}:
"${entryText}"

Return ONLY valid JSON with this structure:
{
  "emotionalState": { "primary": "emotion", "secondary": "emotion or null", "intensity": 1-10 },
  "themes": ["theme1", "theme2"],
  "cognitivePatterns": ["any CBT patterns detected: catastrophizing, all-or-nothing, mind-reading, etc."],
  "growthSignals": ["positive behavioral changes, insights, or breakthroughs"],
  "riskIndicators": ["burnout signals, isolation, negative spirals, etc."],
  "lifePatterns": ["recurring patterns: work-life imbalance, avoidance, perfectionism, etc."],
  "coachReflection": "A 2-3 sentence empathetic coaching reflection — acknowledge what they shared, highlight a key insight, and offer one gentle observation. Write as Cia the coach, in first person.",
  "wikiSummary": "One sentence factual summary of what this entry reveals about the user's current life state."
}`;

      const response = await llm.invoke([{ role: 'user', content: prompt }]);
      const text = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content.map((c: any) => c.text || '').join('')
          : '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      return JSON.parse(jsonMatch[0]) as JournalAnalysis;
    } catch (error) {
      logger.error('[JournalAnalysis] LLM analysis failed', { error: String(error) });
      return null;
    }
  }

  /**
   * Fetch recent journal entries for context (used to detect recurring patterns).
   */
  private async getRecentEntries(userId: string, limit: number): Promise<RecentEntry[]> {
    try {
      const result = await query<RecentEntry>(
        `SELECT entry_text, prompt_category, sentiment_label, logged_at::text
         FROM journal_entries
         WHERE user_id = $1
         ORDER BY logged_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch {
      return [];
    }
  }

  /**
   * Save analysis results to journal_insights table.
   */
  private async saveInsights(userId: string, entryId: string, analysis: JournalAnalysis): Promise<void> {
    try {
      await query(
        `INSERT INTO journal_insights (
          journal_entry_id, user_id, themes,
          emotional_state, cognitive_patterns,
          growth_signals, risk_indicators,
          coaching_suggestion, analyzed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (journal_entry_id)
        DO UPDATE SET
          themes = $3,
          emotional_state = $4,
          cognitive_patterns = $5,
          growth_signals = $6,
          risk_indicators = $7,
          coaching_suggestion = $8,
          analyzed_at = NOW()`,
        [
          entryId,
          userId,
          analysis.themes,
          JSON.stringify(analysis.emotionalState),
          analysis.cognitivePatterns,
          JSON.stringify(analysis.growthSignals),
          JSON.stringify(analysis.riskIndicators),
          analysis.coachReflection,
        ]
      );
    } catch (error) {
      logger.error('[JournalAnalysis] Failed to save insights', { entryId, error: String(error) });
    }
  }

  /**
   * Save the coach reflection directly to the journal entry.
   */
  private async saveCoachReflection(entryId: string, reflection: string): Promise<void> {
    try {
      await query(
        `UPDATE journal_entries
         SET coach_reflection = $1, coach_reflection_at = NOW()
         WHERE id = $2`,
        [reflection, entryId]
      );
    } catch (error) {
      logger.error('[JournalAnalysis] Failed to save coach reflection', { entryId, error: String(error) });
    }
  }

  /**
   * Write or update a wiki page with journal-derived knowledge.
   * Maintains a rolling "journal-patterns" wiki page per user
   * and creates individual entry pages for significant entries.
   */
  private async updateWikiKnowledge(
    userId: string,
    entryText: string,
    analysis: JournalAnalysis,
    recentEntries: RecentEntry[]
  ): Promise<void> {
    try {
      const { wikiService } = await import('../wiki.service.js');

      // 1. Update the rolling "journal-life-patterns" wiki page
      const patternsSlug = 'journal-life-patterns';
      const existingPage = await wikiService.getPage(userId, patternsSlug).catch(() => null);

      const patternBody = this.buildPatternsBody(analysis, recentEntries);

      if (existingPage) {
        await wikiService.updatePage(userId, patternsSlug, {
          body: patternBody,
          summary: `Life patterns from ${recentEntries.length} recent journal entries. Key themes: ${analysis.themes.slice(0, 3).join(', ')}`,
          confidence: Math.min((existingPage.confidence || 0.5) + 0.02, 1.0),
          changeReason: 'Updated from new journal entry analysis',
        });
      } else {
        await wikiService.createPage(userId, {
          slug: patternsSlug,
          pageType: 'pattern',
          category: 'wellbeing',
          title: 'Journal Life Patterns',
          summary: `Life patterns detected from journal entries. Key themes: ${analysis.themes.slice(0, 3).join(', ')}`,
          body: patternBody,
          confidence: 0.5,
        });
      }

      // 2. For significant entries (risk indicators or growth signals), create a dedicated wiki page
      const isSignificant = analysis.riskIndicators.length > 0 || analysis.growthSignals.length > 1;
      if (isSignificant) {
        const dateSlug = new Date().toISOString().slice(0, 10);
        const entrySlug = `journal-insight-${dateSlug}`;
        const existingEntry = await wikiService.getPage(userId, entrySlug).catch(() => null);

        if (!existingEntry) {
          await wikiService.createPage(userId, {
            slug: entrySlug,
            pageType: 'journal',
            category: 'wellbeing',
            title: `Journal Insight — ${dateSlug}`,
            summary: analysis.wikiSummary,
            body: this.buildInsightBody(analysis, entryText),
            confidence: 0.6,
          });
        }
      }
    } catch (error) {
      logger.error('[JournalAnalysis] Wiki update failed', { userId, error: String(error) });
    }
  }

  /**
   * Build the body of the rolling patterns wiki page.
   */
  private buildPatternsBody(analysis: JournalAnalysis, recentEntries: RecentEntry[]): string {
    const sentimentDist = this.computeSentimentDistribution(recentEntries);
    const now = new Date().toISOString().slice(0, 10);

    return `# Journal Life Patterns
Last updated: ${now}
Based on ${recentEntries.length} recent entries.

## Current Emotional State
- Primary: ${analysis.emotionalState.primary} (intensity: ${analysis.emotionalState.intensity}/10)
${analysis.emotionalState.secondary ? `- Secondary: ${analysis.emotionalState.secondary}` : ''}

## Active Themes
${analysis.themes.map(t => `- ${t}`).join('\n')}

## Sentiment Distribution (recent ${recentEntries.length} entries)
- Positive: ${sentimentDist.positive}%
- Neutral: ${sentimentDist.neutral}%
- Negative: ${sentimentDist.negative}%

## Life Patterns Detected
${analysis.lifePatterns.length > 0 ? analysis.lifePatterns.map(p => `- ${p}`).join('\n') : '- No recurring patterns detected yet'}

## Cognitive Patterns
${analysis.cognitivePatterns.length > 0 ? analysis.cognitivePatterns.map(p => `- ${p}`).join('\n') : '- None detected'}

## Growth Signals
${analysis.growthSignals.length > 0 ? analysis.growthSignals.map(s => `- ${s}`).join('\n') : '- None yet'}

## Risk Indicators
${analysis.riskIndicators.length > 0 ? analysis.riskIndicators.map(r => `- ⚠️ ${r}`).join('\n') : '- None detected'}

## Coaching Notes
Use these patterns to personalize coaching. Reference specific themes when they recur.
Celebrate growth signals. Gently address risk indicators through conversation, not direct confrontation.`;
  }

  /**
   * Build the body for a significant entry wiki page.
   */
  private buildInsightBody(analysis: JournalAnalysis, entryText: string): string {
    const preview = entryText.length > 200 ? entryText.slice(0, 200) + '...' : entryText;

    return `## Entry Summary
${analysis.wikiSummary}

## Entry Preview
> ${preview}

## Analysis
- **Emotional State**: ${analysis.emotionalState.primary} (${analysis.emotionalState.intensity}/10)
- **Themes**: ${analysis.themes.join(', ')}
${analysis.growthSignals.length > 0 ? `- **Growth Signals**: ${analysis.growthSignals.join(', ')}` : ''}
${analysis.riskIndicators.length > 0 ? `- **Risk Indicators**: ${analysis.riskIndicators.join(', ')}` : ''}
${analysis.cognitivePatterns.length > 0 ? `- **Cognitive Patterns**: ${analysis.cognitivePatterns.join(', ')}` : ''}
${analysis.lifePatterns.length > 0 ? `- **Life Patterns**: ${analysis.lifePatterns.join(', ')}` : ''}

## Coach Reflection
${analysis.coachReflection}`;
  }

  /**
   * Simple sentiment distribution from recent entries.
   */
  private computeSentimentDistribution(entries: RecentEntry[]): { positive: number; neutral: number; negative: number } {
    if (entries.length === 0) return { positive: 0, neutral: 100, negative: 0 };

    let pos = 0, neu = 0, neg = 0;
    for (const e of entries) {
      if (e.sentiment_label === 'positive') pos++;
      else if (e.sentiment_label === 'negative') neg++;
      else neu++;
    }

    const total = entries.length;
    return {
      positive: Math.round((pos / total) * 100),
      neutral: Math.round((neu / total) * 100),
      negative: Math.round((neg / total) * 100),
    };
  }
}

export const journalAnalysisService = new JournalAnalysisService();
export default journalAnalysisService;
