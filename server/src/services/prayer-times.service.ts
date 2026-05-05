import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

interface PrayerConfig {
  city: string;
  country: string;
  method?: number;
  date?: string;
}

interface PrayerScheduleRow {
  id: string;
  user_id: string;
  prayer_date: string;
  prayer_name: string;
  scheduled_time: string;
  completed: boolean;
  completed_at: string | null;
  source: string;
  created_at: string;
}

interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

interface AladhanResponse {
  code: number;
  status: string;
  data: {
    timings: AladhanTimings;
    date: { readable: string; gregorian: { date: string } };
    meta: { timezone: string };
  };
}

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'tahajjud'] as const;

const ALADHAN_KEY_MAP: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

// ============================================
// SERVICE CLASS
// ============================================

class PrayerTimesService {
  /**
   * Fetch times from Aladhan and upsert into prayer_schedules.
   * Tahajjud is set to 1 hour before Fajr.
   */
  async syncPrayerTimes(
    userId: string,
    config: PrayerConfig,
  ): Promise<PrayerScheduleRow[]> {
    const method = config.method ?? 2;
    const dateStr = config.date ?? this.todayDDMMYYYY();

    const url =
      `https://api.aladhan.com/v1/timingsByCity/${dateStr}` +
      `?city=${encodeURIComponent(config.city)}` +
      `&country=${encodeURIComponent(config.country)}` +
      `&method=${method}`;

    logger.info('[PrayerTimes] Fetching from Aladhan', { userId, url });

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      logger.error('[PrayerTimes] Aladhan API error', { status: res.status, body });
      throw new Error(`Aladhan API returned ${res.status}`);
    }

    const json = (await res.json()) as AladhanResponse;
    const timings = json.data.timings;
    const tz = json.data.meta.timezone;

    const isoDate = this.ddmmyyyyToISO(dateStr);

    const rows: PrayerScheduleRow[] = [];
    for (const name of PRAYER_NAMES) {
      const hhmm = this.resolveTime(name, timings);
      const scheduledTime = this.toTimestamptz(isoDate, hhmm, tz);

      const result = await query<PrayerScheduleRow>(
        `INSERT INTO prayer_schedules (user_id, prayer_date, prayer_name, scheduled_time, source)
         VALUES ($1, $2::date, $3, $4, 'api')
         ON CONFLICT (user_id, prayer_date, prayer_name)
         DO UPDATE SET scheduled_time = $4
         RETURNING *`,
        [userId, isoDate, name, scheduledTime],
      );

      if (result.rows[0]) rows.push(result.rows[0]);
    }

    logger.info('[PrayerTimes] Synced prayers', { userId, date: isoDate, count: rows.length });
    return rows;
  }

  /**
   * Get all prayer records for a user on a given date (YYYY-MM-DD), ordered by time.
   */
  async getPrayerSchedule(userId: string, date: string): Promise<PrayerScheduleRow[]> {
    const result = await query<PrayerScheduleRow>(
      `SELECT * FROM prayer_schedules
       WHERE user_id = $1 AND prayer_date = $2::date
       ORDER BY scheduled_time`,
      [userId, date],
    );
    return result.rows;
  }

  /**
   * Mark a single prayer as completed.
   */
  async markCompleted(userId: string, prayerId: string): Promise<boolean> {
    const result = await query(
      `UPDATE prayer_schedules
       SET completed = true, completed_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [prayerId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Return adherence percentage for a user on a given date (0-100).
   */
  async getAdherence(userId: string, date: string): Promise<number> {
    const result = await query<{ total: string; done: string }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE completed)::text AS done
       FROM prayer_schedules
       WHERE user_id = $1 AND prayer_date = $2::date`,
      [userId, date],
    );

    const { total, done } = result.rows[0] ?? { total: '0', done: '0' };
    const t = parseInt(total, 10);
    if (t === 0) return 0;
    return Math.round((parseInt(done, 10) / t) * 100);
  }

  /**
   * Emit data_source_signals for prayer times and completions on a given date.
   */
  async emitSignals(userId: string, date: string): Promise<void> {
    const prayers = await this.getPrayerSchedule(userId, date);
    if (prayers.length === 0) return;

    for (const p of prayers) {
      await query(
        `INSERT INTO data_source_signals (user_id, source_type, signal_type, signal_date, start_time, value, metadata)
         VALUES ($1, 'prayer', 'prayer_time', $2::date, $3, $4, $5)`,
        [
          userId,
          date,
          p.scheduled_time,
          JSON.stringify({ prayer: p.prayer_name, scheduled: p.scheduled_time }),
          JSON.stringify({ source: 'aladhan' }),
        ],
      );

      if (p.completed) {
        await query(
          `INSERT INTO data_source_signals (user_id, source_type, signal_type, signal_date, start_time, end_time, value, metadata)
           VALUES ($1, 'prayer', 'prayer_completed', $2::date, $3, $4, $5, $6)`,
          [
            userId,
            date,
            p.scheduled_time,
            p.completed_at,
            JSON.stringify({ prayer: p.prayer_name, completed_at: p.completed_at }),
            JSON.stringify({ source: 'aladhan' }),
          ],
        );
      }
    }

    const adherence = await this.getAdherence(userId, date);
    await query(
      `INSERT INTO data_source_signals (user_id, source_type, signal_type, signal_date, value, metadata)
       VALUES ($1, 'prayer', 'prayer_adherence', $2::date, $3, $4)`,
      [
        userId,
        date,
        JSON.stringify({ adherence_pct: adherence, total: prayers.length, completed: prayers.filter(p => p.completed).length }),
        JSON.stringify({ source: 'aladhan' }),
      ],
    );

    logger.info('[PrayerTimes] Emitted signals', { userId, date, adherence });
  }

  /**
   * Return last 7 days of adherence percentages (most recent first).
   */
  async getWeeklyAdherence(userId: string): Promise<Array<{ date: string; adherence: number }>> {
    const result = await query<{ prayer_date: string; total: string; done: string }>(
      `SELECT
         prayer_date,
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE completed)::text AS done
       FROM prayer_schedules
       WHERE user_id = $1
         AND prayer_date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY prayer_date
       ORDER BY prayer_date DESC`,
      [userId],
    );

    return result.rows.map(r => {
      const t = parseInt(r.total, 10);
      return {
        date: r.prayer_date,
        adherence: t === 0 ? 0 : Math.round((parseInt(r.done, 10) / t) * 100),
      };
    });
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private todayDDMMYYYY(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  }

  private ddmmyyyyToISO(ddmmyyyy: string): string {
    const [dd, mm, yyyy] = ddmmyyyy.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Resolve the HH:mm time for a prayer name.
   * Tahajjud = 1 hour before Fajr.
   */
  private resolveTime(name: string, timings: AladhanTimings): string {
    if (name === 'tahajjud') {
      const fajr = timings.Fajr.split(' ')[0]; // strip any "(EET)" suffix
      const [h, m] = fajr.split(':').map(Number);
      const totalMin = h * 60 + m - 60;
      const adjH = totalMin < 0 ? 24 + Math.floor(totalMin / 60) : Math.floor(totalMin / 60);
      const adjM = ((totalMin % 60) + 60) % 60;
      return `${String(adjH).padStart(2, '0')}:${String(adjM).padStart(2, '0')}`;
    }
    const key = ALADHAN_KEY_MAP[name];
    if (!key) throw new Error(`Unknown prayer: ${name}`);
    return timings[key].split(' ')[0];
  }

  /**
   * Build a TIMESTAMPTZ string from an ISO date (YYYY-MM-DD), HH:mm time, and IANA timezone.
   */
  private toTimestamptz(isoDate: string, hhmm: string, tz: string): string {
    return `${isoDate} ${hhmm}:00 ${tz}`;
  }
}

export const prayerTimesService = new PrayerTimesService();
export default prayerTimesService;
