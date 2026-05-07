import { z } from 'zod';
import { query, transaction } from '../../../config/database.config.js';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';
import { logger } from '../../logger.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const CreateGoalSchema = z.object({
  title: z.string().describe('Goal title (required)'),
  description: z.string().optional(),
  category: z.string().optional().describe('Goal category'),
  pillar: z.string().optional().describe('Health pillar: fitness, nutrition, sleep, etc.'),
  targetValue: z.number().optional(),
  targetUnit: z.string().optional(),
  currentValue: z.number().optional(),
  durationWeeks: z.number().optional(),
  motivation: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const UpdateGoalSchema = z.object({
  goalId: z.string().describe('Goal ID (required)'),
  title: z.string().optional(),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  motivation: z.string().optional(),
  status: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const DeleteGoalSchema = z.object({
  goalId: z.string().describe('Goal ID to delete (required)'),
});

const GetGoalByIdSchema = z.object({
  goalId: z.string().describe('Goal ID to retrieve (required)'),
});

const GetGoalByNameSchema = z.object({
  name: z.string().describe('Goal title to search for (case-insensitive)'),
  exactMatch: z.boolean().optional().describe('If true, match exact title; if false, partial match'),
});

const GetGoalByDateSchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  targetDate: z.string().optional().describe('Filter by target date in ISO format (YYYY-MM-DD)'),
});

const DeleteAllGoalsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  status: z.string().optional().describe('Filter by status: active, completed, paused, archived'),
  category: z.string().optional().describe('Filter by goal category'),
});

const UpdateAllGoalsSchema = z.object({
  updates: z.object({
    status: z.string().optional(),
    currentValue: z.number().optional(),
    progress: z.number().optional(),
  }),
  filter: z.object({
    status: z.string().optional(),
    category: z.string().optional(),
    pillar: z.string().optional(),
  }).optional(),
});

// --- Implementations ---

function buildGoalCharts(
  goals: { title: string; targetValue: number; currentValue: number; progress: number; status: string; category: string }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (goals.length === 0) return artifacts;

  const withTargets = goals.filter((g) => g.targetValue > 0);
  if (withTargets.length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Goal Progress',
      data: withTargets.map((g) => ({
        name: g.title || 'Goal',
        current: g.currentValue || 0,
        target: g.targetValue || 0,
      })),
      xAxisKey: 'name',
      dataKeys: [
        { key: 'current', label: 'Current', color: '#10b981' },
        { key: 'target', label: 'Target', color: '#64748b' },
      ],
      yAxisLabel: 'Value',
      insight: (() => {
        const completed = goals.filter((g) => g.status === 'completed' || g.progress >= 100);
        return completed.length > 0
          ? `${completed.length} of ${goals.length} goals completed!`
          : `${goals.length} active goals in progress.`;
      })(),
    });
  }

  return artifacts;
}

async function getUserGoals(userId: string, params?: { status?: string; startDate?: string; endDate?: string }): Promise<string> {
  let sqlQuery = `SELECT * FROM user_goals WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params?.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  } else {
    sqlQuery += ` AND status = 'active'`;
  }

  if (params?.startDate) {
    sqlQuery += ` AND start_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params?.endDate) {
    sqlQuery += ` AND (target_date <= $${paramIndex} OR start_date <= $${paramIndex})`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY is_primary DESC, created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No goals found', goals: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    category: row.category,
    pillar: row.pillar,
    title: row.title,
    description: row.description,
    isPrimary: row.is_primary,
    targetValue: row.target_value,
    currentValue: row.current_value,
    targetUnit: row.target_unit,
    startDate: row.start_date,
    targetDate: row.target_date,
    status: row.status,
    progress: row.progress,
    motivation: row.motivation,
  }));

  const artifacts = buildGoalCharts(formatted);
  return JSON.stringify({ goals: formatted, count: formatted.length, artifacts }, null, 2);
}

async function getGoalById(userId: string, params: z.infer<typeof GetGoalByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM user_goals WHERE id = $1 AND user_id = $2`,
    [params.goalId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Goal not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    category: row.category,
    pillar: row.pillar,
    title: row.title,
    description: row.description,
    isPrimary: row.is_primary,
    targetValue: row.target_value,
    currentValue: row.current_value,
    targetUnit: row.target_unit,
    startDate: row.start_date,
    targetDate: row.target_date,
    status: row.status,
    progress: row.progress,
    motivation: row.motivation,
    milestones: row.milestones,
    durationWeeks: row.duration_weeks,
  };

  return JSON.stringify({ success: true, goal: formatted }, null, 2);
}

async function getGoalByName(userId: string, params: z.infer<typeof GetGoalByNameSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM user_goals WHERE user_id = $1`;
  const queryParams: string[] = [userId];

  if (params.exactMatch) {
    sqlQuery += ` AND LOWER(title) = LOWER($2)`;
    queryParams.push(params.name);
  } else {
    sqlQuery += ` AND LOWER(title) LIKE LOWER($2)`;
    queryParams.push(`%${params.name}%`);
  }

  sqlQuery += ` ORDER BY is_primary DESC, created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No goals found', goals: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    category: row.category,
    pillar: row.pillar,
    title: row.title,
    description: row.description,
    isPrimary: row.is_primary,
    targetValue: row.target_value,
    currentValue: row.current_value,
    status: row.status,
  }));

  return JSON.stringify({ goals: formatted, count: formatted.length }, null, 2);
}

async function getGoalByDate(userId: string, params: z.infer<typeof GetGoalByDateSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM user_goals WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params.startDate) {
    sqlQuery += ` AND start_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params.endDate) {
    sqlQuery += ` AND target_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  if (params.targetDate) {
    sqlQuery += ` AND target_date = $${paramIndex}`;
    queryParams.push(params.targetDate);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY target_date ASC, created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No goals found for the specified date range', goals: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    startDate: row.start_date,
    targetDate: row.target_date,
    status: row.status,
    progress: row.progress,
  }));

  return JSON.stringify({ goals: formatted, count: formatted.length }, null, 2);
}

async function deleteAllGoals(userId: string, params: z.infer<typeof DeleteAllGoalsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all goals.',
    });
  }

  let sqlQuery = `DELETE FROM user_goals WHERE user_id = $1`;
  const queryParams: (string | number)[] = [userId];
  let paramIndex = 2;

  if (params.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }

  if (params.category) {
    sqlQuery += ` AND category = $${paramIndex}`;
    queryParams.push(params.category);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} goal(s)`,
    deletedCount: result.rowCount || 0,
  });
}

async function updateAllGoals(userId: string, params: z.infer<typeof UpdateAllGoalsSchema>): Promise<string> {
  let sqlQuery = `UPDATE user_goals SET `;
  const setClauses: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  // Build update clauses
  if (params.updates.status !== undefined) {
    setClauses.push(`status = $${paramIndex}`);
    values.push(params.updates.status);
    paramIndex++;
  }

  if (params.updates.currentValue !== undefined) {
    setClauses.push(`current_value = $${paramIndex}`);
    values.push(params.updates.currentValue);
    paramIndex++;
  }

  if (params.updates.progress !== undefined) {
    setClauses.push(`progress = $${paramIndex}`);
    values.push(params.updates.progress);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  sqlQuery += setClauses.join(', ');

  // Build WHERE clause
  sqlQuery += ` WHERE user_id = $${paramIndex}`;
  values.push(userId);
  paramIndex++;

  if (params.filter) {
    if (params.filter.status) {
      sqlQuery += ` AND status = $${paramIndex}`;
      values.push(params.filter.status);
      paramIndex++;
    }
    if (params.filter.category) {
      sqlQuery += ` AND category = $${paramIndex}`;
      values.push(params.filter.category);
      paramIndex++;
    }
    if (params.filter.pillar) {
      sqlQuery += ` AND pillar = $${paramIndex}`;
      values.push(params.filter.pillar);
      paramIndex++;
    }
  }

  const result = await query(sqlQuery, values);

  return JSON.stringify({
    success: true,
    message: `Updated ${result.rowCount || 0} goal(s)`,
    updatedCount: result.rowCount || 0,
  });
}

async function createGoal(userId: string, params: z.infer<typeof CreateGoalSchema>): Promise<string> {
  const warnings: string[] = [];

  if (!params.title?.trim()) {
    return JSON.stringify({ success: false, error: 'Goal title is required' });
  }

  const category = params.category || 'overall_optimization';
  const pillar = params.pillar || 'fitness';
  const targetValue = params.targetValue || 100;
  const targetUnit = params.targetUnit || 'percent';
  const currentValue = params.currentValue || 0;
  const durationWeeks = params.durationWeeks || 4;
  const description = params.description || params.title;
  const motivation = params.motivation || 'Achieve your health goals!';

  const startDate = new Date();
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + durationWeeks * 7);

  const milestones: { week: number; date: string; targetValue: number }[] = [];
  for (let i = 1; i <= durationWeeks; i++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(weekDate.getDate() + i * 7);
    const milestoneValue = currentValue + ((targetValue - currentValue) * i) / durationWeeks;
    milestones.push({
      week: i,
      date: weekDate.toISOString().split('T')[0],
      targetValue: Math.round(milestoneValue * 100) / 100,
    });
  }

  // Transaction with advisory lock to prevent concurrent creates from racing past the count check
  const goalId = await transaction(async (client) => {
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1 || ':create_goal'))`, [userId]);

    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*) FROM user_goals WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const existingGoalsCount = parseInt(countResult.rows[0].count, 10);

    if (existingGoalsCount >= 3) {
      throw new GoalLimitError();
    }

    if (params.isPrimary) {
      await client.query(
        'UPDATE user_goals SET is_primary = false WHERE user_id = $1 AND is_primary = true',
        [userId]
      );
    }

    const result = await client.query<{ id: string }>(
      `INSERT INTO user_goals (
        user_id, category, pillar, is_primary, title, description,
        target_value, target_unit, current_value, start_value,
        start_date, target_date, duration_weeks, milestones,
        motivation, confidence_level, ai_suggested
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [
        userId,
        category,
        pillar,
        params.isPrimary || existingGoalsCount === 0,
        params.title.trim(),
        description,
        targetValue,
        targetUnit,
        currentValue,
        currentValue,
        startDate.toISOString().split('T')[0],
        targetDate.toISOString().split('T')[0],
        durationWeeks,
        JSON.stringify(milestones),
        motivation,
        7,
        true,
      ]
    );

    return result.rows[0].id;
  }).catch((err) => {
    if (err instanceof GoalLimitError) return null;
    throw err;
  });

  if (!goalId) {
    return JSON.stringify({
      success: false,
      error: 'Maximum 3 active goals allowed. Please complete or delete an existing goal first.',
    });
  }

  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'user_goal',
    sourceId: goalId,
    operation: 'create',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Goal created successfully',
    data: { id: goalId, title: params.title },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

class GoalLimitError extends Error {
  constructor() { super('Goal limit reached'); }
}

async function updateGoal(userId: string, params: z.infer<typeof UpdateGoalSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_goals WHERE id = $1 AND user_id = $2`,
    [params.goalId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Goal not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    title: 'title',
    description: 'description',
    targetValue: 'target_value',
    currentValue: 'current_value',
    motivation: 'motivation',
    status: 'status',
    isPrimary: 'is_primary',
  };

  const setClauses: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'goalId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value as string | number | boolean | null);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  // If setting as primary, unset other primary goals
  if (params.isPrimary) {
    await query(
      'UPDATE user_goals SET is_primary = false WHERE user_id = $1 AND id != $2 AND is_primary = true',
      [userId, params.goalId]
    );
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE user_goals SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.goalId, userId]
  );

  // Enqueue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'user_goal',
    sourceId: params.goalId,
    operation: 'update',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Goal updated successfully',
    data: { id: params.goalId },
  });
}

async function deleteGoal(userId: string, params: z.infer<typeof DeleteGoalSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_goals WHERE id = $1 AND user_id = $2`,
    [params.goalId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Goal not found or access denied' });
  }

  // Enqueue embedding deletion BEFORE actual deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'user_goal',
    sourceId: params.goalId,
    operation: 'delete',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding deletion', { error: err });
  });

  await query(
    `DELETE FROM user_goals WHERE id = $1 AND user_id = $2`,
    [params.goalId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Goal deleted successfully',
  });
}

// --- Registration ---

export function registerGoalsTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserGoals',
      description: 'Get the user\'s goals. Use when user asks about their goals, objectives, or what they\'re working towards. Returns goal details including category, target, current value, and deadline. Can filter by status and date range.',
      schema: z.object({
        status: z.string().optional().describe('Filter by status: active, completed, paused, archived'),
        startDate: z.string().optional().describe('Filter goals starting from this date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('Filter goals ending by this date (YYYY-MM-DD)'),
      }),
      handler: withErrorHandling('getUserGoals', getUserGoals),
    },
    {
      name: 'getGoalById',
      description: 'Get a specific goal by its ID. Use when user asks about a particular goal or references a goal ID.',
      schema: GetGoalByIdSchema,
      handler: withErrorHandling('getGoalById', getGoalById),
    },
    {
      name: 'getGoalByName',
      description: 'Get goals by searching for the goal title/name. Use when user asks about a goal by its name or title. Supports exact and partial matching.',
      schema: GetGoalByNameSchema,
      handler: withErrorHandling('getGoalByName', getGoalByName),
    },
    {
      name: 'getGoalByDate',
      description: 'Get goals filtered by date range or target date. Use when user asks about goals for a specific time period, goals due by a certain date, or goals starting/ending in a date range.',
      schema: GetGoalByDateSchema,
      handler: withErrorHandling('getGoalByDate', getGoalByDate),
    },
    {
      name: 'createGoal',
      description: 'Create a new goal. Use when user asks to create, add, or set a new health or fitness goal. Requires goal title. Maximum 3 active goals allowed.',
      schema: CreateGoalSchema,
      handler: withErrorHandling('createGoal', createGoal),
    },
    {
      name: 'updateGoal',
      description: 'Update an existing goal. Use when user asks to modify, change, or update a goal. Requires the goal ID.',
      schema: UpdateGoalSchema,
      handler: withErrorHandling('updateGoal', updateGoal),
    },
    {
      name: 'deleteGoal',
      description: 'Delete a goal. Use when user asks to remove, delete, or cancel a goal. Requires the goal ID.',
      schema: DeleteGoalSchema,
      handler: withErrorHandling('deleteGoal', deleteGoal),
    },
    {
      name: 'deleteAllGoals',
      description: 'Delete all goals (with optional filters). Use when user asks to remove, delete, or clear all goals. Requires confirmation. Can filter by status or category.',
      schema: DeleteAllGoalsSchema,
      handler: withErrorHandling('deleteAllGoals', deleteAllGoals),
    },
    {
      name: 'updateAllGoals',
      description: 'Update multiple goals at once. Use when user asks to update all goals, bulk update goals, or modify multiple goals. Can filter by status, category, or pillar.',
      schema: UpdateAllGoalsSchema,
      handler: withErrorHandling('updateAllGoals', updateAllGoals),
    },
  ];
}
