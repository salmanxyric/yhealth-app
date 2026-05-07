import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetWaterIntakeLogsSchema = z.object({
  date: z.string().optional().describe('Specific date in ISO format (YYYY-MM-DD)'),
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
});

const GetWaterIntakeLogByDateSchema = z.object({
  date: z.string().describe('Date in ISO format (YYYY-MM-DD) (required)'),
});

const CreateWaterIntakeLogSchema = z.object({
  logDate: z.string().optional().describe('Log date in ISO format (YYYY-MM-DD), defaults to today'),
  glassesConsumed: z.number().optional().describe('Number of glasses consumed (250ml each)'),
  mlConsumed: z.number().optional().describe('Milliliters consumed'),
  targetGlasses: z.number().optional().describe('Target glasses for the day'),
  targetMl: z.number().optional().describe('Target milliliters for the day'),
  entries: z.array(z.any()).optional().describe('Individual water entry timeline'),
});

const UpdateWaterIntakeLogSchema = z.object({
  logDate: z.string().describe('Log date in ISO format (YYYY-MM-DD) (required)'),
  glassesConsumed: z.number().optional(),
  mlConsumed: z.number().optional(),
  targetGlasses: z.number().optional(),
  targetMl: z.number().optional(),
  entries: z.array(z.any()).optional(),
});

const AddWaterEntrySchema = z.object({
  date: z.string().optional().describe('Date in ISO format (YYYY-MM-DD), defaults to today'),
  amountMl: z.number().describe('Amount of water in milliliters (required)'),
  type: z.string().optional().describe('Water type: water, sparkling, etc.'),
  time: z.string().optional().describe('Time in HH:MM format'),
});

const DeleteWaterIntakeLogSchema = z.object({
  logDate: z.string().describe('Log date in ISO format (YYYY-MM-DD) to delete (required)'),
});

const DeleteAllWaterIntakeLogsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  startDate: z.string().optional().describe('Delete logs from this date'),
  endDate: z.string().optional().describe('Delete logs up to this date'),
});

// --- Implementations ---

function buildWaterCharts(
  logs: { logDate: string; glassesConsumed: number; mlConsumed: number; targetGlasses: number; targetMl: number; goalAchieved: boolean }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (logs.length === 0) return artifacts;

  const sorted = [...logs].sort((a, b) => String(a.logDate || '').localeCompare(String(b.logDate || '')));

  artifacts.push({
    type: 'chart', chartType: 'comparison_bar', title: 'Water Intake vs Goal',
    data: sorted.map((log) => ({
      date: String(log.logDate || '').slice(0, 10),
      consumed: log.glassesConsumed || 0,
      target: log.targetGlasses || 8,
    })),
    xAxisKey: 'date',
    dataKeys: [
      { key: 'consumed', label: 'Consumed', color: '#06b6d4' },
      { key: 'target', label: 'Target', color: '#3b82f6' },
    ],
    yAxisLabel: 'Glasses',
    insight: `Goal achieved on ${sorted.filter((l) => l.goalAchieved).length} of ${sorted.length} days.`,
  });

  if (sorted.length > 1) {
    artifacts.push({
      type: 'chart', chartType: 'area', title: 'Water Intake Trend',
      data: sorted.map((log) => ({
        date: String(log.logDate || '').slice(0, 10),
        ml: log.mlConsumed || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'ml', label: 'mL Consumed', color: '#06b6d4' }],
      yAxisLabel: 'mL',
    });
  }

  return artifacts;
}

async function getWaterIntakeLogs(userId: string, params?: z.infer<typeof GetWaterIntakeLogsSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM water_intake_logs WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params?.date) {
    sqlQuery += ` AND log_date = $${paramIndex}`;
    queryParams.push(params.date);
    paramIndex++;
  } else if (params?.startDate && params?.endDate) {
    sqlQuery += ` AND log_date >= $${paramIndex} AND log_date <= $${paramIndex + 1}`;
    queryParams.push(params.startDate, params.endDate);
    paramIndex += 2;
  } else if (!params?.date && !params?.startDate) {
    // Default to today
    sqlQuery += ` AND log_date = CURRENT_DATE`;
  }

  sqlQuery += ` ORDER BY log_date DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No water intake logs found', logs: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    logDate: row.log_date,
    glassesConsumed: row.glasses_consumed,
    mlConsumed: row.ml_consumed,
    targetGlasses: row.target_glasses,
    targetMl: row.target_ml,
    goalAchieved: row.goal_achieved,
    entries: row.entries || [],
  }));

  const artifacts = buildWaterCharts(formatted);
  return JSON.stringify({ logs: formatted, count: formatted.length, artifacts }, null, 2);
}

async function getWaterIntakeLogByDate(userId: string, params: z.infer<typeof GetWaterIntakeLogByDateSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, params.date]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No water intake log found for this date', log: null });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    logDate: row.log_date,
    glassesConsumed: row.glasses_consumed,
    mlConsumed: row.ml_consumed,
    targetGlasses: row.target_glasses,
    targetMl: row.target_ml,
    goalAchieved: row.goal_achieved,
    entries: row.entries || [],
  };

  return JSON.stringify({ log: formatted }, null, 2);
}

async function createWaterIntakeLog(userId: string, params: z.infer<typeof CreateWaterIntakeLogSchema>): Promise<string> {
  const logDate = params.logDate || new Date().toISOString().split('T')[0];

  // Check if log already exists
  const existing = await query(
    `SELECT id FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, logDate]
  );

  let result;
  if (existing.rows.length > 0) {
    // Update existing
    const setClauses: string[] = [];
    const values: (number | object | string)[] = [];
    let paramIndex = 1;

    if (params.glassesConsumed !== undefined) {
      setClauses.push(`glasses_consumed = $${paramIndex}`);
      values.push(params.glassesConsumed);
      paramIndex++;
    }

    if (params.mlConsumed !== undefined) {
      setClauses.push(`ml_consumed = $${paramIndex}`);
      values.push(params.mlConsumed);
      paramIndex++;
    }

    if (params.targetGlasses !== undefined) {
      setClauses.push(`target_glasses = $${paramIndex}`);
      values.push(params.targetGlasses);
      paramIndex++;
    }

    if (params.targetMl !== undefined) {
      setClauses.push(`target_ml = $${paramIndex}`);
      values.push(params.targetMl);
      paramIndex++;
    }

    if (params.entries !== undefined) {
      setClauses.push(`entries = $${paramIndex}`);
      values.push(JSON.stringify(params.entries));
      paramIndex++;
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    result = await query<{ id: string }>(
      `UPDATE water_intake_logs SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id`,
      [...values, existing.rows[0].id]
    );
  } else {
    // Create new
    result = await query<{ id: string }>(
      `INSERT INTO water_intake_logs (
        user_id, log_date, glasses_consumed, ml_consumed, target_glasses, target_ml, entries
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        userId,
        logDate,
        params.glassesConsumed || 0,
        params.mlConsumed || 0,
        params.targetGlasses || 8,
        params.targetMl || 2000,
        params.entries ? JSON.stringify(params.entries) : '[]',
      ]
    );
  }

  return JSON.stringify({
    success: true,
    message: existing.rows.length > 0 ? 'Water intake log updated successfully' : 'Water intake log created successfully',
    data: { id: result.rows[0].id },
  });
}

async function updateWaterIntakeLog(userId: string, params: z.infer<typeof UpdateWaterIntakeLogSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, params.logDate]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Water intake log not found' });
  }

  const setClauses: string[] = [];
  const values: (number | object | string)[] = [];
  let paramIndex = 1;

  if (params.glassesConsumed !== undefined) {
    setClauses.push(`glasses_consumed = $${paramIndex}`);
    values.push(params.glassesConsumed);
    paramIndex++;
  }

  if (params.mlConsumed !== undefined) {
    setClauses.push(`ml_consumed = $${paramIndex}`);
    values.push(params.mlConsumed);
    paramIndex++;
  }

  if (params.targetGlasses !== undefined) {
    setClauses.push(`target_glasses = $${paramIndex}`);
    values.push(params.targetGlasses);
    paramIndex++;
  }

  if (params.targetMl !== undefined) {
    setClauses.push(`target_ml = $${paramIndex}`);
    values.push(params.targetMl);
    paramIndex++;
  }

  if (params.entries !== undefined) {
    setClauses.push(`entries = $${paramIndex}`);
    values.push(JSON.stringify(params.entries) as string);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE water_intake_logs SET ${setClauses.join(', ')}
     WHERE user_id = $${paramIndex} AND log_date = $${paramIndex + 1}`,
    [...values, userId, params.logDate]
  );

  return JSON.stringify({
    success: true,
    message: 'Water intake log updated successfully',
  });
}

async function addWaterEntry(userId: string, params: z.infer<typeof AddWaterEntrySchema>): Promise<string> {
  const date = params.date || new Date().toISOString().split('T')[0];
  const amountMl = params.amountMl;
  const time = params.time || new Date().toTimeString().slice(0, 5);

  // Get or create log for the date
  let logResult = await query(
    `SELECT * FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, date]
  );

  if (logResult.rows.length === 0) {
    // Create new log
    await query(
      `INSERT INTO water_intake_logs (user_id, log_date, glasses_consumed, ml_consumed, entries)
       VALUES ($1, $2, 0, 0, '[]')`,
      [userId, date]
    );
    logResult = await query(
      `SELECT * FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
      [userId, date]
    );
  }

  const log = logResult.rows[0];
  const entries = log.entries || [];
  const newEntry = {
    time,
    amountMl,
    type: params.type || 'water',
  };
  entries.push(newEntry);

  const newMlConsumed = (log.ml_consumed || 0) + amountMl;
  const newGlassesConsumed = Math.floor(newMlConsumed / 250);

  await query(
    `UPDATE water_intake_logs
     SET ml_consumed = $1, glasses_consumed = $2, entries = $3, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $4 AND log_date = $5`,
    [newMlConsumed, newGlassesConsumed, JSON.stringify(entries), userId, date]
  );

  return JSON.stringify({
    success: true,
    message: 'Water entry added successfully',
    data: { mlConsumed: newMlConsumed, glassesConsumed: newGlassesConsumed },
  });
}

async function deleteWaterIntakeLog(userId: string, params: z.infer<typeof DeleteWaterIntakeLogSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, params.logDate]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Water intake log not found' });
  }

  await query(
    `DELETE FROM water_intake_logs WHERE user_id = $1 AND log_date = $2`,
    [userId, params.logDate]
  );

  return JSON.stringify({
    success: true,
    message: 'Water intake log deleted successfully',
  });
}

async function deleteAllWaterIntakeLogs(userId: string, params: z.infer<typeof DeleteAllWaterIntakeLogsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all water intake logs.'
    });
  }

  let sqlQuery = `DELETE FROM water_intake_logs WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params.startDate) {
    sqlQuery += ` AND log_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params.endDate) {
    sqlQuery += ` AND log_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} water intake log(s)`,
    deletedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerWaterIntakeTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getWaterIntakeLogs',
      description: 'Get water intake logs. Use when user asks about their water consumption, hydration, or water intake.',
      schema: GetWaterIntakeLogsSchema,
      handler: withErrorHandling('getWaterIntakeLogs', async (uid, params) =>
        getWaterIntakeLogs(uid, params),
      ),
    },
    {
      name: 'getWaterIntakeLogByDate',
      description: 'Get water intake log for a specific date. Use when user asks about water intake on a particular day.',
      schema: GetWaterIntakeLogByDateSchema,
      handler: withErrorHandling('getWaterIntakeLogByDate', async (uid, params) =>
        getWaterIntakeLogByDate(uid, params),
      ),
    },
    {
      name: 'createWaterIntakeLog',
      description: 'Create or update a water intake log. Use when user wants to log water consumption.',
      schema: CreateWaterIntakeLogSchema,
      handler: withErrorHandling('createWaterIntakeLog', async (uid, params) =>
        createWaterIntakeLog(uid, params),
      ),
    },
    {
      name: 'updateWaterIntakeLog',
      description: 'Update a water intake log. Use when user asks to modify water intake data.',
      schema: UpdateWaterIntakeLogSchema,
      handler: withErrorHandling('updateWaterIntakeLog', async (uid, params) =>
        updateWaterIntakeLog(uid, params),
      ),
    },
    {
      name: 'addWaterEntry',
      description: "Add a water entry to today's log. Use when user drinks water and wants to log it.",
      schema: AddWaterEntrySchema,
      handler: withErrorHandling('addWaterEntry', async (uid, params) =>
        addWaterEntry(uid, params),
      ),
    },
    {
      name: 'deleteWaterIntakeLog',
      description: 'Delete a water intake log. Use when user asks to remove water intake data for a specific date.',
      schema: DeleteWaterIntakeLogSchema,
      handler: withErrorHandling('deleteWaterIntakeLog', async (uid, params) =>
        deleteWaterIntakeLog(uid, params),
      ),
    },
    {
      name: 'deleteAllWaterIntakeLogs',
      description: 'Delete all water intake logs (with optional filters). Use when user asks to clear all water intake data. Requires confirmation.',
      schema: DeleteAllWaterIntakeLogsSchema,
      handler: withErrorHandling('deleteAllWaterIntakeLogs', async (uid, params) =>
        deleteAllWaterIntakeLogs(uid, params),
      ),
    },
  ];
}
