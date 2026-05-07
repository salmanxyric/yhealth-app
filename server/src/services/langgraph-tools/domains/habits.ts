import { z } from 'zod';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';
import { logger } from '../../logger.service.js';
import { habitService } from '../../wellbeing/habit.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetUserHabitsSchema = z.object({
  includeArchived: z.boolean().optional().describe('Include archived habits (default: false)'),
});

const CreateHabitSchema = z.object({
  habitName: z.string().describe('Habit name (required)'),
  category: z.string().optional().describe('Habit category'),
  trackingType: z.enum(['boolean', 'numeric', 'duration']).describe('Tracking type'),
  frequency: z.enum(['daily', 'weekly', 'custom']).describe('Frequency'),
  specificDays: z.array(z.string()).optional().describe('Specific days for custom frequency'),
  description: z.string().optional().describe('Description'),
  targetValue: z.number().optional().describe('Target value for numeric tracking'),
  unit: z.string().optional().describe('Unit for numeric tracking'),
  reminderEnabled: z.boolean().optional().describe('Enable reminders'),
  reminderTime: z.string().optional().describe('Reminder time in HH:MM format'),
});

const UpdateHabitSchema = z.object({
  habitId: z.string().describe('Habit ID (required)'),
  habitName: z.string().optional(),
  category: z.string().optional(),
  trackingType: z.enum(['boolean', 'numeric', 'duration']).optional(),
  frequency: z.enum(['daily', 'weekly', 'custom']).optional(),
  specificDays: z.array(z.string()).optional(),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

const DeleteHabitSchema = z.object({
  habitId: z.string().describe('Habit ID to delete (required)'),
});

const LogHabitCompletionSchema = z.object({
  habitId: z.string().describe('Habit ID (required)'),
  completed: z.boolean().describe('Whether habit was completed (required)'),
  value: z.number().optional().describe('Value for numeric tracking'),
  note: z.string().optional().describe('Note'),
  logDate: z.string().optional().describe('Date in ISO format (YYYY-MM-DD)'),
});

const GetHabitByIdSchema = z.object({
  habitId: z.string().describe('Habit ID (required)'),
});

const GetHabitAnalyticsSchema = z.object({
  habitId: z.string().describe('Habit ID (required)'),
  days: z.number().optional().describe('Number of days to analyze (default: 30)'),
});

// --- Implementations ---

async function getUserHabits(userId: string, params?: z.infer<typeof GetUserHabitsSchema>): Promise<string> {
  const result = await habitService.getHabits(userId, params?.includeArchived);
  return JSON.stringify({ success: true, data: { habits: result } }, null, 2);
}

async function createHabit(userId: string, params: z.infer<typeof CreateHabitSchema>): Promise<string> {
  const result = await habitService.createHabit(userId, {
    habitName: params.habitName,
    category: params.category,
    trackingType: params.trackingType as any,
    frequency: params.frequency,
    specificDays: params.specificDays as any,
    description: params.description,
    targetValue: params.targetValue,
    unit: params.unit,
    reminderEnabled: params.reminderEnabled,
    reminderTime: params.reminderTime,
  });

  // Queue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: result.id,
    operation: 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { habit: result } }, null, 2);
}

async function updateHabit(userId: string, params: z.infer<typeof UpdateHabitSchema>): Promise<string> {
  const result = await habitService.updateHabit(userId, params.habitId, {
    habitName: params.habitName,
    category: params.category,
    trackingType: params.trackingType as any,
    frequency: params.frequency,
    specificDays: params.specificDays as any,
    description: params.description,
    targetValue: params.targetValue,
    unit: params.unit,
    reminderEnabled: params.reminderEnabled,
    reminderTime: params.reminderTime,
    isActive: params.isActive,
    isArchived: params.isArchived,
  });

  // Queue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: params.habitId,
    operation: 'update',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { habit: result } }, null, 2);
}

async function deleteHabit(userId: string, params: z.infer<typeof DeleteHabitSchema>): Promise<string> {
  await habitService.deleteHabit(userId, params.habitId);

  // Queue embedding deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: params.habitId,
    operation: 'delete',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, message: 'Habit deleted successfully' }, null, 2);
}

async function logHabitCompletion(userId: string, params: z.infer<typeof LogHabitCompletionSchema>): Promise<string> {
  const result = await habitService.logHabitCompletion(userId, params.habitId, {
    completed: params.completed,
    value: params.value,
    note: params.note,
    logDate: params.logDate,
  });

  return JSON.stringify({ success: true, data: { habitLog: result } }, null, 2);
}

async function getHabitById(userId: string, params: z.infer<typeof GetHabitByIdSchema>): Promise<string> {
  const habit = await habitService.getHabitById(userId, params.habitId);
  return JSON.stringify({ success: true, data: { habit } }, null, 2);
}

function buildHabitCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (!data) return artifacts;

  const completionRate = data.completionRate ?? data.completion_rate;
  const currentStreak = data.currentStreak ?? data.current_streak;
  const habitName = data.habitName ?? data.habit_name ?? 'Habit';
  const dailyData = Array.isArray(data.dailyCompletion || data.daily_completion || data.entries)
    ? (data.dailyCompletion || data.daily_completion || data.entries)
    : [];

  if (completionRate !== undefined) {
    artifacts.push({
      type: 'chart',
      chartType: 'gauge',
      title: `${habitName} — Completion Rate`,
      data: [{ value: Math.round(completionRate) }],
      xAxisKey: 'value',
      dataKeys: [{ key: 'value', label: 'Completion %', color: '#10b981' }],
      gaugeMax: 100,
      insight: `${Math.round(completionRate)}% completion rate.${currentStreak ? ` Current streak: ${currentStreak} days.` : ''}`,
    });
  }

  if (dailyData.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: `${habitName} — Daily Progress`,
      data: dailyData.slice(-30).map((entry: any) => ({
        date: String(entry.date || entry.log_date || '').slice(0, 10),
        completed: entry.completed || entry.value ? 1 : 0,
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'completed', label: 'Completed', color: '#10b981' }],
      yAxisLabel: 'Done',
    });
  }

  return artifacts;
}

async function getHabitAnalytics(userId: string, params: z.infer<typeof GetHabitAnalyticsSchema>): Promise<string> {
  const result = await habitService.getHabitAnalytics(userId, params.habitId, params.days);
  const artifacts = buildHabitCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
}

// --- Registration ---

export function registerHabitTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserHabits',
      description: 'Get the user\'s habits. Use when user asks about their habits, habit tracking, or habit list.',
      schema: GetUserHabitsSchema,
      handler: withErrorHandling('getUserHabits', async (uid, params) =>
        getUserHabits(uid, params),
      ),
    },
    {
      name: 'createHabit',
      description: 'Create a new habit. Use when user wants to start tracking a new habit or mentions wanting to build a habit.',
      schema: CreateHabitSchema,
      handler: withErrorHandling('createHabit', async (uid, params) =>
        createHabit(uid, params),
      ),
    },
    {
      name: 'updateHabit',
      description: 'Update a habit. Use when user asks to modify habit settings, change frequency, or update habit details.',
      schema: UpdateHabitSchema,
      handler: withErrorHandling('updateHabit', async (uid, params) =>
        updateHabit(uid, params),
      ),
    },
    {
      name: 'deleteHabit',
      description: 'Delete a habit. Use when user asks to remove or stop tracking a habit.',
      schema: DeleteHabitSchema,
      handler: withErrorHandling('deleteHabit', async (uid, params) =>
        deleteHabit(uid, params),
      ),
    },
    {
      name: 'logHabitCompletion',
      description: 'Log habit completion. Use when user mentions completing a habit, doing a habit, or wants to mark a habit as done. Can suggest logging when user mentions habit activities.',
      schema: LogHabitCompletionSchema,
      handler: withErrorHandling('logHabitCompletion', async (uid, params) =>
        logHabitCompletion(uid, params),
      ),
    },
    {
      name: 'getHabitById',
      description: 'Get a single habit by ID with full details. Use when the user asks about a specific habit or you need to look up habit details before updating.',
      schema: GetHabitByIdSchema,
      handler: withErrorHandling('getHabitById', async (uid, params) =>
        getHabitById(uid, params),
      ),
    },
    {
      name: 'getHabitAnalytics',
      description: 'Get habit analytics and insights. Use when user asks about habit performance, completion rate, streaks, or habit statistics.',
      schema: GetHabitAnalyticsSchema,
      handler: withErrorHandling('getHabitAnalytics', async (uid, params) =>
        getHabitAnalytics(uid, params),
      ),
    },
  ];
}
