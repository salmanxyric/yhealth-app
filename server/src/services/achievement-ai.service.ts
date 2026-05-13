/**
 * @file Achievement AI Service
 * @description Uses LLM to generate personalized, emotionally resonant achievement cards
 * based on user goals, progress history, and behavioral patterns.
 *
 * Rate-limited: 1 AI generation per goal creation + 1 batch per daily analysis.
 * Falls back to rule-based generation if LLM is unavailable.
 */

import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { modelFactory } from './model-factory.service.js';
import { llmCircuitBreaker } from './llm-circuit-breaker.service.js';
import { dynamicAchievementsService } from './dynamic-achievements.service.js';
import type { DynamicAchievement } from './dynamic-achievements.service.js';

// ============================================
// TYPES
// ============================================

interface UserGoalContext {
  id: string;
  title: string;
  description?: string;
  category?: string;
  targetValue?: number;
  targetUnit?: string;
  frequency?: string;
  status: string;
}

interface UserProgressSnapshot {
  totalActivities: number;
  currentStreak: number;
  longestStreak: number;
  daysActive: number;
  goalsCompleted: number;
  recentMicroWins: string[];
}

interface AIAchievementCandidate {
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  emotionalContext: string;
  threshold: number;
}

// ============================================
// PROMPTS
// ============================================

const GOAL_ACHIEVEMENT_SYSTEM_PROMPT = `You are an empathetic AI health coach creating personalized achievement milestones.
Generate achievement cards that:
- Celebrate progress relative to where the user STARTED (not absolute numbers)
- Use emotionally resonant language that makes the user feel seen
- Reference specific behavioral changes ("You used to X, now you Y")
- Scale difficulty based on the user's capacity and goal type
- Include motivational emotional context

Respond with valid JSON array only. No markdown, no explanation.
Each achievement object: { "title": string, "description": string, "icon": string (single emoji), "rarity": "common"|"rare"|"epic"|"legendary", "emotionalContext": string, "threshold": number }

Generate exactly 5 progressive milestones from easy (common) to aspirational (legendary).`;

const MICRO_WIN_SYSTEM_PROMPT = `You are an empathetic AI coach celebrating small victories.
Given user progress data, generate a personalized achievement that celebrates something the user might not notice themselves.
Focus on behavioral patterns, consistency improvements, or comeback stories.

Respond with valid JSON object only: { "title": string, "description": string, "icon": string (single emoji), "rarity": "common"|"rare"|"epic", "emotionalContext": string }`;

// ============================================
// SERVICE
// ============================================

class AchievementAIService {
  private _llm: BaseChatModel | null = null;

  private get llm(): BaseChatModel {
    if (!this._llm) {
      this._llm = modelFactory.getModel({ tier: 'light', temperature: 0.7, maxTokens: 1024 });
    }
    return this._llm;
  }

  /**
   * Generate AI-personalized achievements for a new goal.
   * Falls back to rule-based generation if LLM fails.
   */
  async generateForGoal(
    userId: string,
    goal: UserGoalContext,
    progressSnapshot?: UserProgressSnapshot,
  ): Promise<DynamicAchievement[]> {
    if (!llmCircuitBreaker.isCallAllowed()) {
      logger.info('[AchievementAI] Circuit breaker open, using rule-based fallback');
      return this.fallbackGoalAchievements(userId, goal);
    }

    try {
      const snapshot = progressSnapshot || await this.getUserProgressSnapshot(userId);

      const userPrompt = `User Goal: "${goal.title}"
Category: ${goal.category || 'general'}
Target: ${goal.targetValue || 'not specified'} ${goal.targetUnit || ''}
Frequency: ${goal.frequency || 'daily'}

User Context:
- ${snapshot.totalActivities} total activities completed
- Current streak: ${snapshot.currentStreak} days
- Longest streak: ${snapshot.longestStreak} days
- ${snapshot.daysActive} days active on the platform
- ${snapshot.goalsCompleted} goals completed so far
${snapshot.recentMicroWins.length > 0 ? `- Recent wins: ${snapshot.recentMicroWins.slice(0, 3).join(', ')}` : ''}

Generate 5 progressive achievement milestones for this specific goal, personalized to this user's journey.`;

      const response = await this.llm.invoke([
        new SystemMessage(GOAL_ACHIEVEMENT_SYSTEM_PROMPT),
        new HumanMessage(userPrompt),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      const candidates = this.parseAchievements(content);
      if (candidates.length === 0) {
        logger.warn('[AchievementAI] LLM returned no valid achievements, falling back');
        return this.fallbackGoalAchievements(userId, goal);
      }

      return this.persistGoalAchievements(userId, goal.id, candidates);
    } catch (error) {
      logger.error('[AchievementAI] LLM generation failed', {
        userId,
        goalId: goal.id,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate'))) {
        llmCircuitBreaker.recordRateLimitError(error);
      }

      return this.fallbackGoalAchievements(userId, goal);
    }
  }

  /**
   * Generate a personalized micro-win achievement from behavioral data.
   */
  async generateMicroWinAchievement(
    userId: string,
    winContext: { type: string; title: string; description: string; metric: string; currentValue: number; previousValue: number },
  ): Promise<DynamicAchievement | null> {
    if (!llmCircuitBreaker.isCallAllowed()) return null;

    try {
      const snapshot = await this.getUserProgressSnapshot(userId);

      const userPrompt = `Micro-win detected:
Type: ${winContext.type}
What happened: ${winContext.title} - ${winContext.description}
Metric: ${winContext.metric} improved from ${winContext.previousValue} to ${winContext.currentValue}

User context:
- ${snapshot.currentStreak} day streak
- ${snapshot.totalActivities} total activities
- ${snapshot.daysActive} days on platform

Create a personalized achievement card celebrating this specific improvement. Make it feel personal and motivating.`;

      const response = await this.llm.invoke([
        new SystemMessage(MICRO_WIN_SYSTEM_PROMPT),
        new HumanMessage(userPrompt),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      const candidate = this.parseSingleAchievement(content);
      if (!candidate) return null;

      const result = await query<{ id: string }>(
        `INSERT INTO dynamic_achievements
          (user_id, title, description, icon, category, rarity, type, xp_reward,
           max_progress, current_progress, unlocked, unlocked_at, emotional_context)
         VALUES ($1, $2, $3, $4, 'micro-win', $5, 'micro-win', $6, 1, 1, TRUE, NOW(), $7)
         RETURNING id`,
        [
          userId,
          candidate.title,
          candidate.description,
          candidate.icon,
          candidate.rarity,
          candidate.rarity === 'epic' ? 100 : candidate.rarity === 'rare' ? 50 : 25,
          candidate.emotionalContext,
        ],
      );

      if (result.rows.length === 0) return null;

      return {
        id: result.rows[0].id,
        userId,
        title: candidate.title,
        description: candidate.description,
        icon: candidate.icon,
        category: 'micro-win',
        rarity: candidate.rarity,
        type: 'micro-win',
        xpReward: candidate.rarity === 'epic' ? 100 : candidate.rarity === 'rare' ? 50 : 25,
        maxProgress: 1,
        currentProgress: 1,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        emotionalContext: candidate.emotionalContext,
        sourceGoalId: null,
        aiGenerated: true,
      };
    } catch (error) {
      logger.error('[AchievementAI] Micro-win generation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  }

  /**
   * Batch check: evaluate all users with pending goal achievements.
   * Designed for background job - processes in batches to respect LLM rate limits.
   */
  async batchCheckGoalProgress(batchSize: number = 100): Promise<number> {
    try {
      const usersResult = await query<{ user_id: string }>(
        `SELECT DISTINCT user_id FROM dynamic_achievements
         WHERE unlocked = FALSE AND type = 'goal' AND source_goal_id IS NOT NULL
         LIMIT $1`,
        [batchSize],
      );

      let totalUnlocked = 0;
      for (const row of usersResult.rows) {
        const unlocked = await dynamicAchievementsService.checkGoalProgress(row.user_id);
        totalUnlocked += unlocked.length;
      }

      if (totalUnlocked > 0) {
        logger.info('[AchievementAI] Batch progress check complete', {
          usersChecked: usersResult.rows.length,
          achievementsUnlocked: totalUnlocked,
        });
      }

      return totalUnlocked;
    } catch (error) {
      logger.error('[AchievementAI] Batch check failed', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return 0;
    }
  }

  // ── Private helpers ──

  private async getUserProgressSnapshot(userId: string): Promise<UserProgressSnapshot> {
    const result = await query<{
      total_activities: string;
      current_streak: string;
      longest_streak: string;
      days_active: string;
      goals_completed: string;
    }>(
      `WITH activity_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed') as total_activities,
          COUNT(DISTINCT scheduled_date) FILTER (WHERE status = 'completed') as days_active
        FROM activity_logs WHERE user_id = $1
      ),
      goal_stats AS (
        SELECT COUNT(*) FILTER (WHERE status = 'completed') as goals_completed
        FROM user_goals WHERE user_id = $1
      ),
      streak_calc AS (
        SELECT scheduled_date,
          scheduled_date - (ROW_NUMBER() OVER (ORDER BY scheduled_date))::INTEGER AS grp
        FROM (
          SELECT scheduled_date
          FROM activity_logs WHERE user_id = $1 AND status = 'completed'
          GROUP BY scheduled_date
        ) d
      ),
      current_streak AS (
        SELECT COUNT(*) as val FROM (
          SELECT scheduled_date, ROW_NUMBER() OVER (ORDER BY scheduled_date DESC) as rn
          FROM (SELECT DISTINCT scheduled_date FROM activity_logs WHERE user_id = $1 AND status = 'completed') d
        ) sub WHERE scheduled_date >= CURRENT_DATE - rn::INTEGER
      ),
      longest_streak AS (
        SELECT COALESCE(MAX(c), 0) as val
        FROM (SELECT COUNT(*) as c FROM streak_calc GROUP BY grp) s
      )
      SELECT a.total_activities, cs.val as current_streak, ls.val as longest_streak,
             a.days_active, g.goals_completed
      FROM activity_stats a
      CROSS JOIN goal_stats g
      CROSS JOIN current_streak cs
      CROSS JOIN longest_streak ls`,
      [userId],
    );

    const row = result.rows[0];

    // Get recent micro-wins
    let recentMicroWins: string[] = [];
    try {
      const winsResult = await query<{ title: string }>(
        `SELECT title FROM micro_wins WHERE user_id = $1 AND dismissed = FALSE
         ORDER BY detected_at DESC LIMIT 3`,
        [userId],
      );
      recentMicroWins = winsResult.rows.map((r) => r.title);
    } catch {
      // micro_wins table may not exist
    }

    return {
      totalActivities: parseInt(row?.total_activities || '0'),
      currentStreak: parseInt(row?.current_streak || '0'),
      longestStreak: parseInt(row?.longest_streak || '0'),
      daysActive: parseInt(row?.days_active || '0'),
      goalsCompleted: parseInt(row?.goals_completed || '0'),
      recentMicroWins,
    };
  }

  private parseAchievements(raw: string): AIAchievementCandidate[] {
    try {
      const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      return arr
        .filter(
          (a: Record<string, unknown>) =>
            a.title && a.description && a.icon && a.rarity && a.emotionalContext,
        )
        .map((a: Record<string, unknown>) => ({
          title: String(a.title).substring(0, 200),
          description: String(a.description).substring(0, 500),
          icon: String(a.icon).substring(0, 10),
          rarity: (['common', 'rare', 'epic', 'legendary'].includes(String(a.rarity))
            ? String(a.rarity)
            : 'common') as AIAchievementCandidate['rarity'],
          emotionalContext: String(a.emotionalContext).substring(0, 500),
          threshold: typeof a.threshold === 'number' ? a.threshold : 1,
        }));
    } catch (error) {
      logger.warn('[AchievementAI] Failed to parse LLM response', {
        error: error instanceof Error ? error.message : 'Unknown',
        rawLength: raw.length,
      });
      return [];
    }
  }

  private parseSingleAchievement(raw: string): AIAchievementCandidate | null {
    const results = this.parseAchievements(raw);
    return results.length > 0 ? results[0] : null;
  }

  private async persistGoalAchievements(
    userId: string,
    goalId: string,
    candidates: AIAchievementCandidate[],
  ): Promise<DynamicAchievement[]> {
    const created: DynamicAchievement[] = [];

    for (const candidate of candidates) {
      try {
        const xpReward =
          candidate.rarity === 'legendary' ? 200
          : candidate.rarity === 'epic' ? 100
          : candidate.rarity === 'rare' ? 50
          : 25;

        const result = await query<{ id: string }>(
          `INSERT INTO dynamic_achievements
            (user_id, title, description, icon, category, rarity, type, xp_reward,
             source_goal_id, max_progress, emotional_context)
           VALUES ($1, $2, $3, $4, 'milestone', $5, 'goal', $6, $7, $8, $9)
           ON CONFLICT (user_id, source_goal_id, title) DO NOTHING
           RETURNING id`,
          [
            userId,
            candidate.title,
            candidate.description,
            candidate.icon,
            candidate.rarity,
            xpReward,
            goalId,
            candidate.threshold,
            candidate.emotionalContext,
          ],
        );

        if (result.rows.length > 0) {
          created.push({
            id: result.rows[0].id,
            userId,
            title: candidate.title,
            description: candidate.description,
            icon: candidate.icon,
            category: 'milestone',
            rarity: candidate.rarity,
            type: 'goal',
            xpReward,
            maxProgress: candidate.threshold,
            currentProgress: 0,
            unlocked: false,
            unlockedAt: null,
            emotionalContext: candidate.emotionalContext,
            sourceGoalId: goalId,
            aiGenerated: true,
          });
        }
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('duplicate'))) {
          logger.error('[AchievementAI] Error persisting achievement', {
            userId,
            goalId,
            title: candidate.title,
            error: error instanceof Error ? error.message : 'Unknown',
          });
        }
      }
    }

    if (created.length > 0) {
      logger.info('[AchievementAI] AI achievements created', {
        userId,
        goalId,
        count: created.length,
      });
    }

    return created;
  }

  /**
   * Rule-based fallback when LLM is unavailable.
   * Delegates to the existing dynamic-achievements service.
   */
  private async fallbackGoalAchievements(userId: string, goal: UserGoalContext): Promise<DynamicAchievement[]> {
    return dynamicAchievementsService.generateGoalAchievements(userId, {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      target_value: goal.targetValue,
      target_unit: goal.targetUnit,
      frequency: goal.frequency,
      status: goal.status,
    });
  }
}

export const achievementAIService = new AchievementAIService();
