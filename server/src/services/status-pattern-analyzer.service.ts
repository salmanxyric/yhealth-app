import { query } from '../database/pg.js';
import { logger } from './logger.service.js';
import type { StatusPattern } from '../types/activity-status.types.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const NON_WORKING_STATUSES = ['sick', 'injury', 'rest', 'vacation', 'travel', 'stress', 'poor', 'fair'];
// Minimum history needed before patterns are meaningful (avoids false positives from sparse data)
const MIN_WEEKS_FOR_PATTERNS = 4;
// Day must have non-working status in >=40% of tracked weeks to count as a pattern
const MIN_FREQUENCY_THRESHOLD = 0.4;

class StatusPatternAnalyzerService {
  async analyzeDayOfWeekPatterns(userId: string): Promise<StatusPattern[]> {
    const result = await query<{
      day_of_week: number;
      status: string;
      count: string;
    }>(
      `SELECT EXTRACT(DOW FROM status_date)::int AS day_of_week,
              activity_status AS status,
              COUNT(*)::text AS count
       FROM activity_status_history
       WHERE user_id = $1
         AND status_date >= CURRENT_DATE - INTERVAL '8 weeks'
       GROUP BY day_of_week, activity_status
       ORDER BY day_of_week, count DESC`,
      [userId]
    );

    if (result.rows.length === 0) return [];

    const patterns: StatusPattern[] = [];
    const byDay = new Map<number, { status: string; count: number }[]>();

    for (const row of result.rows) {
      const day = row.day_of_week;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push({ status: row.status, count: parseInt(row.count, 10) });
    }

    for (const [day, statuses] of byDay) {
      const total = statuses.reduce((sum, s) => sum + s.count, 0);
      const nonWorking = statuses
        .filter(s => NON_WORKING_STATUSES.includes(s.status))
        .reduce((sum, s) => sum + s.count, 0);
      const frequency = nonWorking / total;

      if (frequency >= MIN_FREQUENCY_THRESHOLD && total >= MIN_WEEKS_FOR_PATTERNS) {
        const dayName = DAY_NAMES[day] ?? `Day ${day}`;
        const topStatus = statuses
          .filter(s => NON_WORKING_STATUSES.includes(s.status))
          .sort((a, b) => b.count - a.count)[0];

        if (!topStatus) continue; // Skip if no non-working statuses after filtering

        patterns.push({
          type: 'day_of_week',
          pattern: `Low energy on ${dayName}s (${topStatus.status} ${Math.round(frequency * 100)}% of the time)`,
          confidence: Math.min(frequency + 0.1, 1.0),
          frequency,
          firstObserved: new Date().toISOString(),
          lastConfirmed: new Date().toISOString(),
          suggestion: `Schedule lighter ${dayName} sessions or make ${dayName} an intentional rest day`,
        });
      }
    }

    return patterns;
  }

  async analyzePostEventPatterns(userId: string): Promise<StatusPattern[]> {
    const result = await query<{
      trigger_status: string;
      next_day_status: string;
      count: string;
    }>(
      `SELECT a1.activity_status AS trigger_status,
              a2.activity_status AS next_day_status,
              COUNT(*)::text AS count
       FROM activity_status_history a1
       JOIN activity_status_history a2
         ON a1.user_id = a2.user_id
        AND a2.status_date = a1.status_date + INTERVAL '1 day'
       WHERE a1.user_id = $1
         AND a1.activity_status IN ('travel', 'vacation', 'sick', 'injury')
         AND a1.status_date >= CURRENT_DATE - INTERVAL '12 weeks'
       GROUP BY trigger_status, next_day_status
       ORDER BY trigger_status, count DESC`,
      [userId]
    );

    if (result.rows.length === 0) return [];

    const patterns: StatusPattern[] = [];
    const byTrigger = new Map<string, { status: string; count: number }[]>();

    for (const row of result.rows) {
      if (!byTrigger.has(row.trigger_status)) byTrigger.set(row.trigger_status, []);
      byTrigger.get(row.trigger_status)!.push({
        status: row.next_day_status,
        count: parseInt(row.count, 10),
      });
    }

    for (const [trigger, outcomes] of byTrigger) {
      const total = outcomes.reduce((sum, o) => sum + o.count, 0);
      const nonWorking = outcomes
        .filter(o => NON_WORKING_STATUSES.includes(o.status))
        .reduce((sum, o) => sum + o.count, 0);
      const frequency = nonWorking / total;

      if (frequency >= MIN_FREQUENCY_THRESHOLD && total >= 2) {
        patterns.push({
          type: 'post_event',
          pattern: `Usually needs recovery after ${trigger} (${Math.round(frequency * 100)}% drop-off rate)`,
          confidence: Math.min(frequency, 1.0),
          frequency,
          firstObserved: new Date().toISOString(),
          lastConfirmed: new Date().toISOString(),
          suggestion: `Plan a light recovery day after ${trigger} ends`,
        });
      }
    }

    return patterns;
  }

  async analyzeAllPatterns(userId: string): Promise<StatusPattern[]> {
    const [dayPatterns, eventPatterns] = await Promise.all([
      this.analyzeDayOfWeekPatterns(userId),
      this.analyzePostEventPatterns(userId),
    ]);

    const allPatterns = [...dayPatterns, ...eventPatterns];

    logger.info('[StatusPatternAnalyzer] Analysis complete', {
      userId,
      dayPatterns: dayPatterns.length,
      eventPatterns: eventPatterns.length,
    });

    return allPatterns;
  }

  async persistPatterns(userId: string, patterns: StatusPattern[]): Promise<void> {
    await query(
      `UPDATE user_coaching_profiles SET status_patterns = $1, updated_at = NOW() WHERE user_id = $2`,
      [JSON.stringify(patterns), userId]
    );
  }
}

export const statusPatternAnalyzerService = new StatusPatternAnalyzerService();
