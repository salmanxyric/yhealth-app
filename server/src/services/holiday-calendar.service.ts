/**
 * @file Holiday Calendar Service
 * @description Cultural, religious, and national holiday awareness for AI coaching.
 * Provides upcoming holidays, fasting period detection (Ramadan), and schedule adjustments.
 *
 * Seed data covers major global holidays. Users can configure region + religious calendar
 * in preferences. The service is consumed by:
 * - schedule-context.service.ts (DayContext enrichment)
 * - proactive-messaging.service.ts (holiday-aware messaging)
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'religious' | 'national' | 'cultural' | 'personal';
  region: string;
  affectsFitness: boolean;
  affectsNutrition: boolean;
  metadata: Record<string, unknown>;
}

export interface HolidayContext {
  activeHolidays: Holiday[];
  upcomingHolidays: Holiday[];
  isFastingPeriod: boolean;
  fastingName: string | null;
  suggestedAdjustments: string[];
}

export interface UserHolidayPrefs {
  region: string;
  religiousCalendar: string | null;
  customHolidays: Array<{ name: string; date: string }>;
}

// ============================================
// SEED DATA — Major global holidays (year-agnostic dates where possible)
// ============================================

const SEED_HOLIDAYS: Array<Omit<Holiday, 'id'>> = [
  // Islamic
  { name: 'Ramadan', startDate: '2026-02-18', endDate: '2026-03-19', type: 'religious', region: 'global', affectsFitness: true, affectsNutrition: true, metadata: { religion: 'islamic', fasting: true } },
  { name: 'Eid al-Fitr', startDate: '2026-03-20', endDate: '2026-03-22', type: 'religious', region: 'global', affectsFitness: false, affectsNutrition: true, metadata: { religion: 'islamic' } },
  { name: 'Eid al-Adha', startDate: '2026-05-27', endDate: '2026-05-29', type: 'religious', region: 'global', affectsFitness: false, affectsNutrition: true, metadata: { religion: 'islamic' } },
  // Christian
  { name: 'Christmas', startDate: '2026-12-24', endDate: '2026-12-26', type: 'religious', region: 'global', affectsFitness: false, affectsNutrition: true, metadata: { religion: 'christian' } },
  { name: 'Easter', startDate: '2026-04-05', endDate: '2026-04-06', type: 'religious', region: 'global', affectsFitness: false, affectsNutrition: false, metadata: { religion: 'christian' } },
  { name: 'Lent', startDate: '2026-02-18', endDate: '2026-04-04', type: 'religious', region: 'global', affectsFitness: false, affectsNutrition: true, metadata: { religion: 'christian', fasting: true } },
  // Hindu
  { name: 'Diwali', startDate: '2026-10-20', endDate: '2026-10-24', type: 'religious', region: 'global', affectsFitness: false, affectsNutrition: true, metadata: { religion: 'hindu' } },
  { name: 'Navratri', startDate: '2026-10-11', endDate: '2026-10-19', type: 'religious', region: 'global', affectsFitness: false, affectsNutrition: true, metadata: { religion: 'hindu', fasting: true } },
  // Jewish
  { name: 'Yom Kippur', startDate: '2026-09-23', endDate: '2026-09-24', type: 'religious', region: 'global', affectsFitness: true, affectsNutrition: true, metadata: { religion: 'jewish', fasting: true } },
  // Universal
  { name: 'New Year', startDate: '2026-12-31', endDate: '2027-01-01', type: 'cultural', region: 'global', affectsFitness: false, affectsNutrition: true, metadata: {} },
];

// ============================================
// SERVICE
// ============================================

class HolidayCalendarService {
  private seeded = false;

  /**
   * Ensure holiday_calendar table exists and seed if empty.
   */
  async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    try {
      const countResult = await query<{ count: string }>('SELECT COUNT(*) as count FROM holiday_calendar');
      if (parseInt(countResult.rows[0]?.count || '0') === 0) {
        await this.seedHolidays();
      }
      this.seeded = true;
    } catch {
      // Table may not exist yet — safe to skip
    }
  }

  private async seedHolidays(): Promise<void> {
    for (const h of SEED_HOLIDAYS) {
      try {
        await query(
          `INSERT INTO holiday_calendar (name, start_date, end_date, type, region, affects_fitness, affects_nutrition, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [h.name, h.startDate, h.endDate, h.type, h.region, h.affectsFitness, h.affectsNutrition, JSON.stringify(h.metadata)],
        );
      } catch (error) {
        logger.warn('[HolidayCalendar] Error seeding holiday', {
          name: h.name,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
    logger.info('[HolidayCalendar] Seed data applied');
  }

  /**
   * Get user's holiday preferences.
   */
  async getUserPreferences(userId: string): Promise<UserHolidayPrefs> {
    try {
      const result = await query<{
        region: string;
        religious_calendar: string | null;
        custom_holidays: Array<{ name: string; date: string }>;
      }>(
        'SELECT region, religious_calendar, custom_holidays FROM user_holiday_preferences WHERE user_id = $1',
        [userId],
      );

      if (result.rows.length === 0) {
        return { region: 'global', religiousCalendar: null, customHolidays: [] };
      }

      const row = result.rows[0];
      return {
        region: row.region,
        religiousCalendar: row.religious_calendar,
        customHolidays: Array.isArray(row.custom_holidays) ? row.custom_holidays : [],
      };
    } catch {
      return { region: 'global', religiousCalendar: null, customHolidays: [] };
    }
  }

  /**
   * Save user's holiday preferences.
   */
  async saveUserPreferences(userId: string, prefs: Partial<UserHolidayPrefs>): Promise<void> {
    await query(
      `INSERT INTO user_holiday_preferences (user_id, region, religious_calendar, custom_holidays, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         region = COALESCE(EXCLUDED.region, user_holiday_preferences.region),
         religious_calendar = COALESCE(EXCLUDED.religious_calendar, user_holiday_preferences.religious_calendar),
         custom_holidays = COALESCE(EXCLUDED.custom_holidays, user_holiday_preferences.custom_holidays),
         updated_at = NOW()`,
      [userId, prefs.region || 'global', prefs.religiousCalendar || null, JSON.stringify(prefs.customHolidays || [])],
    );
  }

  /**
   * Get holiday context for a user on a given date.
   * Used by schedule-context and proactive messaging.
   */
  async getHolidayContext(userId: string, date?: string): Promise<HolidayContext> {
    await this.ensureSeeded();
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const prefs = await this.getUserPreferences(userId);

      // Build region filter
      const regions = ['global'];
      if (prefs.region && prefs.region !== 'global') regions.push(prefs.region);

      // Active holidays (date falls within range)
      const activeResult = await query<{
        id: string; name: string; start_date: string; end_date: string;
        type: string; region: string; affects_fitness: boolean;
        affects_nutrition: boolean; metadata: Record<string, unknown>;
      }>(
        `SELECT * FROM holiday_calendar
         WHERE start_date <= $1::date AND end_date >= $1::date
           AND region = ANY($2)
         ORDER BY start_date`,
        [targetDate, regions],
      );

      // Filter by user's religious calendar if set
      let activeHolidays = activeResult.rows.map(this.mapHoliday);
      if (prefs.religiousCalendar) {
        activeHolidays = activeHolidays.filter((h) => {
          const religion = (h.metadata as Record<string, unknown>)?.religion;
          return !religion || religion === prefs.religiousCalendar || h.type !== 'religious';
        });
      }

      // Upcoming holidays (next 14 days)
      const upcomingResult = await query<{
        id: string; name: string; start_date: string; end_date: string;
        type: string; region: string; affects_fitness: boolean;
        affects_nutrition: boolean; metadata: Record<string, unknown>;
      }>(
        `SELECT * FROM holiday_calendar
         WHERE start_date > $1::date AND start_date <= ($1::date + INTERVAL '14 days')
           AND region = ANY($2)
         ORDER BY start_date
         LIMIT 5`,
        [targetDate, regions],
      );

      let upcomingHolidays = upcomingResult.rows.map(this.mapHoliday);
      if (prefs.religiousCalendar) {
        upcomingHolidays = upcomingHolidays.filter((h) => {
          const religion = (h.metadata as Record<string, unknown>)?.religion;
          return !religion || religion === prefs.religiousCalendar || h.type !== 'religious';
        });
      }

      // Detect fasting periods
      const fastingHoliday = activeHolidays.find(
        (h) => (h.metadata as Record<string, unknown>)?.fasting === true,
      );

      // Generate suggested adjustments
      const suggestedAdjustments: string[] = [];
      if (fastingHoliday) {
        if (fastingHoliday.affectsFitness) {
          suggestedAdjustments.push('Consider lighter workouts during fasting hours');
        }
        if (fastingHoliday.affectsNutrition) {
          suggestedAdjustments.push('Adjust meal timing and hydration goals');
        }
      }
      for (const h of activeHolidays) {
        if (h.affectsNutrition && !(h.metadata as Record<string, unknown>)?.fasting) {
          suggestedAdjustments.push(`${h.name}: Be mindful of nutrition during celebrations`);
        }
      }
      for (const h of upcomingHolidays) {
        const daysUntil = Math.ceil(
          (new Date(h.startDate).getTime() - new Date(targetDate).getTime()) / 86400000,
        );
        if (daysUntil <= 7) {
          suggestedAdjustments.push(`${h.name} starts in ${daysUntil} day${daysUntil > 1 ? 's' : ''} — consider adjusting your targets`);
        }
      }

      return {
        activeHolidays,
        upcomingHolidays,
        isFastingPeriod: !!fastingHoliday,
        fastingName: fastingHoliday?.name || null,
        suggestedAdjustments,
      };
    } catch (error) {
      logger.error('[HolidayCalendar] Error getting context', {
        userId,
        date: targetDate,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      return {
        activeHolidays: [],
        upcomingHolidays: [],
        isFastingPeriod: false,
        fastingName: null,
        suggestedAdjustments: [],
      };
    }
  }

  /**
   * Get upcoming holidays for display in the schedule UI.
   */
  async getUpcomingHolidays(userId: string, days: number = 30): Promise<Holiday[]> {
    await this.ensureSeeded();
    const prefs = await this.getUserPreferences(userId);
    const regions = ['global'];
    if (prefs.region && prefs.region !== 'global') regions.push(prefs.region);

    const result = await query<{
      id: string; name: string; start_date: string; end_date: string;
      type: string; region: string; affects_fitness: boolean;
      affects_nutrition: boolean; metadata: Record<string, unknown>;
    }>(
      `SELECT * FROM holiday_calendar
       WHERE start_date >= CURRENT_DATE AND start_date <= CURRENT_DATE + $1::int
         AND region = ANY($2)
       ORDER BY start_date
       LIMIT 10`,
      [days, regions],
    );

    return result.rows.map(this.mapHoliday);
  }

  private mapHoliday(row: {
    id: string; name: string; start_date: string; end_date: string;
    type: string; region: string; affects_fitness: boolean;
    affects_nutrition: boolean; metadata: Record<string, unknown>;
  }): Holiday {
    return {
      id: row.id,
      name: row.name,
      startDate: String(row.start_date).substring(0, 10),
      endDate: String(row.end_date).substring(0, 10),
      type: row.type as Holiday['type'],
      region: row.region,
      affectsFitness: row.affects_fitness,
      affectsNutrition: row.affects_nutrition,
      metadata: row.metadata || {},
    };
  }
}

export const holidayCalendarService = new HolidayCalendarService();
