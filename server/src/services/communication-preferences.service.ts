/**
 * User communication preferences (push categories, check-ins, email caps).
 * Row is optional — defaults apply when missing.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

export interface CommunicationPreferencesRow {
  user_id: string;
  checkin_push_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  workdays_only: boolean;
  max_checkins_per_day: number;
  missed_followup_hours: number;
  push_achievements: boolean;
  push_streaks: boolean;
  push_nudges: boolean;
  email_digest: boolean;
  email_urgent_only: boolean;
  checkin_miss_count_by_hour: Record<string, number> | null;
  created_at: Date;
  updated_at: Date;
}

export type CommunicationPreferences = Omit<
  CommunicationPreferencesRow,
  'created_at' | 'updated_at'
>;

const DEFAULTS: CommunicationPreferences = {
  user_id: '',
  checkin_push_enabled: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
  workdays_only: false,
  max_checkins_per_day: 1,
  missed_followup_hours: 24,
  push_achievements: true,
  push_streaks: true,
  push_nudges: true,
  email_digest: true,
  email_urgent_only: false,
  checkin_miss_count_by_hour: {},
};

function mergeDefaults(
  userId: string,
  row: Partial<CommunicationPreferencesRow> | null
): CommunicationPreferences {
  if (!row) {
    return { ...DEFAULTS, user_id: userId, checkin_miss_count_by_hour: {} };
  }
  return {
    user_id: userId,
    checkin_push_enabled: row.checkin_push_enabled ?? DEFAULTS.checkin_push_enabled,
    quiet_hours_start: row.quiet_hours_start ?? null,
    quiet_hours_end: row.quiet_hours_end ?? null,
    workdays_only: row.workdays_only ?? DEFAULTS.workdays_only,
    max_checkins_per_day: row.max_checkins_per_day ?? DEFAULTS.max_checkins_per_day,
    missed_followup_hours: row.missed_followup_hours ?? DEFAULTS.missed_followup_hours,
    push_achievements: row.push_achievements ?? DEFAULTS.push_achievements,
    push_streaks: row.push_streaks ?? DEFAULTS.push_streaks,
    push_nudges: row.push_nudges ?? DEFAULTS.push_nudges,
    email_digest: row.email_digest ?? DEFAULTS.email_digest,
    email_urgent_only: row.email_urgent_only ?? DEFAULTS.email_urgent_only,
    checkin_miss_count_by_hour:
      (row.checkin_miss_count_by_hour as Record<string, number>) || {},
  };
}

class CommunicationPreferencesService {
  async getForUser(userId: string): Promise<CommunicationPreferences> {
    try {
      const result = await query<CommunicationPreferencesRow>(
        `SELECT * FROM user_communication_preferences WHERE user_id = $1`,
        [userId]
      );
      if (result.rows.length === 0) {
        return mergeDefaults(userId, null);
      }
      return mergeDefaults(userId, result.rows[0]!);
    } catch (error) {
      logger.warn('[CommunicationPreferences] get failed (table missing?)', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return mergeDefaults(userId, null);
    }
  }

  async upsert(
    userId: string,
    patch: Partial<
      Omit<CommunicationPreferencesRow, 'user_id' | 'created_at' | 'updated_at' | 'checkin_miss_count_by_hour'>
    > & { checkin_miss_count_by_hour?: Record<string, number> }
  ): Promise<CommunicationPreferences> {
    const existing = await this.getForUser(userId);
    const next = { ...existing, ...patch, user_id: userId };

    await query(
      `INSERT INTO user_communication_preferences (
         user_id, checkin_push_enabled, quiet_hours_start, quiet_hours_end,
         workdays_only, max_checkins_per_day, missed_followup_hours,
         push_achievements, push_streaks, push_nudges,
         email_digest, email_urgent_only, checkin_miss_count_by_hour
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         checkin_push_enabled = EXCLUDED.checkin_push_enabled,
         quiet_hours_start = EXCLUDED.quiet_hours_start,
         quiet_hours_end = EXCLUDED.quiet_hours_end,
         workdays_only = EXCLUDED.workdays_only,
         max_checkins_per_day = EXCLUDED.max_checkins_per_day,
         missed_followup_hours = EXCLUDED.missed_followup_hours,
         push_achievements = EXCLUDED.push_achievements,
         push_streaks = EXCLUDED.push_streaks,
         push_nudges = EXCLUDED.push_nudges,
         email_digest = EXCLUDED.email_digest,
         email_urgent_only = EXCLUDED.email_urgent_only,
         checkin_miss_count_by_hour = EXCLUDED.checkin_miss_count_by_hour,
         updated_at = NOW()`,
      [
        userId,
        next.checkin_push_enabled,
        next.quiet_hours_start,
        next.quiet_hours_end,
        next.workdays_only,
        next.max_checkins_per_day,
        next.missed_followup_hours,
        next.push_achievements,
        next.push_streaks,
        next.push_nudges,
        next.email_digest,
        next.email_urgent_only,
        JSON.stringify(next.checkin_miss_count_by_hour || {}),
      ]
    );

    return this.getForUser(userId);
  }

  async recordMiss(userId: string, hour: number): Promise<void> {
    const prefs = await this.getForUser(userId);
    const counts = { ...(prefs.checkin_miss_count_by_hour || {}) };
    counts[String(hour)] = (counts[String(hour)] || 0) + 1;
    await this.upsert(userId, { checkin_miss_count_by_hour: counts });
  }

  async recordAnswer(userId: string, hour: number): Promise<void> {
    const prefs = await this.getForUser(userId);
    const counts = { ...(prefs.checkin_miss_count_by_hour || {}) };
    counts[String(hour)] = 0;
    await this.upsert(userId, { checkin_miss_count_by_hour: counts });
  }

  async allowsPushCategory(userId: string, category: string | null | undefined): Promise<boolean> {
    const p = await this.getForUser(userId);
    const c = (category || '').toLowerCase();
    if (c.includes('achievement')) return p.push_achievements;
    if (c.includes('streak')) return p.push_streaks;
    return p.push_nudges;
  }
}

export const communicationPreferencesService = new CommunicationPreferencesService();
