/**
 * @file Journal Service
 * @description Handles daily journaling with AI-personalized prompts (F7.2)
 */

import { query } from '../../database/pg.js';
import { ApiError } from '../../utils/ApiError.js';
import type { JournalEntry, WellbeingMode, JournalPromptCategory } from '@shared/types/domain/wellbeing.js';
import { calculateStreak } from './utils/pattern-detection.js';

// ============================================
// TYPES
// ============================================

export interface JournalPrompt {
  id: string;
  text: string;
  category: JournalPromptCategory;
  description?: string;
}

export interface CreateJournalEntryInput {
  prompt: string;
  promptCategory?: JournalPromptCategory;
  promptId?: string;
  entryText: string;
  mode: WellbeingMode;
  voiceEntry?: boolean;
  durationSeconds?: number;
  loggedAt?: string;
}

export interface UpdateJournalEntryInput {
  entryText?: string;
  prompt?: string;
  promptCategory?: JournalPromptCategory;
}

export interface JournalStreak {
  currentStreak: number;
  longestStreak: number;
  streakStartDate?: string;
}

interface JournalEntryRow {
  id: string;
  user_id: string;
  prompt: string;
  prompt_category: JournalPromptCategory | null;
  prompt_id: string | null;
  entry_text: string;
  word_count: number;
  mode: WellbeingMode;
  voice_entry: boolean;
  duration_seconds: number | null;
  sentiment_score: number | null;
  sentiment_label: string | null;
  streak_day: number | null;
  logged_at: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// PROMPT LIBRARY (Research-based)
// ============================================

const PROMPT_LIBRARY: JournalPrompt[] = [
  // Gratitude
  { id: 'gratitude-1', text: 'What are you grateful for today?', category: 'gratitude' },
  { id: 'gratitude-2', text: 'List three things you\'re grateful for today and why they matter.', category: 'gratitude' },
  { id: 'gratitude-3', text: 'Who made a positive impact on you today? How did they help?', category: 'gratitude' },
  { id: 'gratitude-4', text: 'What\'s a simple pleasure you enjoyed today?', category: 'gratitude' },

  // Reflection
  { id: 'reflection-1', text: 'What\'s one thing that went well today? What made it successful?', category: 'reflection' },
  { id: 'reflection-2', text: 'What challenge did you face? What did you learn from it?', category: 'reflection' },
  { id: 'reflection-3', text: 'How did you show up as your best self today?', category: 'reflection' },
  { id: 'reflection-4', text: 'What\'s one thing that went well today? One thing to improve?', category: 'reflection' },

  // Emotional Processing
  { id: 'emotional-1', text: 'What emotion are you feeling right now? What triggered it?', category: 'emotional_processing' },
  { id: 'emotional-2', text: 'What\'s weighing on your mind? Why does it matter to you?', category: 'emotional_processing' },
  { id: 'emotional-3', text: 'If this emotion had a message for you, what would it be?', category: 'emotional_processing' },
  { id: 'emotional-4', text: 'How are you feeling? What\'s behind that emotion?', category: 'emotional_processing' },

  // Stress Management
  { id: 'stress-1', text: 'What\'s causing stress right now? What parts are within your control?', category: 'stress_management' },
  { id: 'stress-2', text: 'What\'s one action you can take to ease this stress?', category: 'stress_management' },
  { id: 'stress-3', text: 'What would help you feel calmer right now?', category: 'stress_management' },

  // Self-Compassion
  { id: 'compassion-1', text: 'What would you say to a friend going through what you\'re experiencing?', category: 'self_compassion' },
  { id: 'compassion-2', text: 'What do you need to forgive yourself for today?', category: 'self_compassion' },
  { id: 'compassion-3', text: 'How can you be kinder to yourself tomorrow?', category: 'self_compassion' },

  // Future Focus
  { id: 'future-1', text: 'What\'s one intention you have for tomorrow?', category: 'future_focus' },
  { id: 'future-2', text: 'What are you looking forward to this week?', category: 'future_focus' },
  { id: 'future-3', text: 'What would make tomorrow feel successful?', category: 'future_focus' },
  { id: 'future-4', text: 'What\'s one goal you have for tomorrow?', category: 'future_focus' },
];

// ============================================
// SERVICE CLASS
// ============================================

class JournalService {
  /**
   * Get recommended prompts based on user context
   */
  async getRecommendedPrompts(
    _userId: string,
    limit: number = 3
  ): Promise<JournalPrompt[]> {
    // TODO: Implement AI personalization based on:
    // - Recent mood patterns
    // - Stress levels
    // - Sleep quality
    // - Workout consistency
    // - Recent journal themes

    // For now, return random prompts from different categories
    const categories = new Set<JournalPromptCategory>();
    const selected: JournalPrompt[] = [];
    const shuffled = [...PROMPT_LIBRARY].sort(() => Math.random() - 0.5);

    for (const prompt of shuffled) {
      if (!categories.has(prompt.category)) {
        selected.push(prompt);
        categories.add(prompt.category);
        if (selected.length >= limit) break;
      }
    }

    // Fill remaining slots if needed
    while (selected.length < limit && selected.length < PROMPT_LIBRARY.length) {
      const remaining = PROMPT_LIBRARY.filter((p) => !selected.includes(p));
      if (remaining.length === 0) break;
      selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }

    return selected.slice(0, limit);
  }

  /**
   * Create a journal entry
   */
  async createJournalEntry(userId: string, input: CreateJournalEntryInput): Promise<JournalEntry> {
    if (!input.entryText || input.entryText.trim().length === 0) {
      throw ApiError.badRequest('Entry text is required');
    }

    const wordCount = input.entryText.trim().split(/\s+/).filter((w) => w.length > 0).length;

    // Calculate sentiment score (simple implementation)
    // TODO: Integrate with proper sentiment analysis service
    const sentimentLabel = this.calculateSentiment(input.entryText);
    const sentimentScore = this.calculateSentimentScore(input.entryText);

    // Calculate streak
    const streak = await this.calculateJournalStreak(userId);

    const loggedAt = input.loggedAt
      ? new Date(input.loggedAt).toISOString()
      : new Date().toISOString();

    const result = await query<JournalEntryRow>(
      `INSERT INTO journal_entries (
        user_id, prompt, prompt_category, prompt_id,
        entry_text, word_count, mode, voice_entry,
        duration_seconds, sentiment_score, sentiment_label, streak_day, logged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId,
        input.prompt,
        input.promptCategory || null,
        input.promptId || null,
        input.entryText,
        wordCount,
        input.mode,
        input.voiceEntry || false,
        input.durationSeconds || null,
        sentimentScore,
        sentimentLabel,
        streak.currentStreak > 0 ? streak.currentStreak + 1 : 1,
        loggedAt,
      ]
    );

    return this.mapRowToJournalEntry(result.rows[0]);
  }

  /**
   * Get journal entries for a user
   */
  async getJournalEntries(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      category?: JournalPromptCategory;
    } = {}
  ): Promise<{ entries: JournalEntry[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const offset = (page - 1) * limit;

    let queryText = `SELECT * FROM journal_entries WHERE user_id = $1`;
    const params: (string | number)[] = [userId];

    if (options.startDate) {
      queryText += ` AND DATE(logged_at) >= $${params.length + 1}`;
      params.push(options.startDate);
    }

    if (options.endDate) {
      queryText += ` AND DATE(logged_at) <= $${params.length + 1}`;
      params.push(options.endDate);
    }

    if (options.category) {
      queryText += ` AND prompt_category = $${params.length + 1}`;
      params.push(options.category);
    }

    queryText += ` ORDER BY logged_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const entriesResult = await query<JournalEntryRow>(queryText, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM journal_entries WHERE user_id = $1`;
    const countParams: (string | number)[] = [userId];

    if (options.startDate) {
      countQuery += ` AND DATE(logged_at) >= $${countParams.length + 1}`;
      countParams.push(options.startDate);
    }

    if (options.endDate) {
      countQuery += ` AND DATE(logged_at) <= $${countParams.length + 1}`;
      countParams.push(options.endDate);
    }

    if (options.category) {
      countQuery += ` AND prompt_category = $${countParams.length + 1}`;
      countParams.push(options.category);
    }

    const countResult = await query<{ total: string }>(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    return {
      entries: entriesResult.rows.map((row) => this.mapRowToJournalEntry(row)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single journal entry by ID
   */
  async getJournalEntryById(userId: string, entryId: string): Promise<JournalEntry> {
    const result = await query<JournalEntryRow>(
      `SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2`,
      [entryId, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Journal entry not found');
    }

    return this.mapRowToJournalEntry(result.rows[0]);
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(
    userId: string,
    entryId: string,
    input: UpdateJournalEntryInput
  ): Promise<JournalEntry> {
    // Verify ownership
    const existing = await query<JournalEntryRow>(
      `SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2`,
      [entryId, userId]
    );

    if (existing.rows.length === 0) {
      throw ApiError.notFound('Journal entry not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.entryText !== undefined) {
      if (input.entryText.trim().length === 0) {
        throw ApiError.badRequest('Entry text cannot be empty');
      }
      const wordCount = input.entryText.trim().split(/\s+/).filter((w) => w.length > 0).length;
      updates.push(`entry_text = $${paramIndex++}`);
      updates.push(`word_count = $${paramIndex++}`);
      values.push(input.entryText.trim(), wordCount);
    }

    if (input.prompt !== undefined) {
      updates.push(`prompt = $${paramIndex++}`);
      values.push(input.prompt);
    }

    if (input.promptCategory !== undefined) {
      updates.push(`prompt_category = $${paramIndex++}`);
      values.push(input.promptCategory);
    }

    if (updates.length === 0) {
      return this.mapRowToJournalEntry(existing.rows[0]);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(entryId, userId);

    const result = await query<JournalEntryRow>(
      `UPDATE journal_entries
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    return this.mapRowToJournalEntry(result.rows[0]);
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    const result = await query(
      `DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING id`,
      [entryId, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Journal entry not found');
    }
  }

  /**
   * Get journal streak information
   */
  async getJournalStreak(userId: string): Promise<JournalStreak> {
    const result = await query<{ logged_at: Date }>(
      `SELECT DATE(logged_at) as logged_at
       FROM journal_entries
       WHERE user_id = $1
       ORDER BY logged_at DESC
       LIMIT 90`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates = result.rows.map((r) => new Date(r.logged_at).toISOString().split('T')[0]);
    const completed = dates.map(() => true);

    return calculateStreak(dates, completed);
  }

  /**
   * Calculate journal streak (internal)
   */
  private async calculateJournalStreak(userId: string): Promise<JournalStreak> {
    return this.getJournalStreak(userId);
  }

  /**
   * Simple sentiment calculation (basic implementation)
   * TODO: Replace with proper sentiment analysis service
   */
  private calculateSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();

    const positiveWords = ['happy', 'grateful', 'thankful', 'excited', 'joy', 'love', 'good', 'great', 'wonderful', 'amazing', 'fantastic'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'stressed', 'worried', 'anxious', 'bad', 'terrible', 'awful', 'hate', 'disappointed'];

    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate sentiment score (-1 to 1)
   */
  private calculateSentimentScore(text: string): number {
    const lowerText = text.toLowerCase();

    const positiveWords = ['happy', 'grateful', 'thankful', 'excited', 'joy', 'love', 'good', 'great', 'wonderful', 'amazing', 'fantastic'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'stressed', 'worried', 'anxious', 'bad', 'terrible', 'awful', 'hate', 'disappointed'];

    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / Math.max(total, 1);
  }

  /**
   * Map database row to JournalEntry interface
   */
  private mapRowToJournalEntry(row: JournalEntryRow): JournalEntry {
    return {
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      promptCategory: row.prompt_category || undefined,
      promptId: row.prompt_id || undefined,
      entryText: row.entry_text,
      wordCount: row.word_count,
      mode: row.mode,
      voiceEntry: row.voice_entry,
      durationSeconds: row.duration_seconds || undefined,
      sentimentScore: row.sentiment_score || undefined,
      sentimentLabel: (row.sentiment_label as 'positive' | 'negative' | 'neutral') || undefined,
      streakDay: row.streak_day || undefined,
      loggedAt: row.logged_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

export const journalService = new JournalService();
export default journalService;

