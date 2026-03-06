/**
 * @file Daily Check-in Service
 * @description Quick structured daily check-in capturing mood, energy, sleep, stress
 * Cross-logs to mood_logs, energy_logs, stress_logs for backward compatibility
 */

import { query } from '../../database/pg.js';
import type { DailyCheckin, CreateDailyCheckinInput, CheckinTag } from '@shared/types/domain/wellbeing.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES
// ============================================

interface DailyCheckinRow {
  id: string;
  user_id: string;
  checkin_date: string;
  mood_score: number | null;
  energy_score: number | null;
  sleep_quality: number | null;
  stress_score: number | null;
  tags: string[] | null;
  day_summary: string | null;
  mood_log_id: string | null;
  energy_log_id: string | null;
  stress_log_id: string | null;
  completed_at: Date | null;
  logged_at: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// SERVICE CLASS
// ============================================

class DailyCheckinService {
  /**
   * Create or update today's daily check-in
   * Also cross-logs to mood_logs, energy_logs, stress_logs
   */
  async createOrUpdateCheckin(userId: string, input: CreateDailyCheckinInput): Promise<DailyCheckin> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if a check-in already exists for today
    const existing = await query<DailyCheckinRow>(
      `SELECT * FROM daily_checkins WHERE user_id = $1 AND checkin_date = $2`,
      [userId, today]
    );

    // Cross-log to wellbeing tables for backward compatibility
    let moodLogId: string | null = null;
    let energyLogId: string | null = null;
    let stressLogId: string | null = null;

    if (input.moodScore) {
      moodLogId = await this.createMoodLog(userId, input.moodScore, now);
    }

    if (input.energyScore) {
      energyLogId = await this.createEnergyLog(userId, input.energyScore, now);
    }

    if (input.stressScore) {
      stressLogId = await this.createStressLog(userId, input.stressScore, now);
    }

    if (existing.rows.length > 0) {
      // Update existing check-in
      const result = await query<DailyCheckinRow>(
        `UPDATE daily_checkins SET
          mood_score = COALESCE($3, mood_score),
          energy_score = COALESCE($4, energy_score),
          sleep_quality = COALESCE($5, sleep_quality),
          stress_score = COALESCE($6, stress_score),
          tags = COALESCE($7, tags),
          day_summary = COALESCE($8, day_summary),
          mood_log_id = COALESCE($9, mood_log_id),
          energy_log_id = COALESCE($10, energy_log_id),
          stress_log_id = COALESCE($11, stress_log_id),
          completed_at = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND checkin_date = $2
        RETURNING *`,
        [
          userId, today,
          input.moodScore ?? null,
          input.energyScore ?? null,
          input.sleepQuality ?? null,
          input.stressScore ?? null,
          input.tags ?? null,
          input.daySummary ?? null,
          moodLogId,
          energyLogId,
          stressLogId,
          now,
        ]
      );
      return this.mapRowToCheckin(result.rows[0]);
    }

    // Create new check-in
    const result = await query<DailyCheckinRow>(
      `INSERT INTO daily_checkins (
        user_id, checkin_date, mood_score, energy_score, sleep_quality,
        stress_score, tags, day_summary, mood_log_id, energy_log_id,
        stress_log_id, completed_at, logged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId, today,
        input.moodScore ?? null,
        input.energyScore ?? null,
        input.sleepQuality ?? null,
        input.stressScore ?? null,
        input.tags ?? [],
        input.daySummary ?? null,
        moodLogId,
        energyLogId,
        stressLogId,
        now, now,
      ]
    );

    return this.mapRowToCheckin(result.rows[0]);
  }

  /**
   * Get today's check-in for a user
   */
  async getTodayCheckin(userId: string): Promise<DailyCheckin | null> {
    const today = new Date().toISOString().split('T')[0];
    const result = await query<DailyCheckinRow>(
      `SELECT * FROM daily_checkins WHERE user_id = $1 AND checkin_date = $2`,
      [userId, today]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToCheckin(result.rows[0]);
  }

  /**
   * Get check-in history (paginated)
   */
  async getCheckinHistory(
    userId: string,
    options: { page?: number; limit?: number; startDate?: string; endDate?: string } = {}
  ): Promise<{ checkins: DailyCheckin[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 30, 100);
    const offset = (page - 1) * limit;

    let queryText = `SELECT * FROM daily_checkins WHERE user_id = $1`;
    const params: (string | number)[] = [userId];

    if (options.startDate) {
      queryText += ` AND checkin_date >= $${params.length + 1}`;
      params.push(options.startDate);
    }

    if (options.endDate) {
      queryText += ` AND checkin_date <= $${params.length + 1}`;
      params.push(options.endDate);
    }

    queryText += ` ORDER BY checkin_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query<DailyCheckinRow>(queryText, params);

    // Total count
    let countQuery = `SELECT COUNT(*) as total FROM daily_checkins WHERE user_id = $1`;
    const countParams: (string | number)[] = [userId];

    if (options.startDate) {
      countQuery += ` AND checkin_date >= $${countParams.length + 1}`;
      countParams.push(options.startDate);
    }
    if (options.endDate) {
      countQuery += ` AND checkin_date <= $${countParams.length + 1}`;
      countParams.push(options.endDate);
    }

    const countResult = await query<{ total: string }>(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    return {
      checkins: result.rows.map((row) => this.mapRowToCheckin(row)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get check-in streak information
   */
  async getCheckinStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const result = await query<{ checkin_date: string }>(
      `SELECT checkin_date FROM daily_checkins
       WHERE user_id = $1 AND completed_at IS NOT NULL
       ORDER BY checkin_date DESC LIMIT 90`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates = result.rows.map((r) => r.checkin_date);
    const today = new Date().toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let expectedDate = new Date(today);

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      const expected = expectedDate.toISOString().split('T')[0];

      if (dateStr === expected) {
        tempStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        if (currentStreak === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        expectedDate = new Date(date);
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
    }

    if (currentStreak === 0) currentStreak = tempStreak;
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  // ============================================
  // CROSS-LOGGING HELPERS
  // ============================================

  /**
   * Create a mood log entry for backward compatibility
   */
  private async createMoodLog(userId: string, moodScore: number, loggedAt: string): Promise<string> {
    const result = await query<{ id: string }>(
      `INSERT INTO mood_logs (user_id, happiness_rating, mode, logged_at)
       VALUES ($1, $2, 'deep', $3)
       RETURNING id`,
      [userId, moodScore, loggedAt]
    );
    return result.rows[0].id;
  }

  /**
   * Create an energy log entry for backward compatibility
   */
  private async createEnergyLog(userId: string, energyScore: number, loggedAt: string): Promise<string> {
    const result = await query<{ id: string }>(
      `INSERT INTO energy_logs (user_id, energy_rating, context_tag, logged_at)
       VALUES ($1, $2, 'after-sleep', $3)
       RETURNING id`,
      [userId, energyScore, loggedAt]
    );
    return result.rows[0].id;
  }

  /**
   * Create a stress log entry for backward compatibility
   */
  private async createStressLog(userId: string, stressScore: number, loggedAt: string): Promise<string> {
    const clientRequestId = `checkin-${userId}-${new Date().toISOString().split('T')[0]}-${uuidv4().slice(0, 8)}`;
    const result = await query<{ id: string }>(
      `INSERT INTO stress_logs (user_id, stress_rating, check_in_type, client_request_id, logged_at)
       VALUES ($1, $2, 'daily', $3, $4)
       RETURNING id`,
      [userId, stressScore, clientRequestId, loggedAt]
    );
    return result.rows[0].id;
  }

  // ============================================
  // MAPPING
  // ============================================

  private mapRowToCheckin(row: DailyCheckinRow): DailyCheckin {
    return {
      id: row.id,
      userId: row.user_id,
      checkinDate: row.checkin_date,
      moodScore: row.mood_score ?? undefined,
      energyScore: row.energy_score ?? undefined,
      sleepQuality: row.sleep_quality ?? undefined,
      stressScore: row.stress_score ?? undefined,
      tags: (row.tags ?? []) as CheckinTag[],
      daySummary: row.day_summary ?? undefined,
      moodLogId: row.mood_log_id ?? undefined,
      energyLogId: row.energy_log_id ?? undefined,
      stressLogId: row.stress_log_id ?? undefined,
      completedAt: row.completed_at?.toISOString(),
      loggedAt: row.logged_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

export const dailyCheckinService = new DailyCheckinService();
export default dailyCheckinService;
