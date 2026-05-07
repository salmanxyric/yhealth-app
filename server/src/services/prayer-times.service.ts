import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

interface PrayerConfig {
  city?: string;
  country?: string;
  state?: string;
  method?: number;
  school?: number;
  latitudeAdjustmentMethod?: number;
  midnightMode?: number;
  adjustment?: number;
  timezone?: string;
  offsets?: Partial<Record<PrayerName, number>>;
  manualTimes?: Partial<Record<PrayerName, string>>;
  includeTahajjud?: boolean;
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
export type PrayerName = typeof PRAYER_NAMES[number];

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
    const normalized = this.normalizeConfig(config);
    const dateStr = this.dateToDDMMYYYY(normalized.date ?? this.todayDDMMYYYY());
    const isoDate = this.dateToISO(dateStr);

    if (!normalized.city || !normalized.country) {
      throw new Error('Prayer times require both city and country');
    }

    const url = this.buildAladhanUrl(dateStr, normalized);
    logger.info('[PrayerTimes] Fetching from Aladhan', { userId, url });

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      logger.error('[PrayerTimes] Aladhan API error', { status: res.status, body });
      throw new Error(`Aladhan API returned ${res.status}`);
    }

    const json = (await res.json()) as AladhanResponse;
    const timings = json.data.timings;
    const tz = normalized.timezone || json.data.meta.timezone;

    const rows: PrayerScheduleRow[] = [];
    for (const name of this.getEnabledPrayerNames(normalized)) {
      const hhmm = normalized.manualTimes?.[name] || this.resolveTime(name, timings);
      const scheduledTime = this.toTimestamptz(isoDate, hhmm, tz);
      const source = normalized.manualTimes?.[name] ? 'manual' : 'api';

      const result = await query<PrayerScheduleRow>(
        `INSERT INTO prayer_schedules (user_id, prayer_date, prayer_name, scheduled_time, source)
         VALUES ($1, $2::date, $3, $4, $5)
         ON CONFLICT (user_id, prayer_date, prayer_name)
         DO UPDATE SET scheduled_time = $4, source = $5
         RETURNING *`,
        [userId, isoDate, name, scheduledTime, source],
      );

      if (result.rows[0]) rows.push(result.rows[0]);
    }

    logger.info('[PrayerTimes] Synced prayers', { userId, date: isoDate, count: rows.length });
    return rows;
  }

  async upsertManualPrayerTimes(
    userId: string,
    date: string,
    manualTimes: Partial<Record<PrayerName, string>>,
    timezone = 'UTC',
  ): Promise<PrayerScheduleRow[]> {
    const isoDate = this.dateToISO(date);
    const rows: PrayerScheduleRow[] = [];

    for (const [name, hhmm] of Object.entries(manualTimes) as Array<[PrayerName, string]>) {
      if (!PRAYER_NAMES.includes(name) || !hhmm) continue;
      if (!this.isValidHHMM(hhmm)) throw new Error(`Invalid time for ${name}`);

      const result = await query<PrayerScheduleRow>(
        `INSERT INTO prayer_schedules (user_id, prayer_date, prayer_name, scheduled_time, source)
         VALUES ($1, $2::date, $3, $4, 'manual')
         ON CONFLICT (user_id, prayer_date, prayer_name)
         DO UPDATE SET scheduled_time = $4, source = 'manual'
         RETURNING *`,
        [userId, isoDate, name, this.toTimestamptz(isoDate, hhmm, timezone)],
      );

      if (result.rows[0]) rows.push(result.rows[0]);
    }

    logger.info('[PrayerTimes] Saved manual prayer times', { userId, date: isoDate, count: rows.length });
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

  private dateToISO(date: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const [dd, mm, yyyy] = date.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  private dateToDDMMYYYY(date: string): string {
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) return date;
    const [yyyy, mm, dd] = date.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  private buildAladhanUrl(dateStr: string, config: PrayerConfig): string {
    const params = new URLSearchParams({
      city: config.city || '',
      country: config.country || '',
      method: String(config.method ?? 1),
    });

    if (config.state) params.set('state', config.state);
    if (config.school !== undefined) params.set('school', String(config.school));
    if (config.latitudeAdjustmentMethod !== undefined) {
      params.set('latitudeAdjustmentMethod', String(config.latitudeAdjustmentMethod));
    }
    if (config.midnightMode !== undefined) params.set('midnightMode', String(config.midnightMode));
    if (config.adjustment !== undefined) params.set('adjustment', String(config.adjustment));
    if (config.timezone) params.set('timezonestring', config.timezone);

    const tune = this.buildTuneString(config.offsets);
    if (tune) params.set('tune', tune);

    return `https://api.aladhan.com/v1/timingsByCity/${dateStr}?${params.toString()}`;
  }

  private normalizeConfig(config: PrayerConfig): PrayerConfig {
    const manualTimes = this.normalizeManualTimes(config.manualTimes);
    return {
      ...config,
      city: config.city?.trim(),
      country: config.country?.trim(),
      state: config.state?.trim(),
      method: Number.isFinite(config.method) ? config.method : 1,
      school: config.school === 1 ? 1 : 0,
      includeTahajjud: config.includeTahajjud !== false,
      offsets: this.normalizeOffsets(config.offsets),
      manualTimes,
    };
  }

  private normalizeManualTimes(times?: Partial<Record<PrayerName, string>>): Partial<Record<PrayerName, string>> {
    const normalized: Partial<Record<PrayerName, string>> = {};
    if (!times) return normalized;

    for (const name of PRAYER_NAMES) {
      const value = times[name]?.trim();
      if (!value) continue;
      if (!this.isValidHHMM(value)) throw new Error(`Invalid manual prayer time for ${name}`);
      normalized[name] = value;
    }

    return normalized;
  }

  private normalizeOffsets(offsets?: Partial<Record<PrayerName, number>>): Partial<Record<PrayerName, number>> {
    const normalized: Partial<Record<PrayerName, number>> = {};
    if (!offsets) return normalized;

    for (const name of PRAYER_NAMES) {
      const value = offsets[name];
      if (value === undefined || value === null) continue;
      const minutes = Number(value);
      if (!Number.isFinite(minutes)) continue;
      normalized[name] = Math.max(-60, Math.min(60, Math.trunc(minutes)));
    }

    return normalized;
  }

  private buildTuneString(offsets?: Partial<Record<PrayerName, number>>): string | null {
    if (!offsets || Object.keys(offsets).length === 0) return null;
    const values = [
      0,
      offsets.fajr ?? 0,
      0,
      offsets.dhuhr ?? 0,
      offsets.asr ?? 0,
      offsets.maghrib ?? 0,
      0,
      offsets.isha ?? 0,
      0,
    ];
    return values.join(',');
  }

  private getEnabledPrayerNames(config: PrayerConfig): PrayerName[] {
    return config.includeTahajjud === false
      ? PRAYER_NAMES.filter(name => name !== 'tahajjud')
      : [...PRAYER_NAMES];
  }

  private isValidHHMM(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
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
