/**
 * @file Plan Schedule Sync Service
 * @description Syncs active workout and diet plan entries into the daily schedule.
 *
 * After onboarding (or any plan creation), this service reads the user's active
 * workout_plans and diet_plans, determines what activities fall on a given date,
 * and upserts them as schedule_items with source='plan'. The upsert key
 * (schedule_id, external_source, external_id) prevents duplicates.
 *
 * IMPORTANT: This service does NOT import scheduleService to avoid circular
 * dependencies. Schedule creation/lookup is done via direct SQL when needed.
 *
 * Called from:
 *  1. autoCreateTodaySchedule  — when a new daily schedule is auto-created
 *  2. syncExternalSlots        — when the user opens their schedule page
 *  3. generateOnboardingPlans  — immediately after onboarding plan creation
 */

import { createHash } from 'node:crypto';
import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { notificationEngine } from './notification-engine.service.js';

// ============================================
// TYPES
// ============================================

interface ActiveWorkoutPlan {
  id: string;
  name: string;
  weekly_schedule: Record<string, WorkoutDay | null> | null;
  schedule_days: string[] | null;
  start_date: string;
}

interface WorkoutDay {
  dayOfWeek: string;
  workoutName: string;
  focusArea: string;
  exercises: Array<{ name: string; sets: number; reps: number }>;
  estimatedDuration: number;
  scheduledTime?: string;
  isRestDay?: boolean;
}

interface ActiveDietPlan {
  id: string;
  name: string;
  daily_calories: number;
  meal_times: Record<string, string> | null;
  meals_per_day: number;
  snacks_per_day: number;
}

interface PlanItemCandidate {
  scheduleId: string;
  externalSource: string;
  externalId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  color: string;
  category: string;
  metadata: Record<string, unknown>;
}

interface SyncResult {
  workoutItems: number;
  mealItems: number;
  conflictsPending: number;
  scheduleId: string;
}

// ============================================
// CONSTANTS
// ============================================

const WORKOUT_COLOR = '#6d4bc3';
const MEAL_COLORS: Record<string, string> = {
  breakfast: '#f59e0b',
  lunch: '#c98111',
  dinner: '#b45309',
  snack: '#d97706',
};
const DEFAULT_MEAL_COLOR = '#c98111';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DEFAULT_MEAL_TIMES: Record<string, string> = {
  breakfast: '08:00',
  lunch: '12:30',
  dinner: '19:00',
  snack: '15:00',
};

const DEFAULT_MEAL_DURATIONS: Record<string, number> = {
  breakfast: 30,
  lunch: 30,
  dinner: 30,
  snack: 15,
};

// ============================================
// SERVICE
// ============================================

class PlanScheduleSyncService {
  /**
   * Sync plan items into an existing schedule (called from syncExternalSlots / autoCreateTodaySchedule).
   * The caller already has the scheduleId — no schedule creation needed.
   */
  async syncToExistingSchedule(userId: string, scheduleId: string, date: string): Promise<{ workoutItems: number; mealItems: number; conflictsPending: number }> {
    const [workoutCandidates, mealCandidates] = await Promise.all([
      this.buildWorkoutCandidates(userId, scheduleId, date),
      this.buildMealCandidates(userId, scheduleId, date),
    ]);

    const allCandidates = [...workoutCandidates, ...mealCandidates];
    let workoutItems = 0;
    let mealItems = 0;
    let conflictsPending = 0;

    for (const candidate of allCandidates) {
      const alreadyExists = await this.planItemExists(scheduleId, candidate.externalSource, candidate.externalId);
      if (alreadyExists) {
        await this.upsertPlanItem(candidate);
        if (candidate.category === 'exercise') workoutItems++;
        else mealItems++;
        continue;
      }

      const conflictingItems = await this.findConflictingItems(scheduleId, candidate.startTime, candidate.endTime);
      if (conflictingItems.length > 0) {
        await this.createPlanConflictNotification(userId, scheduleId, date, candidate, conflictingItems[0]);
        conflictsPending++;
      } else {
        await this.upsertPlanItem(candidate);
        if (candidate.category === 'exercise') workoutItems++;
        else mealItems++;
      }
    }

    if (workoutItems > 0 || mealItems > 0 || conflictsPending > 0) {
      logger.info('[PlanScheduleSync] Synced plan items to schedule', {
        userId, date, scheduleId, workoutItems, mealItems, conflictsPending,
      });
    }

    return { workoutItems, mealItems, conflictsPending };
  }

  /**
   * Sync plans into a user's daily schedule, creating the schedule if needed.
   * Used by post-onboarding hooks where no schedule may exist yet.
   * Uses direct SQL to avoid circular dependency with scheduleService.
   */
  async syncPlansToSchedule(userId: string, date: string): Promise<SyncResult> {
    try {
      const scheduleId = await this.ensureScheduleExists(userId, date);

      const { workoutItems, mealItems, conflictsPending } = await this.syncToExistingSchedule(userId, scheduleId, date);

      return { workoutItems, mealItems, conflictsPending, scheduleId };
    } catch (error) {
      logger.error('[PlanScheduleSync] Failed to sync plans to schedule', {
        userId,
        date,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Ensure a daily_schedules row exists for (userId, date). Returns its id.
   * Uses INSERT ... ON CONFLICT to be safe for concurrent calls.
   */
  private async ensureScheduleExists(userId: string, date: string): Promise<string> {
    // Try to find existing
    const existing = await query<{ id: string }>(
      `SELECT id FROM daily_schedules
       WHERE user_id = $1 AND schedule_date = $2 AND is_template = false
       LIMIT 1`,
      [userId, date],
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    // Create new schedule
    const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const result = await query<{ id: string }>(
      `INSERT INTO daily_schedules (user_id, schedule_date, name, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, schedule_date) WHERE is_template = false
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [userId, date, `Daily Schedule - ${label}`, 'Auto-created from your health plans'],
    );

    return result.rows[0].id;
  }

  // ============================================
  // WORKOUT SYNC
  // ============================================

  private async buildWorkoutCandidates(userId: string, scheduleId: string, date: string): Promise<PlanItemCandidate[]> {
    const plan = await this.getActiveWorkoutPlan(userId);
    if (!plan?.weekly_schedule) return [];

    const dayOfWeek = this.getDayOfWeek(date);
    const workout = plan.weekly_schedule[dayOfWeek];

    if (!workout || workout.isRestDay) return [];

    const startTime = workout.scheduledTime || '07:00';
    const duration = workout.estimatedDuration || 60;
    const endTime = this.addMinutes(startTime, duration);

    const exerciseSummary = workout.exercises
      ?.slice(0, 3)
      .map((e) => e.name)
      .join(', ');
    const description = exerciseSummary
      ? `${workout.focusArea} — ${exerciseSummary}${workout.exercises.length > 3 ? '...' : ''}`
      : workout.focusArea || workout.workoutName;

    return [{
      scheduleId,
      externalSource: 'workout_plan',
      externalId: `${plan.id}:${dayOfWeek}`,
      title: workout.workoutName || `${workout.focusArea} Workout`,
      description,
      startTime,
      endTime,
      durationMinutes: duration,
      color: WORKOUT_COLOR,
      category: 'exercise',
      metadata: {
        planId: plan.id,
        planName: plan.name,
        dayOfWeek,
        exerciseCount: workout.exercises?.length || 0,
        estimatedCalories: (workout as any).estimatedCalories,
      },
    }];
  }

  // ============================================
  // MEAL SYNC
  // ============================================

  private async buildMealCandidates(userId: string, scheduleId: string, _date: string): Promise<PlanItemCandidate[]> {
    const plan = await this.getActiveDietPlan(userId);
    if (!plan?.meal_times) return [];

    const candidates: PlanItemCandidate[] = [];

    const mealEntries: Array<{ key: string; label: string; time: string; caloriePct: number }> = [
      { key: 'breakfast', label: 'Breakfast', time: plan.meal_times.breakfast || DEFAULT_MEAL_TIMES.breakfast, caloriePct: 0.25 },
      { key: 'lunch', label: 'Lunch', time: plan.meal_times.lunch || DEFAULT_MEAL_TIMES.lunch, caloriePct: 0.35 },
      { key: 'dinner', label: 'Dinner', time: plan.meal_times.dinner || DEFAULT_MEAL_TIMES.dinner, caloriePct: 0.30 },
    ];

    if (plan.snacks_per_day > 0) {
      mealEntries.push({
        key: 'snack',
        label: `Snack${plan.snacks_per_day > 1 ? 's' : ''}`,
        time: plan.meal_times.snack || DEFAULT_MEAL_TIMES.snack,
        caloriePct: 0.10,
      });
    }

    for (const meal of mealEntries) {
      const duration = DEFAULT_MEAL_DURATIONS[meal.key] || 30;
      const endTime = this.addMinutes(meal.time, duration);
      const targetCal = Math.round(plan.daily_calories * meal.caloriePct);

      candidates.push({
        scheduleId,
        externalSource: 'diet_plan',
        externalId: `${plan.id}:${meal.key}`,
        title: meal.label,
        description: `~${targetCal} cal target`,
        startTime: meal.time,
        endTime,
        durationMinutes: duration,
        color: MEAL_COLORS[meal.key] || DEFAULT_MEAL_COLOR,
        category: 'meal',
        metadata: {
          planId: plan.id,
          planName: plan.name,
          mealType: meal.key,
          targetCalories: targetCal,
        },
      });
    }

    return candidates;
  }

  // ============================================
  // DATABASE HELPERS
  // ============================================

  private async getActiveWorkoutPlan(userId: string): Promise<ActiveWorkoutPlan | null> {
    try {
      const result = await query<ActiveWorkoutPlan>(
        `SELECT id, name, weekly_schedule, schedule_days, start_date::text
         FROM workout_plans
         WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );
      return result.rows[0] || null;
    } catch (err: any) {
      if (err?.code === '42703') {
        logger.warn('[PlanScheduleSync] Migration columns missing, using fallback query');
        const result = await query<Omit<ActiveWorkoutPlan, 'schedule_days'>>(
          `SELECT id, name, weekly_schedule, start_date::text
           FROM workout_plans
           WHERE user_id = $1 AND status = 'active'
           ORDER BY created_at DESC LIMIT 1`,
          [userId],
        );
        if (result.rows.length === 0) return null;
        return { ...result.rows[0], schedule_days: null };
      }
      throw err;
    }
  }

  private async getActiveDietPlan(userId: string): Promise<ActiveDietPlan | null> {
    const result = await query<ActiveDietPlan>(
      `SELECT id, name, daily_calories, meal_times, meals_per_day, snacks_per_day
       FROM diet_plans
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    return result.rows[0] || null;
  }

  /**
   * Upsert a plan-sourced schedule item. Uses the same ON CONFLICT pattern
   * as Google Calendar / prayer sync so duplicates are impossible.
   */
  private async upsertPlanItem(args: {
    scheduleId: string;
    externalSource: string;
    externalId: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    color: string;
    category: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await query(
      `INSERT INTO schedule_items (
         schedule_id, title, description, start_time, end_time,
         duration_minutes, color, icon, category, shape, position, metadata,
         source, external_source, external_id, source_updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, 'rounded', 0, $9::jsonb,
               'plan', $10, $11, NOW())
       ON CONFLICT (schedule_id, external_source, external_id)
       WHERE external_source IS NOT NULL AND external_id IS NOT NULL
       DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         duration_minutes = EXCLUDED.duration_minutes,
         color = EXCLUDED.color,
         category = EXCLUDED.category,
         metadata = EXCLUDED.metadata,
         source_updated_at = NOW(),
         updated_at = CURRENT_TIMESTAMP`,
      [
        args.scheduleId,
        args.title,
        args.description,
        args.startTime,
        args.endTime,
        args.durationMinutes,
        args.color,
        args.category,
        JSON.stringify(args.metadata),
        args.externalSource,
        args.externalId,
      ],
    );
  }

  // ============================================
  // CONFLICT DETECTION
  // ============================================

  private async planItemExists(scheduleId: string, externalSource: string, externalId: string): Promise<boolean> {
    const result = await query<{ id: string }>(
      `SELECT id FROM schedule_items
       WHERE schedule_id = $1 AND external_source = $2 AND external_id = $3
       LIMIT 1`,
      [scheduleId, externalSource, externalId],
    );
    return result.rows.length > 0;
  }

  private async findConflictingItems(
    scheduleId: string,
    startTime: string,
    endTime: string,
  ): Promise<Array<{ id: string; title: string; startTime: string; endTime: string | null; source: string }>> {
    const result = await query<{
      id: string;
      title: string;
      start_time: string;
      end_time: string | null;
      duration_minutes: number | null;
      source: string;
    }>(
      `SELECT id, title,
              TO_CHAR(start_time, 'HH24:MI') AS start_time,
              TO_CHAR(end_time,   'HH24:MI') AS end_time,
              duration_minutes, source
       FROM schedule_items
       WHERE schedule_id = $1 AND source IN ('manual', 'google')`,
      [scheduleId],
    );

    const toMin = (hhmm: string): number => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };

    const pStart = toMin(startTime);
    const pEnd = toMin(endTime);
    if (pEnd <= pStart) return [];

    return result.rows
      .filter((item) => {
        const iStart = toMin(item.start_time);
        let iEnd: number;
        if (item.end_time) {
          iEnd = toMin(item.end_time);
        } else if (item.duration_minutes) {
          iEnd = iStart + item.duration_minutes;
        } else {
          iEnd = iStart + 30;
        }
        if (iEnd <= iStart) return false;
        return pStart < iEnd && pEnd > iStart;
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        startTime: item.start_time,
        endTime: item.end_time,
        source: item.source,
      }));
  }

  private async createPlanConflictNotification(
    userId: string,
    scheduleId: string,
    date: string,
    candidate: PlanItemCandidate,
    existingItem: { id: string; title: string; startTime: string; endTime: string | null; source: string },
  ): Promise<void> {
    const conflictSeed = `plan-conflict:${candidate.externalSource}:${candidate.externalId}:${existingItem.id}`;
    const conflictUuid = this.deterministicUuid(conflictSeed);

    const existing = await query<{ id: string }>(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND related_entity_id = $2 AND is_read = false
       LIMIT 1`,
      [userId, conflictUuid],
    );
    if (existing.rows.length > 0) return;

    await notificationEngine.send({
      userId,
      type: 'warning',
      title: 'Plan Schedule Conflict',
      message: `"${candidate.title}" (${candidate.startTime}-${candidate.endTime}) conflicts with "${existingItem.title}" (${existingItem.startTime}-${existingItem.endTime || '?'}) on ${date}.`,
      icon: '⚠️',
      actionUrl: `/schedule?conflict=true&date=${date}`,
      actionLabel: 'Resolve Conflict',
      category: 'schedule_conflict',
      priority: 'high',
      relatedEntityType: 'plan_conflict',
      relatedEntityId: conflictUuid,
      metadata: {
        date,
        scheduleId,
        conflictSource: 'plan',
        planItem: {
          title: candidate.title,
          description: candidate.description,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          durationMinutes: candidate.durationMinutes,
          color: candidate.color,
          category: candidate.category,
          externalSource: candidate.externalSource,
          externalId: candidate.externalId,
          metadata: candidate.metadata,
        },
        existingItem: {
          id: existingItem.id,
          title: existingItem.title,
          startTime: existingItem.startTime,
          endTime: existingItem.endTime,
          source: existingItem.source,
        },
      },
    });

    logger.info('[PlanScheduleSync] Conflict notification created', {
      userId, date, planItem: candidate.title, existingItem: existingItem.title,
    });
  }

  /**
   * Upsert a plan item that was approved via conflict resolution.
   * Called from scheduleService.resolveConflict().
   */
  async upsertApprovedPlanItem(scheduleId: string, planItem: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    color: string;
    category: string;
    externalSource: string;
    externalId: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.upsertPlanItem({
      scheduleId,
      ...planItem,
    });
  }

  private deterministicUuid(seed: string): string {
    const hex = createHash('md5').update(seed).digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // ============================================
  // UTILITY
  // ============================================

  private getDayOfWeek(date: string): string {
    return DAY_NAMES[new Date(date + 'T12:00:00').getDay()];
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const planScheduleSyncService = new PlanScheduleSyncService();
