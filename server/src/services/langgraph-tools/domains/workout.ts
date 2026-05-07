import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import { workoutPlanService } from '../../workout-plan.service.js';
import { taskService } from '../../task.service.js';
import { workoutAlarmService } from '../../workout-alarm.service.js';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';
import { logger } from '../../logger.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];

// --- Schemas ---

const GetUserWorkoutPlansSchema = z.object({
  status: z.string().optional().describe('Filter by status: active, completed, paused, archived'),
});

const GetUserWorkoutLogsSchema = z.object({
  planId: z.string().optional().describe('Filter by workout plan ID'),
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of logs to return (default: 20)'),
});

const GetUserTasksSchema = z.object({
  status: z.string().optional().describe('Filter by status: pending, in_progress, completed, cancelled'),
  category: z.string().optional().describe('Filter by category: health, fitness, nutrition, work, personal, general'),
  fromDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  toDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
});

const CheckWorkoutProgressSchema = z.object({
  workoutPlanId: z.string().optional().describe('Specific workout plan ID to check (optional)'),
});

const RescheduleWorkoutTasksSchema = z.object({
  workoutPlanId: z.string().describe('Workout plan ID to reschedule tasks for'),
  policy: z.enum(['SLIDE_FORWARD', 'FILL_GAPS', 'DROP_OR_COMPRESS']).optional().describe('Rescheduling policy (default: FILL_GAPS)'),
});

const CreateWorkoutPlanSchema = z.object({
  name: z.string().describe('Workout plan name (required)'),
  description: z.string().optional().describe('Plan description'),
  goalCategory: z.string().optional().describe('Goal category: weight_loss, muscle_building, etc.'),
  fitnessLevel: z.string().optional().describe('Fitness level: beginner, intermediate, advanced'),
  durationWeeks: z.number().optional().describe('Plan duration in weeks'),
  workoutsPerWeek: z.number().optional().describe('Number of workouts per week'),
  availableEquipment: z.array(z.string()).optional().describe('Available equipment list'),
  workoutLocation: z.string().optional().describe('Location: gym, home, outdoor'),
  weeklySchedule: z.record(z.any()).optional().describe('Weekly schedule (optional for simple plans)'),
  isActive: z.boolean().optional().describe('Set as active plan'),
});

const UpdateWorkoutPlanSchema = z.object({
  planId: z.string().describe('Workout plan ID (required)'),
  name: z.string().optional(),
  description: z.string().optional(),
  goalCategory: z.string().optional(),
  fitnessLevel: z.string().optional(),
  durationWeeks: z.number().optional(),
  workoutsPerWeek: z.number().optional(),
  availableEquipment: z.array(z.string()).optional(),
  workoutLocation: z.string().optional(),
  weeklySchedule: z.record(z.any()).optional(),
  status: z.string().optional(),
});

const DeleteWorkoutPlanSchema = z.object({
  planId: z.string().describe('Workout plan ID to delete (required)'),
});

const CreateWorkoutAlarmSchema = z.object({
  workoutPlanId: z.string().optional().describe('Associated workout plan ID'),
  title: z.string().optional().describe('Alarm title'),
  message: z.string().optional().describe('Alarm message'),
  alarmTime: z.string().describe('Alarm time in HH:MM format (required)'),
  daysOfWeek: z.array(z.number()).optional().describe('Days of week (0=Sun, 1=Mon, ..., 6=Sat)'),
  notificationType: z.string().optional().describe('Notification type: push, email, sms, all'),
  soundEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
  snoozeMinutes: z.number().optional(),
});

const UpdateWorkoutAlarmSchema = z.object({
  alarmId: z.string().describe('Alarm ID (required)'),
  title: z.string().optional(),
  message: z.string().optional(),
  alarmTime: z.string().optional(),
  daysOfWeek: z.array(z.number()).optional(),
  isEnabled: z.boolean().optional(),
  notificationType: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
  snoozeMinutes: z.number().optional(),
});

const DeleteWorkoutAlarmSchema = z.object({
  alarmId: z.string().describe('Alarm ID to delete (required)'),
});

const GetAllAlarmsSchema = z.object({
  enabledOnly: z.boolean().optional().describe('If true, only return enabled/active alarms'),
});

const GetAlarmByIdSchema = z.object({
  alarmId: z.string().describe('Alarm ID to retrieve (required)'),
});

const GetAlarmsByDaySchema = z.object({
  dayOfWeek: z.number().describe('Day of week (0=Sunday, 1=Monday, ..., 6=Saturday). Required.'),
});

const GetTodayAlarmsSchema = z.object({});

const GetAlarmSummarySchema = z.object({});

const ToggleAlarmSchema = z.object({
  alarmId: z.string().describe('Alarm ID to toggle (required)'),
});

const SnoozeAlarmSchema = z.object({
  alarmId: z.string().describe('Alarm ID to snooze (required)'),
  minutes: z.number().optional().describe('Snooze duration in minutes (default: alarm snooze setting or 10)'),
});

const CreateWorkoutLogSchema = z.object({
  workoutPlanId: z.string().optional().describe('Associated workout plan ID'),
  scheduledDate: z.string().describe('Scheduled date in ISO format (YYYY-MM-DD) (required)'),
  scheduledDayOfWeek: z.string().optional().describe('Day of week: sunday, monday, etc.'),
  workoutName: z.string().optional().describe('Workout name'),
  startedAt: z.string().optional().describe('Start timestamp'),
  completedAt: z.string().optional().describe('Completion timestamp'),
  durationMinutes: z.number().optional().describe('Duration in minutes'),
  status: z.string().optional().describe('Status: pending, in_progress, completed, skipped'),
  exercisesCompleted: z.array(z.any()).optional().describe('Exercises completed JSON array'),
  difficultyRating: z.number().optional().describe('Difficulty rating 1-5'),
  energyLevel: z.number().optional().describe('Energy level 1-5'),
  moodAfter: z.number().optional().describe('Mood after workout 1-5'),
  notes: z.string().optional().describe('Notes'),
});

const UpdateWorkoutLogSchema = z.object({
  logId: z.string().describe('Workout log ID (required)'),
  status: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  durationMinutes: z.number().optional(),
  exercisesCompleted: z.array(z.any()).optional(),
  difficultyRating: z.number().optional(),
  energyLevel: z.number().optional(),
  moodAfter: z.number().optional(),
  notes: z.string().optional(),
});

const GetWorkoutLogByIdSchema = z.object({
  logId: z.string().describe('Workout log ID to retrieve (required)'),
});

const GetWorkoutLogByDateSchema = z.object({
  date: z.string().describe('Date in ISO format (YYYY-MM-DD) (required)'),
});

const DeleteWorkoutLogSchema = z.object({
  logId: z.string().describe('Workout log ID to delete (required)'),
});

const DeleteAllWorkoutLogsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  planId: z.string().optional().describe('Filter by workout plan ID'),
  startDate: z.string().optional().describe('Delete logs from this date'),
  endDate: z.string().optional().describe('Delete logs up to this date'),
});

const UpdateAllWorkoutLogsSchema = z.object({
  updates: z.object({
    status: z.string().optional(),
    difficultyRating: z.number().optional(),
    energyLevel: z.number().optional(),
    moodAfter: z.number().optional(),
  }),
  filter: z.object({
    planId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
});

// --- Implementations ---

async function getUserWorkoutPlans(userId: string, params?: { status?: string }): Promise<string> {
  const plans = await workoutPlanService.getUserPlans(userId, params?.status);

  if (plans.length === 0) {
    return JSON.stringify({ message: 'No workout plans found', plans: [] });
  }

  const formatted = plans.map(plan => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    goalCategory: plan.goalCategory,
    status: plan.status,
    difficulty: plan.initialDifficultyLevel,
    workoutsPerWeek: plan.workoutsPerWeek,
    durationWeeks: plan.durationWeeks,
    progress: `${Math.round((plan.overallCompletionRate || 0) * 100)}%`,
    workoutsCompleted: plan.totalWorkoutsCompleted || 0,
    createdAt: plan.createdAt,
  }));

  return JSON.stringify({ plans: formatted, count: formatted.length }, null, 2);
}

function buildWorkoutCharts(
  logs: { workoutName?: string; scheduledDate: string; durationMinutes?: number; difficultyRating?: number; energyLevel?: number; status: string }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (logs.length === 0) return artifacts;

  const recentLogs = logs.slice(0, 15).reverse();
  artifacts.push({
    type: 'chart',
    chartType: 'bar',
    title: 'Workout Duration',
    data: recentLogs.map((log) => ({
      date: log.scheduledDate?.slice(0, 10) || 'N/A',
      duration: log.durationMinutes || 0,
    })),
    xAxisKey: 'date',
    dataKeys: [{ key: 'duration', label: 'Minutes', color: '#3b82f6' }],
    yAxisLabel: 'Minutes',
    insight: `Average duration: ${Math.round(recentLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0) / recentLogs.length)} min.`,
  });

  const withRatings = recentLogs.filter((l) => l.difficultyRating || l.energyLevel);
  if (withRatings.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Difficulty & Energy Trends',
      data: withRatings.map((log) => ({
        date: log.scheduledDate?.slice(0, 10) || 'N/A',
        difficulty: log.difficultyRating || 0,
        energy: log.energyLevel || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [
        { key: 'difficulty', label: 'Difficulty', color: '#ef4444' },
        { key: 'energy', label: 'Energy', color: '#10b981' },
      ],
      yAxisLabel: 'Rating (1-5)',
    });
  }

  const statusCounts: Record<string, number> = {};
  for (const log of logs) {
    const s = log.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  artifacts.push({
    type: 'chart',
    chartType: 'pie',
    title: 'Workout Completion Status',
    data: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    xAxisKey: 'name',
    dataKeys: Object.entries(statusCounts).map(([name], i) => ({
      key: 'value',
      label: name,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    insight: `${statusCounts['completed'] || 0} completed out of ${logs.length} total workouts.`,
  });

  return artifacts;
}

/**
 * Get user's workout logs
 */
async function getUserWorkoutLogs(userId: string, params?: {
  planId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<string> {
  const result = await workoutPlanService.getWorkoutLogs(userId, {
    planId: params?.planId,
    startDate: params?.startDate,
    endDate: params?.endDate,
    limit: params?.limit || 20,
  });

  if (result.logs.length === 0) {
    return JSON.stringify({ message: 'No workout logs found', logs: [] });
  }

  const formatted = result.logs.map(log => ({
    id: log.id,
    workoutName: log.workoutName,
    scheduledDate: log.scheduledDate,
    durationMinutes: log.durationMinutes,
    exercisesCompleted: log.exercisesCompleted.length,
    difficultyRating: log.difficultyRating,
    energyLevel: log.energyLevel,
    status: log.status,
  }));

  const artifacts = buildWorkoutCharts(formatted);
  return JSON.stringify({ logs: formatted, total: result.total, artifacts }, null, 2);
}

/**
 * Get user's tasks
 */
async function getUserTasks(userId: string, params?: {
  status?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<string> {
  const result = await taskService.getTasks(userId, {
    status: params?.status as any,
    category: params?.category as any,
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    limit: 50,
  });

  if (result.tasks.length === 0) {
    return JSON.stringify({ message: 'No tasks found', tasks: [] });
  }

  const formatted = result.tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    scheduledAt: task.scheduledAt,
    completedAt: task.completedAt,
  }));

  return JSON.stringify({ tasks: formatted, total: result.total }, null, 2);
}

/**
 * Create a workout plan
 */
async function createWorkoutPlan(userId: string, params: z.infer<typeof CreateWorkoutPlanSchema>): Promise<string> {
  const warnings: string[] = [];

  if (!params.name?.trim()) {
    return JSON.stringify({ success: false, error: 'Workout plan name is required' });
  }

  // Valid goal categories from enum
  const validCategories = ['weight_loss', 'muscle_building', 'sleep_improvement', 'stress_wellness', 'energy_productivity', 'event_training', 'health_condition', 'habit_building', 'overall_optimization', 'nutrition', 'fitness', 'custom'];

  let goalCategory = params.goalCategory || 'overall_optimization';
  // Validate and correct invalid goal category
  if (!validCategories.includes(goalCategory)) {
    warnings.push(`Invalid goal category '${goalCategory}', using 'overall_optimization'`);
    goalCategory = 'overall_optimization';
  }

  const fitnessLevel = params.fitnessLevel || 'beginner';
  const durationWeeks = params.durationWeeks || 4;
  const workoutsPerWeek = params.workoutsPerWeek || 3;
  const availableEquipment = params.availableEquipment || ['bodyweight'];
  const workoutLocation = params.workoutLocation || 'home';
  let weeklySchedule = params.weeklySchedule || {};

  // Check if exercises are missing from the schedule
  // A schedule has exercises if it has at least one day with exercises array containing items
  const hasExercises = weeklySchedule &&
    Object.keys(weeklySchedule).length > 0 &&
    Object.values(weeklySchedule).some((day: any) => {
      if (!day || typeof day !== 'object') return false;
      // Check for exercises array with at least one exercise
      if (Array.isArray(day.exercises) && day.exercises.length > 0) {
        // Verify exercises have required fields (exerciseId or name)
        return day.exercises.some((ex: any) =>
          (ex && typeof ex === 'object' && (ex.exerciseId || ex.name || ex.exercise_id))
        );
      }
      return false;
    });

  // If no exercises provided, automatically generate them using workout-plan service
  if (!hasExercises) {
    logger.info('[LangGraphTools] No exercises in weeklySchedule, generating automatically', {
      userId,
      workoutsPerWeek,
      goalCategory,
      fitnessLevel,
    });

    try {
      // Use workout-plan service to generate a plan with exercises
      const generatedPlan = await workoutPlanService.generatePlan({
        userId,
        goalCategory,
        fitnessLevel: fitnessLevel as 'beginner' | 'intermediate' | 'advanced',
        durationWeeks,
        workoutsPerWeek,
        availableEquipment,
        workoutLocation: workoutLocation as 'gym' | 'home' | 'outdoor',
        timePerWorkout: 45, // Default 45 minutes
      });

      // Use the generated schedule which includes exercises
      weeklySchedule = generatedPlan.weeklySchedule || {};

      const scheduleDays = Object.keys(weeklySchedule).length;
      const totalExercises = Object.values(weeklySchedule).reduce((acc: number, day: any) => {
        if (day?.exercises && Array.isArray(day.exercises)) return acc + day.exercises.length;
        return acc;
      }, 0);

      logger.info('[LangGraphTools] Generated exercises for workout plan', {
        userId,
        scheduleDays,
        totalExercises,
      });
    } catch (error) {
      logger.warn('[LangGraphTools] Failed to auto-generate exercises, using provided schedule', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue with the provided schedule (might be empty, but that's better than failing)
    }
  }


  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationWeeks * 7);

  // If setting as active, deactivate other plans
  if (params.isActive) {
    await query(
      `UPDATE workout_plans SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
  }

  // Serialize weeklySchedule - ensure exercises are properly included
  const scheduleJson = JSON.stringify(weeklySchedule);


  const result = await query<{ id: string; weekly_schedule: any }>(
    `INSERT INTO workout_plans (
      user_id, name, description, goal_category,
      initial_difficulty_level, duration_weeks, workouts_per_week,
      weekly_schedule, available_equipment, workout_location,
      start_date, end_date, status, ai_generated
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::text[], $10, $11, $12, $13, $14)
    RETURNING id, weekly_schedule`,
    [
      userId,
      params.name.trim(),
      params.description || null,
      goalCategory,
      fitnessLevel,
      durationWeeks,
      workoutsPerWeek,
      scheduleJson, // Pass as JSON string, cast to jsonb in SQL
      availableEquipment,
      workoutLocation,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      params.isActive ? 'active' : 'draft',
      true,
    ]
  );

  const planId = result.rows[0].id;

  // Enqueue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'workout_plan',
    sourceId: planId,
    operation: 'create',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Workout plan created successfully',
    data: { id: planId, name: params.name },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

/**
 * Update workout plan
 */
async function updateWorkoutPlan(userId: string, params: z.infer<typeof UpdateWorkoutPlanSchema>): Promise<string> {
  const warnings: string[] = [];

  // Verify ownership
  const existing = await query(
    `SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Workout plan not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    goalCategory: 'goal_category',
    fitnessLevel: 'initial_difficulty_level',
    durationWeeks: 'duration_weeks',
    workoutsPerWeek: 'workouts_per_week',
    weeklySchedule: 'weekly_schedule',
    availableEquipment: 'available_equipment',
    workoutLocation: 'workout_location',
    status: 'status',
  };

  const setClauses: string[] = [];
  const values: (string | number | boolean | null | object)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'planId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      if (dbField === 'weekly_schedule') {
        values.push(JSON.stringify(value));
      } else if (dbField === 'available_equipment') {
        values.push(value as string[]);
      } else {
        values.push(value as string | number | boolean | null);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  // If setting as active, deactivate other plans
  if (params.status === 'active') {
    await query(
      `UPDATE workout_plans SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id != $2 AND status = 'active'`,
      [userId, params.planId]
    );
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE workout_plans SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.planId, userId]
  );

  // Enqueue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'workout_plan',
    sourceId: params.planId,
    operation: 'update',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Workout plan updated successfully',
    data: { id: params.planId },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

/**
 * Delete workout plan
 */
async function deleteWorkoutPlan(userId: string, params: z.infer<typeof DeleteWorkoutPlanSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM workout_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Workout plan not found or access denied' });
  }

  // Enqueue embedding deletion BEFORE actual deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'workout_plan',
    sourceId: params.planId,
    operation: 'delete',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding deletion', { error: err });
  });

  await query(
    `DELETE FROM workout_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Workout plan deleted successfully',
  });
}

/**
 * Create workout alarm
 */
async function createWorkoutAlarm(userId: string, params: z.infer<typeof CreateWorkoutAlarmSchema>): Promise<string> {
  const warnings: string[] = [];

  if (!params.alarmTime) {
    return JSON.stringify({ success: false, error: 'Alarm time is required' });
  }

  // Validate workout plan if provided
  if (params.workoutPlanId) {
    const planCheck = await query(
      `SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2`,
      [params.workoutPlanId, userId]
    );
    if (planCheck.rows.length === 0) {
      warnings.push(`Workout plan ${params.workoutPlanId} not found, creating alarm without plan reference`);
    }
  }

  const alarm = await workoutAlarmService.createAlarm(userId, {
    workoutPlanId: params.workoutPlanId,
    title: params.title,
    message: params.message,
    alarmTime: params.alarmTime,
    daysOfWeek: params.daysOfWeek,
    notificationType: params.notificationType as any,
    soundEnabled: params.soundEnabled,
    vibrationEnabled: params.vibrationEnabled,
    snoozeMinutes: params.snoozeMinutes,
  });

  return JSON.stringify({
    success: true,
    message: 'Workout alarm created successfully',
    data: { id: alarm.id, title: alarm.title, alarmTime: alarm.alarmTime },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

/**
 * Update workout alarm
 */
async function updateWorkoutAlarm(userId: string, params: z.infer<typeof UpdateWorkoutAlarmSchema>): Promise<string> {
  const alarm = await workoutAlarmService.updateAlarm(userId, params.alarmId, {
    title: params.title,
    message: params.message,
    alarmTime: params.alarmTime,
    daysOfWeek: params.daysOfWeek,
    isEnabled: params.isEnabled,
    notificationType: params.notificationType as any,
    soundEnabled: params.soundEnabled,
    vibrationEnabled: params.vibrationEnabled,
    snoozeMinutes: params.snoozeMinutes,
  });

  if (!alarm) {
    return JSON.stringify({ success: false, error: 'Workout alarm not found or access denied' });
  }

  return JSON.stringify({
    success: true,
    message: 'Workout alarm updated successfully',
    data: { id: alarm.id, title: alarm.title },
  });
}

/**
 * Delete workout alarm
 */
async function deleteWorkoutAlarm(userId: string, params: z.infer<typeof DeleteWorkoutAlarmSchema>): Promise<string> {
  const deleted = await workoutAlarmService.deleteAlarm(userId, params.alarmId);

  if (!deleted) {
    return JSON.stringify({ success: false, error: 'Workout alarm not found or access denied' });
  }

  return JSON.stringify({
    success: true,
    message: 'Workout alarm deleted successfully',
  });
}

async function getAllAlarms(userId: string, params: z.infer<typeof GetAllAlarmsSchema>): Promise<string> {
  const alarms = params.enabledOnly
    ? await workoutAlarmService.getEnabledAlarms(userId)
    : await workoutAlarmService.getAlarms(userId);

  if (alarms.length === 0) {
    return JSON.stringify({ message: 'No alarms found', alarms: [], count: 0 });
  }

  const formatted = alarms.map(a => ({
    id: a.id,
    title: a.title,
    message: a.message,
    alarmTime: a.alarmTime,
    daysOfWeek: a.daysOfWeek,
    daysFormatted: workoutAlarmService.formatDaysOfWeek(a.daysOfWeek, true),
    isEnabled: a.isEnabled,
    soundFile: a.soundFile,
    soundEnabled: a.soundEnabled,
    vibrationEnabled: a.vibrationEnabled,
    snoozeMinutes: a.snoozeMinutes,
    notificationType: a.notificationType,
    nextTriggerAt: a.nextTriggerAt,
    workoutPlanId: a.workoutPlanId,
  }));

  return JSON.stringify({ alarms: formatted, count: formatted.length }, null, 2);
}

async function getAlarmById(userId: string, params: z.infer<typeof GetAlarmByIdSchema>): Promise<string> {
  const alarm = await workoutAlarmService.getAlarm(userId, params.alarmId);

  if (!alarm) {
    return JSON.stringify({ success: false, error: 'Alarm not found or access denied' });
  }

  return JSON.stringify({
    success: true,
    alarm: {
      id: alarm.id,
      title: alarm.title,
      message: alarm.message,
      alarmTime: alarm.alarmTime,
      daysOfWeek: alarm.daysOfWeek,
      daysFormatted: workoutAlarmService.formatDaysOfWeek(alarm.daysOfWeek, true),
      isEnabled: alarm.isEnabled,
      soundFile: alarm.soundFile,
      soundEnabled: alarm.soundEnabled,
      vibrationEnabled: alarm.vibrationEnabled,
      snoozeMinutes: alarm.snoozeMinutes,
      notificationType: alarm.notificationType,
      nextTriggerAt: alarm.nextTriggerAt,
      lastTriggeredAt: alarm.lastTriggeredAt,
      workoutPlanId: alarm.workoutPlanId,
      createdAt: alarm.createdAt,
    },
  }, null, 2);
}

async function getAlarmsByDay(userId: string, params: z.infer<typeof GetAlarmsByDaySchema>): Promise<string> {
  const allAlarms = await workoutAlarmService.getAlarms(userId);
  const filtered = allAlarms.filter(a => a.daysOfWeek.includes(params.dayOfWeek));

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[params.dayOfWeek] || `Day ${params.dayOfWeek}`;

  if (filtered.length === 0) {
    return JSON.stringify({ message: `No alarms scheduled for ${dayName}`, alarms: [], count: 0 });
  }

  const formatted = filtered.map(a => ({
    id: a.id,
    title: a.title,
    alarmTime: a.alarmTime,
    isEnabled: a.isEnabled,
    soundFile: a.soundFile,
    notificationType: a.notificationType,
    nextTriggerAt: a.nextTriggerAt,
  }));

  return JSON.stringify({ day: dayName, alarms: formatted, count: formatted.length }, null, 2);
}

async function getTodayAlarms(userId: string): Promise<string> {
  const alarms = await workoutAlarmService.getTodayAlarms(userId);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const dayName = dayNames[today.getDay()];

  if (alarms.length === 0) {
    return JSON.stringify({ message: `No active alarms for today (${dayName})`, alarms: [], count: 0 });
  }

  const formatted = alarms.map(a => ({
    id: a.id,
    title: a.title,
    alarmTime: a.alarmTime,
    soundFile: a.soundFile,
    notificationType: a.notificationType,
    nextTriggerAt: a.nextTriggerAt,
    snoozeMinutes: a.snoozeMinutes,
  }));

  return JSON.stringify({ day: dayName, alarms: formatted, count: formatted.length }, null, 2);
}

async function getAlarmSummary(userId: string): Promise<string> {
  const summary = await workoutAlarmService.getScheduleSummary(userId);

  return JSON.stringify({
    success: true,
    summary: {
      totalAlarms: summary.totalAlarms,
      enabledAlarms: summary.enabledAlarms,
      disabledAlarms: summary.totalAlarms - summary.enabledAlarms,
      todayAlarmsCount: summary.todayAlarms.length,
      todayAlarms: summary.todayAlarms.map(a => ({
        id: a.id,
        title: a.title,
        alarmTime: a.alarmTime,
      })),
      nextAlarm: summary.nextAlarm
        ? {
            id: summary.nextAlarm.id,
            title: summary.nextAlarm.title,
            alarmTime: summary.nextAlarm.alarmTime,
            nextTriggerAt: summary.nextAlarm.nextTriggerAt,
            daysFormatted: workoutAlarmService.formatDaysOfWeek(summary.nextAlarm.daysOfWeek, true),
          }
        : null,
    },
  }, null, 2);
}

async function toggleAlarm(userId: string, params: z.infer<typeof ToggleAlarmSchema>): Promise<string> {
  const alarm = await workoutAlarmService.toggleAlarm(userId, params.alarmId);

  if (!alarm) {
    return JSON.stringify({ success: false, error: 'Alarm not found or access denied' });
  }

  return JSON.stringify({
    success: true,
    message: `Alarm "${alarm.title}" ${alarm.isEnabled ? 'enabled' : 'disabled'} successfully`,
    data: { id: alarm.id, title: alarm.title, isEnabled: alarm.isEnabled },
  });
}

async function snoozeAlarm(userId: string, params: z.infer<typeof SnoozeAlarmSchema>): Promise<string> {
  const existing = await workoutAlarmService.getAlarm(userId, params.alarmId);
  if (!existing) {
    return JSON.stringify({ success: false, error: 'Alarm not found or access denied' });
  }

  const minutes = params.minutes ?? existing.snoozeMinutes ?? 10;
  const alarm = await workoutAlarmService.snoozeAlarm(userId, params.alarmId, minutes);

  if (!alarm) {
    return JSON.stringify({ success: false, error: 'Failed to snooze alarm' });
  }

  return JSON.stringify({
    success: true,
    message: `Alarm "${alarm.title}" snoozed for ${minutes} minutes`,
    data: { id: alarm.id, title: alarm.title, nextTriggerAt: alarm.nextTriggerAt },
  });
}

/**
 * Get workout log by ID
 */
async function getWorkoutLogById(userId: string, params: z.infer<typeof GetWorkoutLogByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM workout_logs WHERE id = $1 AND user_id = $2`,
    [params.logId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Workout log not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    workoutPlanId: row.workout_plan_id,
    scheduledDate: row.scheduled_date,
    workoutName: row.workout_name,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    exercisesCompleted: row.exercises_completed,
    difficultyRating: row.difficulty_rating,
    energyLevel: row.energy_level,
    moodAfter: row.mood_after,
    notes: row.notes,
  };

  return JSON.stringify({ success: true, log: formatted }, null, 2);
}

/**
 * Get workout log by date
 */
async function getWorkoutLogByDate(userId: string, params: z.infer<typeof GetWorkoutLogByDateSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM workout_logs WHERE user_id = $1 AND scheduled_date = $2 ORDER BY scheduled_date DESC`,
    [userId, params.date]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No workout logs found for this date', logs: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    workoutName: row.workout_name,
    scheduledDate: row.scheduled_date,
    status: row.status,
    durationMinutes: row.duration_minutes,
    difficultyRating: row.difficulty_rating,
    moodAfter: row.mood_after,
  }));

  return JSON.stringify({ logs: formatted, count: formatted.length }, null, 2);
}

/**
 * Create workout log
 */
async function createWorkoutLog(userId: string, params: z.infer<typeof CreateWorkoutLogSchema>): Promise<string> {
  // Verify workout plan ownership if provided
  if (params.workoutPlanId) {
    const planCheck = await query(
      `SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2`,
      [params.workoutPlanId, userId]
    );

    if (planCheck.rows.length === 0) {
      return JSON.stringify({ success: false, error: 'Workout plan not found or access denied' });
    }
  }

  const result = await query<{ id: string }>(
    `INSERT INTO workout_logs (
      user_id, workout_plan_id, scheduled_date, scheduled_day_of_week, workout_name,
      started_at, completed_at, duration_minutes, status, exercises_completed,
      difficulty_rating, energy_level, mood_after, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id`,
    [
      userId,
      params.workoutPlanId || null,
      params.scheduledDate,
      params.scheduledDayOfWeek || null,
      params.workoutName || null,
      params.startedAt ? new Date(params.startedAt) : null,
      params.completedAt ? new Date(params.completedAt) : null,
      params.durationMinutes || null,
      params.status || 'pending',
      params.exercisesCompleted ? JSON.stringify(params.exercisesCompleted) : '[]',
      params.difficultyRating || null,
      params.energyLevel || null,
      params.moodAfter || null,
      params.notes || null,
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Workout log created successfully',
    data: { id: result.rows[0].id },
  });
}

/**
 * Update workout log
 */
async function updateWorkoutLog(userId: string, params: z.infer<typeof UpdateWorkoutLogSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM workout_logs WHERE id = $1 AND user_id = $2`,
    [params.logId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Workout log not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    status: 'status',
    durationMinutes: 'duration_minutes',
    difficultyRating: 'difficulty_rating',
    energyLevel: 'energy_level',
    moodAfter: 'mood_after',
    notes: 'notes',
  };

  const setClauses: string[] = [];
  const values: (string | number | Date | object)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'logId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      if (key === 'exercisesCompleted') {
        setClauses.push(`exercises_completed = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else if (key === 'startedAt' || key === 'completedAt') {
        setClauses.push(`${key === 'startedAt' ? 'started_at' : 'completed_at'} = $${paramIndex}`);
        values.push(new Date(value as string));
      } else {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(value as string | number);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE workout_logs SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.logId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Workout log updated successfully',
  });
}

/**
 * Delete workout log
 */
async function deleteWorkoutLog(userId: string, params: z.infer<typeof DeleteWorkoutLogSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM workout_logs WHERE id = $1 AND user_id = $2`,
    [params.logId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Workout log not found or access denied' });
  }

  await query(
    `DELETE FROM workout_logs WHERE id = $1 AND user_id = $2`,
    [params.logId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Workout log deleted successfully',
  });
}

/**
 * Delete all workout logs
 */
async function deleteAllWorkoutLogs(userId: string, params: z.infer<typeof DeleteAllWorkoutLogsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all workout logs.'
    });
  }

  let sqlQuery = `DELETE FROM workout_logs WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params.planId) {
    sqlQuery += ` AND workout_plan_id = $${paramIndex}`;
    queryParams.push(params.planId);
    paramIndex++;
  }

  if (params.startDate) {
    sqlQuery += ` AND scheduled_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params.endDate) {
    sqlQuery += ` AND scheduled_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} workout log(s)`,
    deletedCount: result.rowCount || 0,
  });
}

/**
 * Update all workout logs
 */
async function updateAllWorkoutLogs(userId: string, params: z.infer<typeof UpdateAllWorkoutLogsSchema>): Promise<string> {
  let sqlQuery = `UPDATE workout_logs SET `;
  const setClauses: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (params.updates.status !== undefined) {
    setClauses.push(`status = $${paramIndex}`);
    values.push(params.updates.status);
    paramIndex++;
  }

  if (params.updates.difficultyRating !== undefined) {
    setClauses.push(`difficulty_rating = $${paramIndex}`);
    values.push(params.updates.difficultyRating);
    paramIndex++;
  }

  if (params.updates.energyLevel !== undefined) {
    setClauses.push(`energy_level = $${paramIndex}`);
    values.push(params.updates.energyLevel);
    paramIndex++;
  }

  if (params.updates.moodAfter !== undefined) {
    setClauses.push(`mood_after = $${paramIndex}`);
    values.push(params.updates.moodAfter);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  sqlQuery += setClauses.join(', ');

  sqlQuery += ` WHERE user_id = $${paramIndex}`;
  values.push(userId);
  paramIndex++;

  if (params.filter) {
    if (params.filter.planId) {
      sqlQuery += ` AND workout_plan_id = $${paramIndex}`;
      values.push(params.filter.planId);
      paramIndex++;
    }
    if (params.filter.startDate) {
      sqlQuery += ` AND scheduled_date >= $${paramIndex}`;
      values.push(params.filter.startDate);
      paramIndex++;
    }
    if (params.filter.endDate) {
      sqlQuery += ` AND scheduled_date <= $${paramIndex}`;
      values.push(params.filter.endDate);
      paramIndex++;
    }
    if (params.filter.status) {
      sqlQuery += ` AND status = $${paramIndex}`;
      values.push(params.filter.status);
      paramIndex++;
    }
  }

  const result = await query(sqlQuery, values);

  return JSON.stringify({
    success: true,
    message: `Updated ${result.rowCount || 0} workout log(s)`,
    updatedCount: result.rowCount || 0,
  });
}

/**
 * Check workout progress and detect missed tasks
 */
async function checkWorkoutProgress(userId: string, params?: z.infer<typeof CheckWorkoutProgressSchema>): Promise<string> {
  const { workoutAuditService } = await import('../../workout-audit.service.js');
  const { workoutPlanService: wpService } = await import('../../workout-plan.service.js');

  // Get active workout plans
  const plans = await wpService.getUserPlans(userId, 'active');

  if (plans.length === 0) {
    return JSON.stringify({ success: true, data: { missedTasks: [], message: 'No active workout plans found' } }, null, 2);
  }

  // If specific plan requested, filter
  let targetPlans = plans;
  if (params?.workoutPlanId) {
    targetPlans = plans.filter((p: any) => p.id === params.workoutPlanId);
  }

  const allMissedTasks: Array<{ planId: string; planName: string; tasks: any[] }> = [];

  for (const plan of targetPlans) {
    const missedTasks = await workoutAuditService.getMissedTasks(userId, plan.id);
    if (missedTasks.length > 0) {
      allMissedTasks.push({
        planId: plan.id,
        planName: plan.name,
        tasks: missedTasks,
      });
    }
  }

  const totalMissed = allMissedTasks.reduce((sum, p) => sum + p.tasks.length, 0);

  return JSON.stringify({
    success: true,
    data: {
      missedTasks: allMissedTasks,
      totalMissed,
      message: totalMissed > 0
        ? `Found ${totalMissed} missed workout(s). Would you like me to reschedule them?`
        : 'All workouts are on track!',
    },
  }, null, 2);
}

/**
 * Reschedule missed workout tasks
 */
async function rescheduleWorkoutTasks(userId: string, params: z.infer<typeof RescheduleWorkoutTasksSchema>): Promise<string> {
  const { workoutRescheduleWorkflowService } = await import('../../workout-reschedule-workflow.service.js');

  const result = await workoutRescheduleWorkflowService.executeRescheduleWorkflow(
    userId,
    params.workoutPlanId,
    params.policy || 'FILL_GAPS',
    'conversation'
  );

  if (result.success) {
    return JSON.stringify({
      success: true,
      data: {
        actions: result.actions,
        summary: result.summary,
        message: result.summary,
      },
    }, null, 2);
  } else {
    return JSON.stringify({
      success: false,
      error: result.summary,
      validationErrors: result.validationErrors,
    }, null, 2);
  }
}

// --- Registration ---

export function registerWorkoutTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserWorkoutPlans',
      description: "Get the user's workout plans. Use when user asks about their workouts, exercise routines, or training plans. Returns plan details including name, status, difficulty, progress, and schedule.",
      schema: GetUserWorkoutPlansSchema,
      handler: withErrorHandling('getUserWorkoutPlans', (uid, params) => getUserWorkoutPlans(uid, params)),
    },
    {
      name: 'getUserWorkoutLogs',
      description: "Get the user's workout logs (completed workouts). Use when user asks about their workout history, what workouts they did, or exercise completion records. Returns logs with dates, exercises, duration, and ratings.",
      schema: GetUserWorkoutLogsSchema,
      handler: withErrorHandling('getUserWorkoutLogs', (uid, params) => getUserWorkoutLogs(uid, params)),
    },
    {
      name: 'getUserTasks',
      description: "Get the user's tasks. Use when user asks about their tasks, to-dos, reminders, or scheduled activities. Returns tasks with status, priority, category, and schedule.",
      schema: GetUserTasksSchema,
      handler: withErrorHandling('getUserTasks', (uid, params) => getUserTasks(uid, params)),
    },
    {
      name: 'createWorkoutPlan',
      description: 'Create a new workout plan for the user. Use when user asks to create, add, or make a new workout plan. Exercises will be automatically generated if not provided in weeklySchedule. Always include exercises in the plan - they are essential for a complete workout plan.',
      schema: CreateWorkoutPlanSchema,
      handler: withErrorHandling('createWorkoutPlan', (uid, params) => createWorkoutPlan(uid, params)),
    },
    {
      name: 'updateWorkoutPlan',
      description: 'Update an existing workout plan. Use when user asks to modify, change, or update a workout plan. Requires the plan ID and fields to update.',
      schema: UpdateWorkoutPlanSchema,
      handler: withErrorHandling('updateWorkoutPlan', (uid, params) => updateWorkoutPlan(uid, params)),
    },
    {
      name: 'deleteWorkoutPlan',
      description: 'Delete a workout plan. Use when user asks to remove, delete, or cancel a workout plan. Requires the plan ID.',
      schema: DeleteWorkoutPlanSchema,
      handler: withErrorHandling('deleteWorkoutPlan', (uid, params) => deleteWorkoutPlan(uid, params)),
    },
    {
      name: 'createWorkoutAlarm',
      description: 'Create a workout alarm/reminder. Use when user asks to set, create, or add a workout reminder or alarm. Requires alarm time.',
      schema: CreateWorkoutAlarmSchema,
      handler: withErrorHandling('createWorkoutAlarm', (uid, params) => createWorkoutAlarm(uid, params)),
    },
    {
      name: 'updateWorkoutAlarm',
      description: 'Update a workout alarm. Use when user asks to modify, change, or update a workout alarm/reminder. Requires the alarm ID.',
      schema: UpdateWorkoutAlarmSchema,
      handler: withErrorHandling('updateWorkoutAlarm', (uid, params) => updateWorkoutAlarm(uid, params)),
    },
    {
      name: 'deleteWorkoutAlarm',
      description: 'Delete a workout alarm. Use when user asks to remove, delete, or cancel a workout alarm/reminder. Requires the alarm ID.',
      schema: DeleteWorkoutAlarmSchema,
      handler: withErrorHandling('deleteWorkoutAlarm', (uid, params) => deleteWorkoutAlarm(uid, params)),
    },
    {
      name: 'getAllAlarms',
      description: "Get all the user's alarms/reminders. Use when user asks to see, list, show, or view all their alarms. Can filter to only enabled alarms.",
      schema: GetAllAlarmsSchema,
      handler: withErrorHandling('getAllAlarms', (uid, params) => getAllAlarms(uid, params)),
      mutationType: 'read',
    },
    {
      name: 'getAlarmById',
      description: 'Get details of a specific alarm by ID. Use when user asks about a particular alarm or wants to see its full settings.',
      schema: GetAlarmByIdSchema,
      handler: withErrorHandling('getAlarmById', (uid, params) => getAlarmById(uid, params)),
      mutationType: 'read',
    },
    {
      name: 'getAlarmsByDay',
      description: 'Get alarms scheduled for a specific day of the week. Use when user asks what alarms are set for Monday, Tuesday, etc. Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.',
      schema: GetAlarmsByDaySchema,
      handler: withErrorHandling('getAlarmsByDay', (uid, params) => getAlarmsByDay(uid, params)),
      mutationType: 'read',
    },
    {
      name: 'getTodayAlarms',
      description: "Get today's active alarms. Use when user asks what alarms they have today, what's coming up today, or their today's alarm schedule.",
      schema: GetTodayAlarmsSchema,
      handler: withErrorHandling('getTodayAlarms', (uid) => getTodayAlarms(uid)),
      mutationType: 'read',
    },
    {
      name: 'getAlarmSummary',
      description: 'Get alarm schedule summary including total count, active/inactive counts, next upcoming alarm, and today\'s alarms. Use when user asks for alarm overview, summary, or stats.',
      schema: GetAlarmSummarySchema,
      handler: withErrorHandling('getAlarmSummary', (uid) => getAlarmSummary(uid)),
      mutationType: 'read',
    },
    {
      name: 'toggleAlarm',
      description: 'Toggle an alarm on or off (enable/disable). Use when user asks to turn on, turn off, enable, disable, activate, or deactivate an alarm. Requires alarm ID.',
      schema: ToggleAlarmSchema,
      handler: withErrorHandling('toggleAlarm', (uid, params) => toggleAlarm(uid, params)),
      mutationType: 'update',
    },
    {
      name: 'snoozeAlarm',
      description: 'Snooze an alarm for a specified number of minutes. Use when user asks to snooze, delay, or postpone an alarm. Defaults to the alarm\'s configured snooze time or 10 minutes.',
      schema: SnoozeAlarmSchema,
      handler: withErrorHandling('snoozeAlarm', (uid, params) => snoozeAlarm(uid, params)),
      mutationType: 'update',
    },
    {
      name: 'getWorkoutLogById',
      description: 'Get a specific workout log by ID. Use when user asks about a particular workout session.',
      schema: GetWorkoutLogByIdSchema,
      handler: withErrorHandling('getWorkoutLogById', (uid, params) => getWorkoutLogById(uid, params)),
    },
    {
      name: 'getWorkoutLogByDate',
      description: 'Get workout logs for a specific date. Use when user asks about workouts on a particular day.',
      schema: GetWorkoutLogByDateSchema,
      handler: withErrorHandling('getWorkoutLogByDate', (uid, params) => getWorkoutLogByDate(uid, params)),
    },
    {
      name: 'createWorkoutLog',
      description: 'Create a workout log. Use when user wants to log a workout session manually.',
      schema: CreateWorkoutLogSchema,
      handler: withErrorHandling('createWorkoutLog', (uid, params) => createWorkoutLog(uid, params)),
    },
    {
      name: 'updateWorkoutLog',
      description: 'Update a workout log. Use when user asks to modify, change, or update workout log details.',
      schema: UpdateWorkoutLogSchema,
      handler: withErrorHandling('updateWorkoutLog', (uid, params) => updateWorkoutLog(uid, params)),
    },
    {
      name: 'deleteWorkoutLog',
      description: 'Delete a workout log. Use when user asks to remove or delete a workout session.',
      schema: DeleteWorkoutLogSchema,
      handler: withErrorHandling('deleteWorkoutLog', (uid, params) => deleteWorkoutLog(uid, params)),
    },
    {
      name: 'deleteAllWorkoutLogs',
      description: 'Delete all workout logs (with optional filters). Use when user asks to clear all workout logs. Requires confirmation.',
      schema: DeleteAllWorkoutLogsSchema,
      handler: withErrorHandling('deleteAllWorkoutLogs', (uid, params) => deleteAllWorkoutLogs(uid, params)),
    },
    {
      name: 'updateAllWorkoutLogs',
      description: 'Update multiple workout logs at once. Use when user asks to bulk update workout logs.',
      schema: UpdateAllWorkoutLogsSchema,
      handler: withErrorHandling('updateAllWorkoutLogs', (uid, params) => updateAllWorkoutLogs(uid, params)),
    },
    {
      name: 'checkWorkoutProgress',
      description: 'Check workout progress and detect missed tasks. Use when user asks about missed workouts, workout completion, or to see if any workouts need rescheduling. Returns missed tasks and suggests rescheduling if needed.',
      schema: CheckWorkoutProgressSchema,
      handler: withErrorHandling('checkWorkoutProgress', (uid, params) => checkWorkoutProgress(uid, params)),
    },
    {
      name: 'rescheduleWorkoutTasks',
      description: 'Reschedule missed workout tasks. Use when user asks to reschedule missed workouts, move workouts to different days, or adjust their workout schedule. Automatically finds best slots based on constraints.',
      schema: RescheduleWorkoutTasksSchema,
      handler: withErrorHandling('rescheduleWorkoutTasks', (uid, params) => rescheduleWorkoutTasks(uid, params)),
    },
  ];
}
