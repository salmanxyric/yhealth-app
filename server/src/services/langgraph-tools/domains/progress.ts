import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';

// --- Schemas ---

const GetUserProgressSchema = z.object({
  type: z.string().optional().describe('Filter by record type: weight, measurements, body_fat, etc.'),
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
});

const CreateProgressRecordSchema = z.object({
  recordDate: z.string().describe('Record date in ISO format (YYYY-MM-DD) (required)'),
  recordType: z.string().describe('Record type: weight, measurement, photo, body_composition (required)'),
  value: z.record(z.any()).describe('Value as JSON object (required)'),
  photoKeys: z.array(z.string()).optional().describe('Array of photo storage keys'),
  source: z.string().optional().describe('Source: manual, smart_scale, integration, ai_analysis'),
  sourceDevice: z.string().optional().describe('Source device name'),
  notes: z.string().optional().describe('Notes'),
});

const UpdateProgressRecordSchema = z.object({
  recordId: z.string().describe('Record ID (required)'),
  value: z.record(z.any()).optional().describe('Updated value JSON'),
  photoKeys: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const GetProgressRecordByIdSchema = z.object({
  recordId: z.string().describe('Progress record ID to retrieve (required)'),
});

const GetProgressRecordByDateSchema = z.object({
  date: z.string().describe('Date in ISO format (YYYY-MM-DD) (required)'),
  recordType: z.string().optional().describe('Filter by record type'),
});

const DeleteProgressRecordSchema = z.object({
  recordId: z.string().describe('Progress record ID to delete (required)'),
});

const DeleteAllProgressRecordsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  recordType: z.string().optional().describe('Filter by record type'),
  startDate: z.string().optional().describe('Delete records from this date'),
  endDate: z.string().optional().describe('Delete records up to this date'),
});

const UpdateAllProgressRecordsSchema = z.object({
  updates: z.object({
    notes: z.string().optional(),
  }),
  filter: z.object({
    recordType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
});

// --- Implementations ---

function buildProgressCharts(
  records: { recordType: string; recordDate: string; value: any }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (records.length === 0) return artifacts;

  const byType = new Map<string, typeof records>();
  for (const r of records) {
    const type = r.recordType || 'unknown';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(r);
  }

  const sortByDate = (items: typeof records) =>
    [...items].sort((a, b) => String(a.recordDate || '').localeCompare(String(b.recordDate || '')));

  const weightRecords = byType.get('weight') || [];
  if (weightRecords.length > 1) {
    const sorted = sortByDate(weightRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Weight Trend',
      data: sorted.map((r) => ({
        date: String(r.recordDate).slice(0, 10),
        weight: typeof r.value === 'object' ? (r.value?.weight ?? r.value?.value ?? 0) : (parseFloat(String(r.value)) || 0),
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'weight', label: 'Weight', color: '#3b82f6' }],
      yAxisLabel: 'Weight',
      insight: (() => {
        const vals = sorted.map((r) => typeof r.value === 'object' ? (r.value?.weight ?? r.value?.value ?? 0) : (parseFloat(String(r.value)) || 0));
        const first = vals[0];
        const last = vals[vals.length - 1];
        const diff = last - first;
        if (diff > 0) return `Up ${diff.toFixed(1)} since first record.`;
        if (diff < 0) return `Down ${Math.abs(diff).toFixed(1)} since first record.`;
        return 'Weight stable.';
      })(),
    });
  }

  const bodyCompRecords = byType.get('body_composition') || byType.get('body_fat') || [];
  if (bodyCompRecords.length > 1) {
    const sorted = sortByDate(bodyCompRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'area',
      title: 'Body Composition Trend',
      data: sorted.map((r) => ({
        date: String(r.recordDate).slice(0, 10),
        bodyFat: typeof r.value === 'object' ? (r.value?.bodyFat ?? r.value?.body_fat ?? r.value?.value ?? 0) : (parseFloat(String(r.value)) || 0),
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'bodyFat', label: 'Body Fat %', color: '#f59e0b' }],
      yAxisLabel: 'Body Fat %',
    });
  }

  return artifacts;
}

async function getUserProgress(userId: string, params?: z.infer<typeof GetUserProgressSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM progress_records WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];

  if (params?.type) {
    sqlQuery += ` AND record_type = $2`;
    queryParams.push(params.type);
  }

  if (params?.startDate) {
    const paramIndex = queryParams.length + 1;
    sqlQuery += ` AND record_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
  }

  if (params?.endDate) {
    const paramIndex = queryParams.length + 1;
    sqlQuery += ` AND record_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
  }

  sqlQuery += ` ORDER BY record_date DESC LIMIT 50`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No progress records found', records: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    recordType: row.record_type,
    recordDate: row.record_date,
    value: row.value,
  }));

  const artifacts = buildProgressCharts(formatted);
  return JSON.stringify({ records: formatted, count: formatted.length, artifacts }, null, 2);
}

async function getProgressRecordById(userId: string, params: z.infer<typeof GetProgressRecordByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM progress_records WHERE id = $1 AND user_id = $2`,
    [params.recordId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Progress record not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    recordDate: row.record_date,
    recordType: row.record_type,
    value: row.value,
    photoKeys: row.photo_keys || [],
    source: row.source,
    sourceDevice: row.source_device,
    notes: row.notes,
  };

  return JSON.stringify({ success: true, record: formatted }, null, 2);
}

async function getProgressRecordByDate(userId: string, params: z.infer<typeof GetProgressRecordByDateSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM progress_records WHERE user_id = $1 AND record_date = $2`;
  const queryParams: (string | Date)[] = [userId, params.date];
  let paramIndex = 3;

  if (params.recordType) {
    sqlQuery += ` AND record_type = $${paramIndex}`;
    queryParams.push(params.recordType);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY record_date DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No progress records found for this date', records: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    recordType: row.record_type,
    recordDate: row.record_date,
    value: row.value,
    source: row.source,
  }));

  return JSON.stringify({ records: formatted, count: formatted.length }, null, 2);
}

async function createProgressRecord(userId: string, params: z.infer<typeof CreateProgressRecordSchema>): Promise<string> {
  // Check if record already exists for this date and type
  const existing = await query(
    `SELECT id FROM progress_records WHERE user_id = $1 AND record_date = $2 AND record_type = $3`,
    [userId, params.recordDate, params.recordType]
  );

  let result;
  if (existing.rows.length > 0) {
    // Update existing
    result = await query<{ id: string }>(
      `UPDATE progress_records SET value = $1, photo_keys = $2, source = $3, source_device = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id`,
      [
        JSON.stringify(params.value),
        params.photoKeys || [],
        params.source || 'manual',
        params.sourceDevice || null,
        params.notes || null,
        existing.rows[0].id,
      ]
    );
  } else {
    // Create new
    result = await query<{ id: string }>(
      `INSERT INTO progress_records (
        user_id, record_date, record_type, value, photo_keys, source, source_device, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        userId,
        params.recordDate,
        params.recordType,
        JSON.stringify(params.value),
        params.photoKeys || [],
        params.source || 'manual',
        params.sourceDevice || null,
        params.notes || null,
      ]
    );
  }

  // Enqueue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'progress_record',
    sourceId: result.rows[0].id,
    operation: existing.rows.length > 0 ? 'update' : 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((_err) => {
    // Non-critical: log and continue
  });

  return JSON.stringify({
    success: true,
    message: existing.rows.length > 0 ? 'Progress record updated successfully' : 'Progress record created successfully',
    data: { id: result.rows[0].id },
  });
}

async function updateProgressRecord(userId: string, params: z.infer<typeof UpdateProgressRecordSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM progress_records WHERE id = $1 AND user_id = $2`,
    [params.recordId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Progress record not found or access denied' });
  }

  const setClauses: string[] = [];
  const values: (string | object | string[])[] = [];
  let paramIndex = 1;

  if (params.value !== undefined) {
    setClauses.push(`value = $${paramIndex}`);
    values.push(JSON.stringify(params.value));
    paramIndex++;
  }

  if (params.photoKeys !== undefined) {
    setClauses.push(`photo_keys = $${paramIndex}`);
    values.push(params.photoKeys);
    paramIndex++;
  }

  if (params.notes !== undefined) {
    setClauses.push(`notes = $${paramIndex}`);
    values.push(params.notes);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE progress_records SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.recordId, userId]
  );

  // Enqueue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'progress_record',
    sourceId: params.recordId,
    operation: 'update',
    priority: JobPriorities.MEDIUM,
  }).catch((_err) => {
    // Non-critical: log and continue
  });

  return JSON.stringify({
    success: true,
    message: 'Progress record updated successfully',
  });
}

async function deleteProgressRecord(userId: string, params: z.infer<typeof DeleteProgressRecordSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM progress_records WHERE id = $1 AND user_id = $2`,
    [params.recordId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Progress record not found or access denied' });
  }

  // Enqueue embedding deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'progress_record',
    sourceId: params.recordId,
    operation: 'delete',
    priority: JobPriorities.MEDIUM,
  }).catch((_err) => {
    // Non-critical: log and continue
  });

  await query(
    `DELETE FROM progress_records WHERE id = $1 AND user_id = $2`,
    [params.recordId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Progress record deleted successfully',
  });
}

async function deleteAllProgressRecords(userId: string, params: z.infer<typeof DeleteAllProgressRecordsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all progress records.'
    });
  }

  let sqlQuery = `DELETE FROM progress_records WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params.recordType) {
    sqlQuery += ` AND record_type = $${paramIndex}`;
    queryParams.push(params.recordType);
    paramIndex++;
  }

  if (params.startDate) {
    sqlQuery += ` AND record_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params.endDate) {
    sqlQuery += ` AND record_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} progress record(s)`,
    deletedCount: result.rowCount || 0,
  });
}

async function updateAllProgressRecords(userId: string, params: z.infer<typeof UpdateAllProgressRecordsSchema>): Promise<string> {
  let sqlQuery = `UPDATE progress_records SET `;
  const setClauses: string[] = [];
  const values: string[] = [];
  let paramIndex = 1;

  if (params.updates.notes !== undefined) {
    setClauses.push(`notes = $${paramIndex}`);
    values.push(params.updates.notes);
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
    if (params.filter.recordType) {
      sqlQuery += ` AND record_type = $${paramIndex}`;
      values.push(params.filter.recordType);
      paramIndex++;
    }
    if (params.filter.startDate) {
      sqlQuery += ` AND record_date >= $${paramIndex}`;
      values.push(params.filter.startDate);
      paramIndex++;
    }
    if (params.filter.endDate) {
      sqlQuery += ` AND record_date <= $${paramIndex}`;
      values.push(params.filter.endDate);
      paramIndex++;
    }
  }

  const result = await query(sqlQuery, values);

  return JSON.stringify({
    success: true,
    message: `Updated ${result.rowCount || 0} progress record(s)`,
    updatedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerProgressTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserProgress',
      description: "Get the user's progress records (weight, measurements, etc.). Use when user asks about their progress, weight history, body measurements, or health metrics over time.",
      schema: GetUserProgressSchema,
      handler: withErrorHandling('getUserProgress', (uid, params) => getUserProgress(uid, params)),
    },
    {
      name: 'getProgressRecordById',
      description: 'Get a specific progress record by ID. Use when user asks about a particular progress entry.',
      schema: GetProgressRecordByIdSchema,
      handler: withErrorHandling('getProgressRecordById', (uid, params) => getProgressRecordById(uid, params)),
    },
    {
      name: 'getProgressRecordByDate',
      description: 'Get progress records for a specific date. Use when user asks about progress on a particular day.',
      schema: GetProgressRecordByDateSchema,
      handler: withErrorHandling('getProgressRecordByDate', (uid, params) => getProgressRecordByDate(uid, params)),
    },
    {
      name: 'createProgressRecord',
      description: 'Create a progress record. Use when user wants to log weight, measurements, or other progress data.',
      schema: CreateProgressRecordSchema,
      handler: withErrorHandling('createProgressRecord', (uid, params) => createProgressRecord(uid, params)),
    },
    {
      name: 'updateProgressRecord',
      description: 'Update a progress record. Use when user asks to modify or correct progress data.',
      schema: UpdateProgressRecordSchema,
      handler: withErrorHandling('updateProgressRecord', (uid, params) => updateProgressRecord(uid, params)),
    },
    {
      name: 'deleteProgressRecord',
      description: 'Delete a progress record. Use when user asks to remove or delete progress data.',
      schema: DeleteProgressRecordSchema,
      handler: withErrorHandling('deleteProgressRecord', (uid, params) => deleteProgressRecord(uid, params)),
    },
    {
      name: 'deleteAllProgressRecords',
      description: 'Delete all progress records (with optional filters). Use when user asks to clear all progress data. Requires confirmation.',
      schema: DeleteAllProgressRecordsSchema,
      handler: withErrorHandling('deleteAllProgressRecords', (uid, params) => deleteAllProgressRecords(uid, params)),
    },
    {
      name: 'updateAllProgressRecords',
      description: 'Update multiple progress records at once. Use when user asks to bulk update progress records.',
      schema: UpdateAllProgressRecordsSchema,
      handler: withErrorHandling('updateAllProgressRecords', (uid, params) => updateAllProgressRecords(uid, params)),
    },
  ];
}
