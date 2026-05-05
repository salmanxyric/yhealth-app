import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';

// --- Schemas ---

const GetUserActivePlansSchema = z.object({});

const GetUserPlansSchema = z.object({
  status: z.string().optional().describe('Filter by status: active, completed, paused, archived, draft'),
  goalCategory: z.string().optional().describe('Filter by goal category'),
  startDate: z.string().optional().describe('Filter plans starting from this date (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('Filter plans ending by this date (YYYY-MM-DD)'),
});

const GetUserPlanByIdSchema = z.object({
  planId: z.string().describe('Plan ID to retrieve (required)'),
});

const GetUserPlanByNameSchema = z.object({
  name: z.string().describe('Plan name to search for (case-insensitive)'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const CreateUserPlanSchema = z.object({
  goalId: z.string().describe('Goal ID this plan is for (required)'),
  name: z.string().describe('Plan name (required)'),
  description: z.string().optional().describe('Plan description'),
  pillar: z.string().optional().describe('Health pillar: fitness, nutrition, sleep, etc.'),
  goalCategory: z.string().optional().describe('Goal category'),
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  durationWeeks: z.number().optional().describe('Plan duration in weeks'),
  activities: z.record(z.any()).optional().describe('Activities JSON structure'),
  weeklyFocuses: z.array(z.any()).optional().describe('Weekly focuses array'),
});

const UpdateUserPlanSchema = z.object({
  planId: z.string().describe('Plan ID (required)'),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional().describe('Status: active, completed, paused, archived, draft'),
  currentWeek: z.number().optional(),
  overallProgress: z.number().optional(),
  activities: z.record(z.any()).optional(),
  weeklyFocuses: z.array(z.any()).optional(),
});

const DeleteUserPlanSchema = z.object({
  planId: z.string().describe('Plan ID to delete (required)'),
});

const DeleteAllUserPlansSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  status: z.string().optional().describe('Filter by status'),
});

const UpdateAllUserPlansSchema = z.object({
  updates: z.object({
    status: z.string().optional(),
    currentWeek: z.number().optional(),
    overallProgress: z.number().optional(),
  }),
  filter: z.object({
    status: z.string().optional(),
    goalCategory: z.string().optional(),
  }).optional(),
});

// --- Implementations ---

async function getUserActivePlans(userId: string): Promise<string> {
  const [workoutResult, dietResult, generalResult] = await Promise.all([
    query<{ id: string; name: string; status: string; created_at: Date }>(
      `SELECT id, name, status, created_at FROM workout_plans
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    ),
    query<{ id: string; name: string; status: string; created_at: Date }>(
      `SELECT id, name, status, created_at FROM diet_plans
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    ),
    query<{ id: string; name: string; status: string; created_at: Date }>(
      `SELECT id, name, status, created_at FROM user_plans
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    ),
  ]);

  const activePlans = {
    workoutPlan: workoutResult.rows.length > 0 ? {
      id: workoutResult.rows[0].id,
      name: workoutResult.rows[0].name,
      status: workoutResult.rows[0].status,
      createdAt: workoutResult.rows[0].created_at,
    } : null,
    dietPlan: dietResult.rows.length > 0 ? {
      id: dietResult.rows[0].id,
      name: dietResult.rows[0].name,
      status: dietResult.rows[0].status,
      createdAt: dietResult.rows[0].created_at,
    } : null,
    generalPlan: generalResult.rows.length > 0 ? {
      id: generalResult.rows[0].id,
      name: generalResult.rows[0].name,
      status: generalResult.rows[0].status,
      createdAt: generalResult.rows[0].created_at,
    } : null,
  };

  return JSON.stringify(activePlans, null, 2);
}

async function getUserPlans(userId: string, params?: z.infer<typeof GetUserPlansSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM user_plans WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params?.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }

  if (params?.goalCategory) {
    sqlQuery += ` AND goal_category = $${paramIndex}`;
    queryParams.push(params.goalCategory);
    paramIndex++;
  }

  if (params?.startDate) {
    sqlQuery += ` AND start_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params?.endDate) {
    sqlQuery += ` AND end_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No plans found', plans: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    goalId: row.goal_id,
    name: row.name,
    description: row.description,
    pillar: row.pillar,
    goalCategory: row.goal_category,
    startDate: row.start_date,
    endDate: row.end_date,
    durationWeeks: row.duration_weeks,
    currentWeek: row.current_week,
    status: row.status,
    overallProgress: row.overall_progress,
    activities: row.activities,
  }));

  return JSON.stringify({ plans: formatted, count: formatted.length }, null, 2);
}

async function getUserPlanById(userId: string, params: z.infer<typeof GetUserPlanByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM user_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Plan not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    goalId: row.goal_id,
    name: row.name,
    description: row.description,
    pillar: row.pillar,
    goalCategory: row.goal_category,
    startDate: row.start_date,
    endDate: row.end_date,
    durationWeeks: row.duration_weeks,
    currentWeek: row.current_week,
    status: row.status,
    overallProgress: row.overall_progress,
    activities: row.activities,
    weeklyFocuses: row.weekly_focuses,
  };

  return JSON.stringify({ success: true, plan: formatted }, null, 2);
}

async function getUserPlanByName(userId: string, params: z.infer<typeof GetUserPlanByNameSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM user_plans WHERE user_id = $1`;
  const queryParams: string[] = [userId];

  if (params.exactMatch) {
    sqlQuery += ` AND LOWER(name) = LOWER($2)`;
    queryParams.push(params.name);
  } else {
    sqlQuery += ` AND LOWER(name) LIKE LOWER($2)`;
    queryParams.push(`%${params.name}%`);
  }

  sqlQuery += ` ORDER BY created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No plans found', plans: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    goalCategory: row.goal_category,
    currentWeek: row.current_week,
    overallProgress: row.overall_progress,
  }));

  return JSON.stringify({ plans: formatted, count: formatted.length }, null, 2);
}

async function createUserPlan(userId: string, params: z.infer<typeof CreateUserPlanSchema>): Promise<string> {
  // Verify goal belongs to user
  const goalCheck = await query(
    `SELECT id FROM user_goals WHERE id = $1 AND user_id = $2`,
    [params.goalId, userId]
  );

  if (goalCheck.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Goal not found or access denied' });
  }

  const startDate = params.startDate || new Date().toISOString().split('T')[0];
  const durationWeeks = params.durationWeeks || 4;
  const endDate = params.endDate || new Date(Date.now() + durationWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const result = await query<{ id: string }>(
    `INSERT INTO user_plans (
      user_id, goal_id, name, description, pillar, goal_category,
      start_date, end_date, duration_weeks, current_week, status,
      activities, weekly_focuses
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id`,
    [
      userId,
      params.goalId,
      params.name,
      params.description || '',
      params.pillar || 'fitness',
      params.goalCategory || 'overall_optimization',
      startDate,
      endDate,
      durationWeeks,
      1,
      'draft',
      params.activities ? JSON.stringify(params.activities) : '[]',
      params.weeklyFocuses ? JSON.stringify(params.weeklyFocuses) : '[]',
    ]
  );

  // Enqueue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'user_plan',
    sourceId: result.rows[0].id,
    operation: 'create',
    priority: JobPriorities.CRITICAL,
  }).catch((_err) => {
    // Non-critical: log and continue
  });

  return JSON.stringify({
    success: true,
    message: 'Plan created successfully',
    data: { id: result.rows[0].id, name: params.name },
  });
}

async function updateUserPlan(userId: string, params: z.infer<typeof UpdateUserPlanSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Plan not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    status: 'status',
    currentWeek: 'current_week',
    overallProgress: 'overall_progress',
  };

  const setClauses: string[] = [];
  const values: (string | number | object)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'planId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      if (key === 'activities' || key === 'weeklyFocuses') {
        setClauses.push(`${key === 'activities' ? 'activities' : 'weekly_focuses'} = $${paramIndex}`);
        values.push(JSON.stringify(value));
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
    `UPDATE user_plans SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.planId, userId]
  );

  // Enqueue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'user_plan',
    sourceId: params.planId,
    operation: 'update',
    priority: JobPriorities.CRITICAL,
  }).catch((_err) => {
    // Non-critical: log and continue
  });

  return JSON.stringify({
    success: true,
    message: 'Plan updated successfully',
  });
}

async function deleteUserPlan(userId: string, params: z.infer<typeof DeleteUserPlanSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Plan not found or access denied' });
  }

  // Enqueue embedding deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'user_plan',
    sourceId: params.planId,
    operation: 'delete',
    priority: JobPriorities.CRITICAL,
  }).catch((_err) => {
    // Non-critical: log and continue
  });

  await query(
    `DELETE FROM user_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Plan deleted successfully',
  });
}

async function deleteAllUserPlans(userId: string, params: z.infer<typeof DeleteAllUserPlansSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all plans.'
    });
  }

  let sqlQuery = `DELETE FROM user_plans WHERE user_id = $1`;
  const queryParams: string[] = [userId];
  let paramIndex = 2;

  if (params.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} plan(s)`,
    deletedCount: result.rowCount || 0,
  });
}

async function updateAllUserPlans(userId: string, params: z.infer<typeof UpdateAllUserPlansSchema>): Promise<string> {
  let sqlQuery = `UPDATE user_plans SET `;
  const setClauses: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (params.updates.status !== undefined) {
    setClauses.push(`status = $${paramIndex}`);
    values.push(params.updates.status);
    paramIndex++;
  }

  if (params.updates.currentWeek !== undefined) {
    setClauses.push(`current_week = $${paramIndex}`);
    values.push(params.updates.currentWeek);
    paramIndex++;
  }

  if (params.updates.overallProgress !== undefined) {
    setClauses.push(`overall_progress = $${paramIndex}`);
    values.push(params.updates.overallProgress);
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
    if (params.filter.status) {
      sqlQuery += ` AND status = $${paramIndex}`;
      values.push(params.filter.status);
      paramIndex++;
    }
    if (params.filter.goalCategory) {
      sqlQuery += ` AND goal_category = $${paramIndex}`;
      values.push(params.filter.goalCategory);
      paramIndex++;
    }
  }

  const result = await query(sqlQuery, values);

  return JSON.stringify({
    success: true,
    message: `Updated ${result.rowCount || 0} plan(s)`,
    updatedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerPlansTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserActivePlans',
      description: "Get all of the user's currently active plans (workout, diet, and general plans). ALWAYS use this tool when user asks about their current plans, active routines, or what they're working on. This provides a complete picture of their active fitness and nutrition programs.",
      schema: GetUserActivePlansSchema,
      handler: withErrorHandling('getUserActivePlans', (uid) => getUserActivePlans(uid)),
    },
    {
      name: 'getUserPlans',
      description: 'Get user plans. Use when user asks about their plans, active plans, or plan progress.',
      schema: GetUserPlansSchema,
      handler: withErrorHandling('getUserPlans', (uid, params) => getUserPlans(uid, params)),
    },
    {
      name: 'getUserPlanById',
      description: 'Get a specific plan by ID. Use when user asks about a particular plan.',
      schema: GetUserPlanByIdSchema,
      handler: withErrorHandling('getUserPlanById', (uid, params) => getUserPlanById(uid, params)),
    },
    {
      name: 'getUserPlanByName',
      description: 'Get plans by searching for the plan name. Use when user asks about a plan by its name.',
      schema: GetUserPlanByNameSchema,
      handler: withErrorHandling('getUserPlanByName', (uid, params) => getUserPlanByName(uid, params)),
    },
    {
      name: 'createUserPlan',
      description: 'Create a new user plan. Use when user asks to create, add, or make a new plan.',
      schema: CreateUserPlanSchema,
      handler: withErrorHandling('createUserPlan', (uid, params) => createUserPlan(uid, params)),
    },
    {
      name: 'updateUserPlan',
      description: 'Update an existing user plan. Use when user asks to modify, change, or update a plan.',
      schema: UpdateUserPlanSchema,
      handler: withErrorHandling('updateUserPlan', (uid, params) => updateUserPlan(uid, params)),
    },
    {
      name: 'deleteUserPlan',
      description: 'Delete a user plan. Use when user asks to remove, delete, or cancel a plan.',
      schema: DeleteUserPlanSchema,
      handler: withErrorHandling('deleteUserPlan', (uid, params) => deleteUserPlan(uid, params)),
    },
    {
      name: 'deleteAllUserPlans',
      description: 'Delete all user plans (with optional filters). Use when user asks to remove all plans. Requires confirmation.',
      schema: DeleteAllUserPlansSchema,
      handler: withErrorHandling('deleteAllUserPlans', (uid, params) => deleteAllUserPlans(uid, params)),
    },
    {
      name: 'updateAllUserPlans',
      description: 'Update multiple plans at once. Use when user asks to bulk update plans.',
      schema: UpdateAllUserPlansSchema,
      handler: withErrorHandling('updateAllUserPlans', (uid, params) => updateAllUserPlans(uid, params)),
    },
  ];
}
