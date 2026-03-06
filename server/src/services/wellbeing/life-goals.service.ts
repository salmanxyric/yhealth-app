/**
 * @file Life Goals Service
 * @description Non-fitness life goals tracked through journaling
 * Separate from user_goals (which is locked to health_pillar enum)
 */

import { query } from '../../database/pg.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  LifeGoal,
  CreateLifeGoalInput,
  DailyIntention,
  JournalGoalLink,
  LifeGoalCategory,
} from '@shared/types/domain/wellbeing.js';

// ============================================
// TYPES
// ============================================

interface LifeGoalRow {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  motivation: string | null;
  tracking_method: string;
  target_value: number | null;
  target_unit: string | null;
  current_value: number;
  status: string;
  progress: number;
  journal_mention_count: number;
  avg_sentiment_when_mentioned: number | null;
  last_mentioned_at: Date | null;
  ai_detected_patterns: unknown[];
  detection_keywords: string[];
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DailyIntentionRow {
  id: string;
  user_id: string;
  intention_date: string;
  intention_text: string;
  checkin_id: string | null;
  fulfilled: boolean | null;
  reflection: string | null;
  created_at: Date;
  updated_at: Date;
}

interface JournalGoalLinkRow {
  id: string;
  journal_entry_id: string;
  life_goal_id: string;
  link_type: string;
  confidence: number | null;
  relevant_excerpt: string | null;
  sentiment_score: number | null;
  created_at: Date;
}

const VALID_CATEGORIES: LifeGoalCategory[] = [
  'spiritual', 'social', 'productivity', 'happiness',
  'anxiety_management', 'creative', 'personal_growth', 'custom',
];

// ============================================
// SERVICE CLASS
// ============================================

class LifeGoalsService {
  // ============================================
  // LIFE GOALS CRUD
  // ============================================

  async createGoal(userId: string, input: CreateLifeGoalInput): Promise<LifeGoal> {
    if (!input.title || input.title.trim().length === 0) {
      throw ApiError.badRequest('Goal title is required');
    }

    if (!VALID_CATEGORIES.includes(input.category)) {
      throw ApiError.badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    const result = await query<LifeGoalRow>(
      `INSERT INTO life_goals (
        user_id, category, title, description, motivation,
        tracking_method, target_value, target_unit,
        detection_keywords, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        input.category,
        input.title.trim(),
        input.description ?? null,
        input.motivation ?? null,
        input.trackingMethod ?? 'journal_mentions',
        input.targetValue ?? null,
        input.targetUnit ?? null,
        input.detectionKeywords ?? [],
        input.isPrimary ?? false,
      ]
    );

    return this.mapRowToGoal(result.rows[0]);
  }

  async getGoals(
    userId: string,
    options: { status?: string; category?: LifeGoalCategory } = {}
  ): Promise<LifeGoal[]> {
    let queryText = `SELECT * FROM life_goals WHERE user_id = $1`;
    const params: (string)[] = [userId];

    if (options.status) {
      queryText += ` AND status = $${params.length + 1}`;
      params.push(options.status);
    }

    if (options.category) {
      queryText += ` AND category = $${params.length + 1}`;
      params.push(options.category);
    }

    queryText += ` ORDER BY is_primary DESC, created_at DESC`;

    const result = await query<LifeGoalRow>(queryText, params);
    return result.rows.map((row) => this.mapRowToGoal(row));
  }

  async getGoalById(userId: string, goalId: string): Promise<LifeGoal> {
    const result = await query<LifeGoalRow>(
      `SELECT * FROM life_goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Life goal not found');
    }

    return this.mapRowToGoal(result.rows[0]);
  }

  async updateGoal(
    userId: string,
    goalId: string,
    updates: Partial<CreateLifeGoalInput> & { status?: string; currentValue?: number; progress?: number }
  ): Promise<LifeGoal> {
    const existing = await query<LifeGoalRow>(
      `SELECT * FROM life_goals WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (existing.rows.length === 0) {
      throw ApiError.notFound('Life goal not found');
    }

    const setClauses: string[] = [];
    const values: (string | number | boolean | object | Date | null)[] = [];
    let paramIndex = 1;

    const fields: Record<string, unknown> = {
      category: updates.category,
      title: updates.title?.trim(),
      description: updates.description,
      motivation: updates.motivation,
      tracking_method: updates.trackingMethod,
      target_value: updates.targetValue,
      target_unit: updates.targetUnit,
      detection_keywords: updates.detectionKeywords,
      is_primary: updates.isPrimary,
      status: updates.status,
      current_value: updates.currentValue,
      progress: updates.progress,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return this.mapRowToGoal(existing.rows[0]);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(goalId, userId);

    const result = await query<LifeGoalRow>(
      `UPDATE life_goals SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    return this.mapRowToGoal(result.rows[0]);
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const result = await query(
      `DELETE FROM life_goals WHERE id = $1 AND user_id = $2 RETURNING id`,
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Life goal not found');
    }
  }

  /**
   * Get journal entries linked to a specific goal
   */
  async getGoalEntries(
    userId: string,
    goalId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ entries: JournalGoalLink[]; total: number }> {
    // Verify goal ownership
    await this.getGoalById(userId, goalId);

    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    const result = await query<JournalGoalLinkRow>(
      `SELECT jgl.* FROM journal_goal_links jgl
       JOIN journal_entries je ON je.id = jgl.journal_entry_id
       WHERE jgl.life_goal_id = $1 AND je.user_id = $2
       ORDER BY jgl.created_at DESC
       LIMIT $3 OFFSET $4`,
      [goalId, userId, limit, offset]
    );

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM journal_goal_links jgl
       JOIN journal_entries je ON je.id = jgl.journal_entry_id
       WHERE jgl.life_goal_id = $1 AND je.user_id = $2`,
      [goalId, userId]
    );

    return {
      entries: result.rows.map((row) => this.mapRowToLink(row)),
      total: parseInt(countResult.rows[0].total, 10),
    };
  }

  // ============================================
  // DAILY INTENTIONS
  // ============================================

  async setIntention(userId: string, intentionText: string, checkinId?: string): Promise<DailyIntention> {
    if (!intentionText || intentionText.trim().length === 0) {
      throw ApiError.badRequest('Intention text is required');
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await query<DailyIntentionRow>(
      `INSERT INTO daily_intentions (user_id, intention_date, intention_text, checkin_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, intention_date) DO UPDATE SET
         intention_text = $3,
         checkin_id = COALESCE($4, daily_intentions.checkin_id),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, today, intentionText.trim(), checkinId ?? null]
    );

    return this.mapRowToIntention(result.rows[0]);
  }

  async getTodayIntention(userId: string): Promise<DailyIntention | null> {
    const today = new Date().toISOString().split('T')[0];
    const result = await query<DailyIntentionRow>(
      `SELECT * FROM daily_intentions WHERE user_id = $1 AND intention_date = $2`,
      [userId, today]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToIntention(result.rows[0]);
  }

  async updateIntention(
    userId: string,
    intentionId: string,
    updates: { fulfilled?: boolean; reflection?: string }
  ): Promise<DailyIntention> {
    const setClauses: string[] = [];
    const values: (string | number | boolean | object | Date | null)[] = [];
    let paramIndex = 1;

    if (updates.fulfilled !== undefined) {
      setClauses.push(`fulfilled = $${paramIndex++}`);
      values.push(updates.fulfilled);
    }

    if (updates.reflection !== undefined) {
      setClauses.push(`reflection = $${paramIndex++}`);
      values.push(updates.reflection);
    }

    if (setClauses.length === 0) {
      throw ApiError.badRequest('No updates provided');
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(intentionId, userId);

    const result = await query<DailyIntentionRow>(
      `UPDATE daily_intentions SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Intention not found');
    }

    return this.mapRowToIntention(result.rows[0]);
  }

  // ============================================
  // JOURNAL-GOAL LINKING
  // ============================================

  /**
   * Create a link between a journal entry and a life goal
   */
  async linkEntryToGoal(
    journalEntryId: string,
    lifeGoalId: string,
    linkType: 'ai_detected' | 'user_confirmed' | 'user_tagged',
    confidence?: number,
    relevantExcerpt?: string,
    sentimentScore?: number
  ): Promise<JournalGoalLink> {
    const result = await query<JournalGoalLinkRow>(
      `INSERT INTO journal_goal_links (
        journal_entry_id, life_goal_id, link_type, confidence, relevant_excerpt, sentiment_score
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (journal_entry_id, life_goal_id) DO UPDATE SET
        link_type = CASE
          WHEN $3 = 'user_confirmed' THEN 'user_confirmed'::VARCHAR
          WHEN $3 = 'user_tagged' THEN 'user_tagged'::VARCHAR
          ELSE journal_goal_links.link_type
        END,
        confidence = COALESCE($4, journal_goal_links.confidence)
      RETURNING *`,
      [journalEntryId, lifeGoalId, linkType, confidence ?? null, relevantExcerpt ?? null, sentimentScore ?? null]
    );

    // Update mention count on the goal
    await query(
      `UPDATE life_goals SET
        journal_mention_count = (
          SELECT COUNT(*) FROM journal_goal_links WHERE life_goal_id = $1
        ),
        last_mentioned_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [lifeGoalId]
    );

    return this.mapRowToLink(result.rows[0]);
  }

  // ============================================
  // MAPPING HELPERS
  // ============================================

  private mapRowToGoal(row: LifeGoalRow): LifeGoal {
    return {
      id: row.id,
      userId: row.user_id,
      category: row.category as LifeGoalCategory,
      title: row.title,
      description: row.description ?? undefined,
      motivation: row.motivation ?? undefined,
      trackingMethod: row.tracking_method as LifeGoal['trackingMethod'],
      targetValue: row.target_value ?? undefined,
      targetUnit: row.target_unit ?? undefined,
      currentValue: row.current_value,
      status: row.status,
      progress: row.progress,
      journalMentionCount: row.journal_mention_count,
      avgSentimentWhenMentioned: row.avg_sentiment_when_mentioned ?? undefined,
      lastMentionedAt: row.last_mentioned_at?.toISOString(),
      aiDetectedPatterns: row.ai_detected_patterns ?? [],
      detectionKeywords: row.detection_keywords ?? [],
      isPrimary: row.is_primary,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapRowToIntention(row: DailyIntentionRow): DailyIntention {
    return {
      id: row.id,
      userId: row.user_id,
      intentionDate: row.intention_date,
      intentionText: row.intention_text,
      checkinId: row.checkin_id ?? undefined,
      fulfilled: row.fulfilled ?? undefined,
      reflection: row.reflection ?? undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapRowToLink(row: JournalGoalLinkRow): JournalGoalLink {
    return {
      id: row.id,
      journalEntryId: row.journal_entry_id,
      lifeGoalId: row.life_goal_id,
      linkType: row.link_type as JournalGoalLink['linkType'],
      confidence: row.confidence ?? undefined,
      relevantExcerpt: row.relevant_excerpt ?? undefined,
      sentimentScore: row.sentiment_score ?? undefined,
      createdAt: row.created_at.toISOString(),
    };
  }
}

export const lifeGoalsService = new LifeGoalsService();
export default lifeGoalsService;
