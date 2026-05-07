/**
 * @file Timing Profile Service
 *
 * Contextual Timing feature: mines 14 days of user engagement signals
 * (messages, check-ins, reminder actions, workout/meal completions) to build
 * a 24-hour histogram of peak engagement hours. The proactive messaging
 * scorer uses this to bias delivery towards the user's natural windows.
 *
 * Cold-start: requires ≥14 days since signup AND ≥20 events.
 * Confidence = min(1.0, event_count / 80) × (distinct_hours / 24).
 */

import { query } from '../config/database.config.js';
import type {
  UserTimingProfile,
  TimingHistogram,
  TimingProfileStatus,
} from '@shared/types/domain/timing.js';

// ============================================
// Constants
// ============================================

const LOOKBACK_DAYS = 14;
const MIN_EVENTS = 20;
const MIN_DAYS_SINCE_SIGNUP = 14;
const CONFIDENCE_DENOMINATOR = 80;

// ============================================
// Row → domain mapping
// ============================================

interface TimingProfileRow {
  id: string;
  user_id: string;
  hour_histogram: string[] | number[];
  peak_hour: number;
  secondary_hour: number;
  confidence: string;
  event_count: number;
  last_computed_at: string;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: TimingProfileRow): UserTimingProfile {
  // PostgreSQL returns INTEGER[] as string[] via node-pg
  const histogram: TimingHistogram = Array.isArray(row.hour_histogram)
    ? row.hour_histogram.map(Number)
    : Array(24).fill(0);

  return {
    id: row.id,
    userId: row.user_id,
    hourHistogram: histogram,
    peakHour: Number(row.peak_hour),
    secondaryHour: Number(row.secondary_hour),
    confidence: parseFloat(String(row.confidence)),
    eventCount: Number(row.event_count),
    lastComputedAt: row.last_computed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// Service
// ============================================

class TimingProfileService {
  /**
   * Per-user TTL cache for getProfile.
   * The proactive pipeline consults this method many times per cycle
   * (scoring + multiple handlers). Cache TTL is 10 minutes — long enough
   * to collapse intra-cycle reads, short enough that freshly-computed
   * profiles appear within the next tick. `computeProfile` and
   * `invalidateProfileCache` bust the entry on writes.
   */
  private profileCache = new Map<string, { data: UserTimingProfile | null; expiresAt: number }>();
  private static PROFILE_TTL_MS = 10 * 60 * 1000;

  invalidateProfileCache(userId: string): void {
    this.profileCache.delete(userId);
  }

  /**
   * Compute (or recompute) the timing profile for a single user.
   * Returns null if cold-start conditions are not met.
   */
  async computeProfile(userId: string): Promise<UserTimingProfile | null> {
    // 1. Cold-start guard: user must have existed for ≥14 days
    const userRow = await query<{ created_at: string }>(
      `SELECT created_at FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );
    if (userRow.rows.length === 0) return null;

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(userRow.rows[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSignup < MIN_DAYS_SINCE_SIGNUP) return null;

    // 2. Fetch user timezone
    const prefRow = await query<{ timezone: string; preferred_check_in_time_manual_override: boolean }>(
      `SELECT timezone, COALESCE(preferred_check_in_time_manual_override, false) AS preferred_check_in_time_manual_override
       FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    const tz = prefRow.rows[0]?.timezone || 'UTC';
    const manualOverride = prefRow.rows[0]?.preferred_check_in_time_manual_override ?? false;

    // 3. Query 4 signal sources (14-day window), extract hour in user's timezone
    //    Using a single UNION ALL query for efficiency.
    const signalRows = await query<{ h: string }>(
      `
      SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE $2)::int AS h
      FROM messages
      WHERE sender_id = $1
        AND created_at >= NOW() - INTERVAL '${LOOKBACK_DAYS} days'

      UNION ALL

      SELECT EXTRACT(HOUR FROM logged_at AT TIME ZONE $2)::int AS h
      FROM daily_checkins
      WHERE user_id = $1
        AND logged_at >= NOW() - INTERVAL '${LOOKBACK_DAYS} days'

      UNION ALL

      SELECT EXTRACT(HOUR FROM read_at AT TIME ZONE $2)::int AS h
      FROM notifications
      WHERE user_id = $1
        AND type = 'reminder'
        AND read_at IS NOT NULL
        AND read_at >= NOW() - INTERVAL '${LOOKBACK_DAYS} days'

      UNION ALL

      SELECT EXTRACT(HOUR FROM COALESCE(completed_at, created_at) AT TIME ZONE $2)::int AS h
      FROM workout_logs
      WHERE user_id = $1
        AND COALESCE(completed_at, created_at) >= NOW() - INTERVAL '${LOOKBACK_DAYS} days'

      UNION ALL

      SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE $2)::int AS h
      FROM meal_logs
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${LOOKBACK_DAYS} days'
      `,
      [userId, tz]
    );

    // 4. Build 24-slot histogram
    const histogram: TimingHistogram = Array(24).fill(0);
    for (const row of signalRows.rows) {
      const hour = Number(row.h);
      if (hour >= 0 && hour <= 23) {
        histogram[hour]++;
      }
    }

    const eventCount = signalRows.rows.length;

    // 5. Cold-start guard: need ≥20 events
    if (eventCount < MIN_EVENTS) return null;

    // 6. Compute peaks
    const peakHour = argmax(histogram);

    // Secondary: exclude peak ± 1 (with 24h wrapping)
    const excluded = new Set([
      peakHour,
      (peakHour + 1) % 24,
      (peakHour + 23) % 24, // peakHour - 1 with wrap
    ]);
    const maskedHistogram = histogram.map((v, i) => (excluded.has(i) ? -1 : v));
    const secondaryHour = argmax(maskedHistogram);

    // 7. Compute confidence
    const distinctHours = histogram.filter((v) => v > 0).length;
    const coverageFactor = distinctHours / 24;
    const confidence = Math.round(
      Math.min(1.0, eventCount / CONFIDENCE_DENOMINATOR) * coverageFactor * 100
    ) / 100;

    // 8. UPSERT into user_timing_profiles
    const pgHistogram = `{${histogram.join(',')}}`;
    const upsertResult = await query<TimingProfileRow>(
      `INSERT INTO user_timing_profiles
         (user_id, hour_histogram, peak_hour, secondary_hour, confidence, event_count, last_computed_at)
       VALUES ($1, $2::integer[], $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET hour_histogram = EXCLUDED.hour_histogram,
             peak_hour = EXCLUDED.peak_hour,
             secondary_hour = EXCLUDED.secondary_hour,
             confidence = EXCLUDED.confidence,
             event_count = EXCLUDED.event_count,
             last_computed_at = NOW(),
             updated_at = NOW()
       RETURNING *`,
      [userId, pgHistogram, peakHour, secondaryHour, confidence, eventCount]
    );

    // 9. Auto-update preferred_check_in_time if confidence is high enough
    //    and user hasn't manually overridden.
    if (confidence >= 0.5 && !manualOverride) {
      const timeStr = `${String(peakHour).padStart(2, '0')}:00`;
      await query(
        `UPDATE user_preferences
           SET preferred_check_in_time = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [timeStr, userId]
      );
    }

    // Bust the read-cache so the next getProfile call sees the fresh row
    this.profileCache.delete(userId);

    return rowToProfile(upsertResult.rows[0]);
  }

  /**
   * Get the current timing profile for a user (read-only).
   * Cached for 10 minutes per user (see profileCache above).
   */
  async getProfile(userId: string): Promise<UserTimingProfile | null> {
    const cached = this.profileCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    const result = await query<TimingProfileRow>(
      `SELECT * FROM user_timing_profiles WHERE user_id = $1`,
      [userId]
    );
    const profile = result.rows.length > 0 ? rowToProfile(result.rows[0]) : null;
    this.profileCache.set(userId, {
      data: profile,
      expiresAt: Date.now() + TimingProfileService.PROFILE_TTL_MS,
    });
    if (this.profileCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of this.profileCache) {
        if (v.expiresAt <= now) this.profileCache.delete(k);
      }
    }
    return profile;
  }

  /**
   * Profile + prefs for one UI / job round-trip.
   */
  async getTimingStatus(userId: string): Promise<TimingProfileStatus> {
    const prefRow = await query<{
      preferred_check_in_time_manual_override: boolean;
      preferred_check_in_time: string | null;
    }>(
      `SELECT COALESCE(preferred_check_in_time_manual_override, false) AS preferred_check_in_time_manual_override,
              preferred_check_in_time
       FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    const manualOverride =
      prefRow.rows[0]?.preferred_check_in_time_manual_override ?? false;
    const preferredCheckInTime = prefRow.rows[0]?.preferred_check_in_time ?? null;
    const profile = await this.getProfile(userId);
    let archetypeLabel: string | null = null;
    if (profile && profile.confidence >= 0.25) {
      archetypeLabel = deriveArchetypeLabel(profile.peakHour);
    }
    return {
      profile,
      manualOverride,
      preferredCheckInTime,
      archetypeLabel,
    };
  }

  /**
   * Get just the histogram array for UI visualization.
   */
  async getHistogram(userId: string): Promise<TimingHistogram | null> {
    const result = await query<{ hour_histogram: string[] | number[] }>(
      `SELECT hour_histogram FROM user_timing_profiles WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    return Array.isArray(result.rows[0].hour_histogram)
      ? result.rows[0].hour_histogram.map(Number)
      : null;
  }

  /**
   * Toggle manual override of preferred_check_in_time.
   * When override is true, the nightly job will NOT auto-update the time.
   */
  async setManualOverride(
    userId: string,
    override: boolean,
    manualTime?: string,
  ): Promise<void> {
    if (manualTime && override) {
      await query(
        `UPDATE user_preferences
           SET preferred_check_in_time_manual_override = $1,
               preferred_check_in_time = $2,
               updated_at = NOW()
         WHERE user_id = $3`,
        [override, manualTime, userId]
      );
    } else {
      await query(
        `UPDATE user_preferences
           SET preferred_check_in_time_manual_override = $1,
               updated_at = NOW()
         WHERE user_id = $2`,
        [override, userId]
      );
    }
  }
}

// ============================================
// Helpers
// ============================================

/** Heuristic chronotype bucket from peak local hour (0–23). */
export function deriveArchetypeLabel(peakHour: number): string {
  const h = ((peakHour % 24) + 24) % 24;
  if (h >= 5 && h <= 11) return 'morning_person';
  if (h >= 12 && h <= 16) return 'midday_person';
  if (h >= 17 && h <= 21) return 'evening_person';
  return 'night_owl';
}

/**
 * True if `hour` falls in peak±1 or secondary±1 (24h wrap).
 * Used by check-in scheduler when timing profile confidence is high enough.
 */
export function isHourInReceptiveWindows(
  hour: number,
  peakHour: number,
  secondaryHour: number
): boolean {
  const h = ((hour % 24) + 24) % 24;
  const p = ((peakHour % 24) + 24) % 24;
  const s = ((secondaryHour % 24) + 24) % 24;
  const circDist = (a: number, b: number) => {
    const d = Math.abs(a - b);
    return Math.min(d, 24 - d);
  };
  return circDist(h, p) <= 1 || circDist(h, s) <= 1;
}

/** Return the index of the maximum value in an array. */
function argmax(arr: number[]): number {
  let maxIdx = 0;
  let maxVal = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

export const timingProfileService = new TimingProfileService();
