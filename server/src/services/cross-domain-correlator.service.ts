/**
 * @file Cross-Domain Correlator Service
 * @description Runs correlation rules across all data sources (calendar, finance,
 * prayer, Spotify, workouts, meals, sleep, mood) and computes daily correlation
 * snapshots persisted to user_daily_correlations.
 */

import { pool } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface CorrelationRule {
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  evidence: string[];
  domains: string[];
}

export interface DailyCorrelation {
  id: string;
  userId: string;
  correlationDate: string;
  stressScore: number;
  energyScore: number;
  moodScore: number;
  availabilityScore: number;
  calendarLoad: number;
  musicMood: string | null;
  prayerAdherence: number;
  spendingStress: number;
  correlations: CorrelationRule[];
  recommendedMode: 'short' | 'normal' | 'deep';
  toneAdjustment: 'supportive' | 'motivational' | 'direct' | 'celebratory';
  signalsSummary: Record<string, unknown>;
  computedAt: string;
}

interface AggregatedSignals {
  calendar: Array<{ value: Record<string, unknown>; startTime: string | null }>;
  finance: Array<{ value: Record<string, unknown>; startTime: string | null }>;
  prayer: Array<{ value: Record<string, unknown>; startTime: string | null }>;
  spotify: Array<{ value: Record<string, unknown>; startTime: string | null }>;
  [key: string]: Array<{ value: Record<string, unknown>; startTime: string | null }>;
}

interface DayContext {
  calendarEventCount: number;
  workoutCount: number;
  mealCount: number;
  sleepHours: number | null;
  moodAvg: number | null;
}

// ============================================
// HELPERS
// ============================================

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ============================================
// SERVICE
// ============================================

class CrossDomainCorrelatorService {

  // ──────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────

  /**
   * Compute (or recompute) the daily correlation snapshot for a user+date.
   * Fetches signals, runs rules, computes scores, and upserts the result.
   */
  async computeDailyCorrelation(userId: string, date: string): Promise<DailyCorrelation> {
    logger.info('[CrossDomainCorrelator] Computing daily correlation', { userId, date });

    const [signals, dayCtx] = await Promise.all([
      this.fetchSignals(userId, date),
      this.fetchDayContext(userId, date),
    ]);

    const aggregated = this.aggregateSignals(signals);

    const spotifyValenceAvg = this.avgSpotifyField(aggregated.spotify, 'valence');
    const spotifyEnergyAvg = this.avgSpotifyField(aggregated.spotify, 'energy');
    const calendarLoad = dayCtx.calendarEventCount;
    const spendingStress = this.computeSpendingStress(aggregated.finance);
    const prayerAdherence = this.computePrayerAdherence(aggregated.prayer);

    const ruleCtx = {
      calendarLoad,
      spotifyValenceAvg,
      spotifyEnergyAvg,
      spendingStress,
      prayerAdherence,
      sleepHours: dayCtx.sleepHours,
      moodScore: dayCtx.moodAvg,
      workoutCount: dayCtx.workoutCount,
      financeSignals: aggregated.finance,
      prayerSignals: aggregated.prayer,
    };

    const correlations = this.runAllRules(ruleCtx);

    const stressScore = this.computeStressScore(ruleCtx);
    const energyScore = this.computeEnergyScore(ruleCtx);
    const moodScore = this.computeMoodScore(ruleCtx);
    const availabilityScore = this.computeAvailabilityScore(ruleCtx);

    const recommendedMode = this.pickRecommendedMode(stressScore, energyScore);
    const toneAdjustment = this.pickToneAdjustment(stressScore, energyScore, moodScore);

    const musicMood = spotifyValenceAvg != null
      ? (spotifyValenceAvg > 0.6 ? 'positive' : spotifyValenceAvg > 0.35 ? 'neutral' : 'melancholic')
      : null;

    const signalsSummary = {
      signalCount: signals.length,
      sourceTypes: Object.keys(aggregated).filter(k => aggregated[k].length > 0),
      calendarLoad,
      spendingStress,
      prayerAdherence,
      spotifyValenceAvg,
      spotifyEnergyAvg,
      mealCount: dayCtx.mealCount,
      workoutCount: dayCtx.workoutCount,
      sleepHours: dayCtx.sleepHours,
      moodAvg: dayCtx.moodAvg,
    };

    const { rows } = await pool.query(
      `INSERT INTO user_daily_correlations (
        user_id, correlation_date,
        stress_score, energy_score, mood_score, availability_score,
        calendar_load, music_mood, prayer_adherence, spending_stress,
        correlations, recommended_mode, tone_adjustment,
        signals_summary, computed_at
      ) VALUES (
        $1, $2,
        $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13,
        $14, NOW()
      )
      ON CONFLICT (user_id, correlation_date) DO UPDATE SET
        stress_score      = EXCLUDED.stress_score,
        energy_score      = EXCLUDED.energy_score,
        mood_score         = EXCLUDED.mood_score,
        availability_score = EXCLUDED.availability_score,
        calendar_load      = EXCLUDED.calendar_load,
        music_mood         = EXCLUDED.music_mood,
        prayer_adherence   = EXCLUDED.prayer_adherence,
        spending_stress    = EXCLUDED.spending_stress,
        correlations       = EXCLUDED.correlations,
        recommended_mode   = EXCLUDED.recommended_mode,
        tone_adjustment    = EXCLUDED.tone_adjustment,
        signals_summary    = EXCLUDED.signals_summary,
        computed_at        = NOW()
      RETURNING *`,
      [
        userId, date,
        stressScore, energyScore, moodScore, availabilityScore,
        calendarLoad, musicMood, prayerAdherence, spendingStress,
        JSON.stringify(correlations), recommendedMode, toneAdjustment,
        JSON.stringify(signalsSummary),
      ]
    );

    logger.info('[CrossDomainCorrelator] Correlation computed', {
      userId, date, stressScore, energyScore, moodScore,
      rulesFired: correlations.length,
    });

    return this.mapRow(rows[0]);
  }

  /**
   * Read a single day's precomputed correlation.
   */
  async getCorrelation(userId: string, date: string): Promise<DailyCorrelation | null> {
    const { rows } = await pool.query(
      `SELECT * FROM user_daily_correlations
       WHERE user_id = $1 AND correlation_date = $2`,
      [userId, date]
    );

    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  /**
   * Get the last N days of correlation history.
   */
  async getCorrelationHistory(userId: string, days: number): Promise<DailyCorrelation[]> {
    const { rows } = await pool.query(
      `SELECT * FROM user_daily_correlations
       WHERE user_id = $1
         AND correlation_date >= CURRENT_DATE - $2::int
       ORDER BY correlation_date DESC`,
      [userId, days]
    );

    return rows.map(this.mapRow);
  }

  /**
   * Return cached correlation if computed within 15 minutes, otherwise recompute.
   */
  async getCachedOrCompute(userId: string, date: string): Promise<DailyCorrelation> {
    const existing = await this.getCorrelation(userId, date);

    if (existing) {
      const computedAt = new Date(existing.computedAt).getTime();
      const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
      if (computedAt > fifteenMinAgo) {
        logger.debug('[CrossDomainCorrelator] Returning cached correlation', { userId, date });
        return existing;
      }
    }

    return this.computeDailyCorrelation(userId, date);
  }

  // ──────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────

  private async fetchSignals(
    userId: string,
    date: string
  ): Promise<Array<{ sourceType: string; signalType: string; value: Record<string, unknown>; startTime: string | null }>> {
    const { rows } = await pool.query(
      `SELECT source_type, signal_type, value, start_time
       FROM data_source_signals
       WHERE user_id = $1 AND signal_date = $2`,
      [userId, date]
    );

    return rows.map((r: Record<string, unknown>) => ({
      sourceType: r.source_type as string,
      signalType: r.signal_type as string,
      value: (typeof r.value === 'string' ? JSON.parse(r.value) : r.value) as Record<string, unknown>,
      startTime: r.start_time as string | null,
    }));
  }

  private async fetchDayContext(userId: string, date: string): Promise<DayContext> {
    const [calendarRes, workoutRes, mealRes, sleepRes, moodRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM calendar_events
         WHERE user_id = $1 AND DATE(start_time) = $2`,
        [userId, date]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM workout_logs
         WHERE user_id = $1 AND DATE(completed_at) = $2`,
        [userId, date]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM meal_logs
         WHERE user_id = $1 AND DATE(eaten_at) = $2`,
        [userId, date]
      ),
      pool.query(
        `SELECT sleep_hours FROM daily_health_metrics
         WHERE user_id = $1 AND metric_date = $2`,
        [userId, date]
      ),
      pool.query(
        `SELECT AVG(mood_rating)::numeric(5,2) AS avg_mood FROM mood_logs
         WHERE user_id = $1 AND DATE(logged_at) = $2 AND mood_rating IS NOT NULL`,
        [userId, date]
      ),
    ]);

    return {
      calendarEventCount: calendarRes.rows[0]?.cnt ?? 0,
      workoutCount: workoutRes.rows[0]?.cnt ?? 0,
      mealCount: mealRes.rows[0]?.cnt ?? 0,
      sleepHours: sleepRes.rows[0]?.sleep_hours != null
        ? parseFloat(sleepRes.rows[0].sleep_hours)
        : null,
      moodAvg: moodRes.rows[0]?.avg_mood != null
        ? parseFloat(moodRes.rows[0].avg_mood)
        : null,
    };
  }

  // ──────────────────────────────────────────
  // SIGNAL AGGREGATION
  // ──────────────────────────────────────────

  private aggregateSignals(
    signals: Array<{ sourceType: string; signalType: string; value: Record<string, unknown>; startTime: string | null }>
  ): AggregatedSignals {
    const agg: AggregatedSignals = { calendar: [], finance: [], prayer: [], spotify: [] };

    for (const s of signals) {
      const bucket = agg[s.sourceType] ?? [];
      bucket.push({ value: s.value, startTime: s.startTime });
      agg[s.sourceType] = bucket;
    }

    return agg;
  }

  // ──────────────────────────────────────────
  // CORRELATION RULES
  // ──────────────────────────────────────────

  private runAllRules(ctx: Record<string, unknown>): CorrelationRule[] {
    const rules: CorrelationRule[] = [];

    const fired = [
      this.ruleCalendarOverloadMoodDrop(ctx),
      this.ruleSpendingStressSleep(ctx),
      this.rulePrayerConsistencyMood(ctx),
      this.ruleBusyDayNoExercise(ctx),
      this.ruleMusicEnergyWorkout(ctx),
      this.ruleEveningSpendingSleep(ctx),
      this.ruleFastingExerciseRisk(ctx),
      this.ruleSocialCalendarIsolation(ctx),
    ];

    for (const r of fired) {
      if (r) rules.push(r);
    }

    return rules;
  }

  private ruleCalendarOverloadMoodDrop(ctx: Record<string, unknown>): CorrelationRule | null {
    const calendarLoad = ctx.calendarLoad as number;
    const valence = ctx.spotifyValenceAvg as number | null;
    const mood = ctx.moodScore as number | null;

    if (calendarLoad < 5) return null;

    const lowValence = valence != null && valence < 0.3;
    const lowMood = mood != null && mood < 40;

    if (!lowValence && !lowMood) return null;

    const evidence: string[] = [`${calendarLoad} calendar events`];
    if (lowValence) evidence.push(`Spotify valence avg ${valence!.toFixed(2)}`);
    if (lowMood) evidence.push(`Mood score ${mood}`);

    return {
      ruleId: 'CALENDAR_OVERLOAD_MOOD_DROP',
      severity: 'warning',
      description: 'Heavy schedule combined with low mood/music indicators — risk of burnout.',
      evidence,
      domains: ['calendar', 'mood', 'music'],
    };
  }

  private ruleSpendingStressSleep(ctx: Record<string, unknown>): CorrelationRule | null {
    const spending = ctx.spendingStress as number;
    const sleep = ctx.sleepHours as number | null;

    if (spending <= 60 || sleep == null || sleep >= 6) return null;

    return {
      ruleId: 'SPENDING_STRESS_SLEEP',
      severity: 'warning',
      description: 'Financial stress paired with poor sleep — compounding stress cycle.',
      evidence: [`Spending stress ${spending}`, `Sleep ${sleep.toFixed(1)}h`],
      domains: ['finance', 'sleep'],
    };
  }

  private rulePrayerConsistencyMood(ctx: Record<string, unknown>): CorrelationRule | null {
    const adherence = ctx.prayerAdherence as number;
    const mood = ctx.moodScore as number | null;

    if (adherence < 80 || mood == null || mood < 60) return null;

    return {
      ruleId: 'PRAYER_CONSISTENCY_MOOD',
      severity: 'info',
      description: 'Strong prayer routine correlates with positive mood — keep it up.',
      evidence: [`Prayer adherence ${adherence}%`, `Mood score ${mood}`],
      domains: ['prayer', 'mood'],
    };
  }

  private ruleBusyDayNoExercise(ctx: Record<string, unknown>): CorrelationRule | null {
    const calendarLoad = ctx.calendarLoad as number;
    const workoutCount = ctx.workoutCount as number;

    if (calendarLoad < 4 || workoutCount !== 0) return null;

    return {
      ruleId: 'BUSY_DAY_NO_EXERCISE',
      severity: 'warning',
      description: 'Packed schedule with no workout logged — movement helps manage stress.',
      evidence: [`${calendarLoad} calendar events`, 'No workouts logged'],
      domains: ['calendar', 'exercise'],
    };
  }

  private ruleMusicEnergyWorkout(ctx: Record<string, unknown>): CorrelationRule | null {
    const energy = ctx.spotifyEnergyAvg as number | null;
    const workoutCount = ctx.workoutCount as number;

    if (energy == null || energy <= 0.7 || workoutCount <= 0) return null;

    return {
      ruleId: 'MUSIC_ENERGY_WORKOUT',
      severity: 'info',
      description: 'High-energy music paired with exercise — strong active-recovery pattern.',
      evidence: [`Spotify energy avg ${energy.toFixed(2)}`, `${workoutCount} workout(s)`],
      domains: ['music', 'exercise'],
    };
  }

  private ruleEveningSpendingSleep(ctx: Record<string, unknown>): CorrelationRule | null {
    const financeSignals = ctx.financeSignals as Array<{ value: Record<string, unknown>; startTime: string | null }>;
    const sleep = ctx.sleepHours as number | null;

    if (sleep == null || sleep >= 6) return null;

    const hasEveningSpending = financeSignals.some(s => {
      if (!s.startTime) return false;
      const hour = new Date(s.startTime).getUTCHours();
      return hour >= 21;
    });

    if (!hasEveningSpending) return null;

    return {
      ruleId: 'EVENING_SPENDING_SLEEP',
      severity: 'warning',
      description: 'Late-night spending activity with insufficient sleep — possible anxiety loop.',
      evidence: ['Spending signals after 21:00', `Sleep ${sleep.toFixed(1)}h`],
      domains: ['finance', 'sleep'],
    };
  }

  private ruleFastingExerciseRisk(ctx: Record<string, unknown>): CorrelationRule | null {
    const prayerSignals = ctx.prayerSignals as Array<{ value: Record<string, unknown>; startTime: string | null }>;
    const workoutCount = ctx.workoutCount as number;

    const isFasting = prayerSignals.some(s => s.value.fasting === true);
    if (!isFasting || workoutCount <= 0) return null;

    const hasIntenseWorkout = workoutCount > 0; // simplified — any workout during fasting is flagged

    if (!hasIntenseWorkout) return null;

    return {
      ruleId: 'FASTING_EXERCISE_RISK',
      severity: 'warning',
      description: 'Exercise during fasting period — consider adjusting intensity or timing.',
      evidence: ['Fasting day indicated by prayer data', `${workoutCount} workout(s) logged`],
      domains: ['prayer', 'exercise'],
    };
  }

  private ruleSocialCalendarIsolation(ctx: Record<string, unknown>): CorrelationRule | null {
    const calendarLoad = ctx.calendarLoad as number;
    const mood = ctx.moodScore as number | null;

    if (calendarLoad >= 1 || mood == null || mood >= 40) return null;

    return {
      ruleId: 'SOCIAL_CALENDAR_ISOLATION',
      severity: 'warning',
      description: 'Empty calendar with declining mood — possible social isolation indicator.',
      evidence: [`${calendarLoad} calendar events`, `Mood score ${mood}`],
      domains: ['calendar', 'mood', 'social'],
    };
  }

  // ──────────────────────────────────────────
  // SCORE COMPUTATION
  // ──────────────────────────────────────────

  private computeStressScore(ctx: Record<string, unknown>): number {
    const calendarLoad = ctx.calendarLoad as number;
    const spendingStress = ctx.spendingStress as number;
    const sleepHours = ctx.sleepHours as number | null;

    const scheduleStress = Math.min(calendarLoad * 14, 100);
    const calendarMapped = Math.min(calendarLoad * 12, 100);
    const recovery = sleepHours != null ? clamp((sleepHours / 8) * 100) : 50;
    const inverseRecovery = 100 - recovery;

    return clamp(
      scheduleStress * 0.35 +
      spendingStress * 0.25 +
      calendarMapped * 0.25 +
      inverseRecovery * 0.15
    );
  }

  private computeEnergyScore(ctx: Record<string, unknown>): number {
    const sleepHours = ctx.sleepHours as number | null;
    const spotifyEnergy = ctx.spotifyEnergyAvg as number | null;
    const workoutCount = ctx.workoutCount as number;

    const sleepComponent = sleepHours != null ? clamp((sleepHours / 8) * 100) : 50;
    const spotifyComponent = spotifyEnergy != null ? spotifyEnergy * 100 : 50;
    const workoutComponent = workoutCount > 0 ? Math.min(workoutCount * 40, 100) : 20;
    const recovery = sleepComponent;

    return clamp(
      sleepComponent * 0.3 +
      spotifyComponent * 0.2 +
      workoutComponent * 0.25 +
      recovery * 0.25
    );
  }

  private computeMoodScore(ctx: Record<string, unknown>): number {
    const moodAvg = ctx.moodScore as number | null;
    const spotifyValence = ctx.spotifyValenceAvg as number | null;
    const prayerAdherence = ctx.prayerAdherence as number;
    const calendarLoad = ctx.calendarLoad as number;

    const moodComponent = moodAvg != null ? clamp(moodAvg * 10) : 50;
    const valenceComponent = spotifyValence != null ? spotifyValence * 100 : 50;
    const prayerEffect = clamp(prayerAdherence);
    const socialEngagement = clamp(Math.min(calendarLoad * 20, 100));

    return clamp(
      moodComponent * 0.35 +
      valenceComponent * 0.25 +
      prayerEffect * 0.15 +
      socialEngagement * 0.25
    );
  }

  private computeAvailabilityScore(ctx: Record<string, unknown>): number {
    const calendarLoad = ctx.calendarLoad as number;

    const awakeHours = 17;
    const busyHours = calendarLoad * 1.5;
    const freeHours = Math.max(0, awakeHours - busyHours);
    const freeHoursPct = clamp((freeHours / awakeHours) * 100);

    const freeWindows = Math.max(0, Math.floor(freeHours / 2));
    const windowScore = clamp(freeWindows * 20);

    return clamp(
      freeHoursPct * 0.6 +
      windowScore * 0.4
    );
  }

  private pickRecommendedMode(stress: number, energy: number): 'short' | 'normal' | 'deep' {
    if (stress > 70 || energy < 30) return 'short';
    if (stress < 30 && energy > 60) return 'deep';
    return 'normal';
  }

  private pickToneAdjustment(stress: number, energy: number, mood: number): 'supportive' | 'motivational' | 'direct' | 'celebratory' {
    if (stress > 70) return 'supportive';
    if (mood > 70) return 'celebratory';
    if (energy > 50 && stress < 30) return 'direct';
    return 'motivational';
  }

  // ──────────────────────────────────────────
  // UTILITY
  // ──────────────────────────────────────────

  private avgSpotifyField(signals: Array<{ value: Record<string, unknown> }>, field: string): number | null {
    const vals = signals
      .map(s => s.value[field])
      .filter((v): v is number => typeof v === 'number');

    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  private computeSpendingStress(signals: Array<{ value: Record<string, unknown> }>): number {
    if (signals.length === 0) return 0;

    const stressValues = signals
      .map(s => s.value.stress_score ?? s.value.spending_stress)
      .filter((v): v is number => typeof v === 'number');

    if (stressValues.length === 0) return clamp(signals.length * 15);

    return clamp(stressValues.reduce((a, b) => a + b, 0) / stressValues.length);
  }

  private computePrayerAdherence(signals: Array<{ value: Record<string, unknown> }>): number {
    if (signals.length === 0) return 0;

    const adherenceVals = signals
      .map(s => s.value.adherence ?? s.value.completion_pct)
      .filter((v): v is number => typeof v === 'number');

    if (adherenceVals.length === 0) {
      const totalPrayers = 5;
      return clamp((signals.length / totalPrayers) * 100);
    }

    return clamp(adherenceVals.reduce((a, b) => a + b, 0) / adherenceVals.length);
  }

  // ──────────────────────────────────────────
  // ROW MAPPING
  // ──────────────────────────────────────────

  private mapRow(row: Record<string, unknown>): DailyCorrelation {
    const parseJsonb = (v: unknown): unknown => {
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return v; }
      }
      return v;
    };

    return {
      id: row.id as string,
      userId: row.user_id as string,
      correlationDate: row.correlation_date as string,
      stressScore: row.stress_score as number,
      energyScore: row.energy_score as number,
      moodScore: row.mood_score as number,
      availabilityScore: row.availability_score as number,
      calendarLoad: (row.calendar_load as number) ?? 0,
      musicMood: (row.music_mood as string) ?? null,
      prayerAdherence: (row.prayer_adherence as number) ?? 0,
      spendingStress: (row.spending_stress as number) ?? 0,
      correlations: parseJsonb(row.correlations) as CorrelationRule[],
      recommendedMode: (row.recommended_mode as DailyCorrelation['recommendedMode']) ?? 'normal',
      toneAdjustment: (row.tone_adjustment as DailyCorrelation['toneAdjustment']) ?? 'motivational',
      signalsSummary: (parseJsonb(row.signals_summary) ?? {}) as Record<string, unknown>,
      computedAt: row.computed_at instanceof Date
        ? (row.computed_at as Date).toISOString()
        : row.computed_at as string,
    };
  }
}

export const crossDomainCorrelatorService = new CrossDomainCorrelatorService();
