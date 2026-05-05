import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetScheduledRemindersSchema = z.object({
  reminderType: z.string().optional().describe('Filter by type: meal, workout, water, medication, custom'),
  isEnabled: z.boolean().optional().describe('Filter by enabled status'),
});

const GetScheduledReminderByIdSchema = z.object({
  reminderId: z.string().describe('Reminder ID to retrieve (required)'),
});

const CreateScheduledReminderSchema = z.object({
  reminderType: z.string().describe('Reminder type: meal, workout, water, medication, custom (required)'),
  sourceType: z.string().optional().describe('Source type: diet_plan, workout_plan, manual'),
  sourceId: z.string().optional().describe('Source ID (diet_plan_id or workout_plan_id)'),
  title: z.string().describe('Reminder title (required)'),
  message: z.string().optional().describe('Reminder message'),
  icon: z.string().optional().describe('Icon name or emoji'),
  reminderTime: z.string().describe('Reminder time in HH:MM format (required)'),
  daysOfWeek: z.array(z.number()).optional().describe('Days of week array (0=Sun, 1=Mon, ..., 6=Sat)'),
  timezone: z.string().optional().describe('Timezone string'),
  notificationChannels: z.array(z.string()).optional().describe('Notification channels: push, email, sms'),
  advanceMinutes: z.number().optional().describe('Minutes before scheduled time to send'),
  repeatIfMissed: z.boolean().optional().describe('Repeat if missed'),
  snoozeMinutes: z.number().optional().describe('Snooze duration in minutes'),
  metadata: z.record(z.any()).optional().describe('Metadata JSON'),
});

const UpdateScheduledReminderSchema = z.object({
  reminderId: z.string().describe('Reminder ID (required)'),
  title: z.string().optional(),
  message: z.string().optional(),
  reminderTime: z.string().optional().describe('Reminder time in HH:MM format'),
  daysOfWeek: z.array(z.number()).optional(),
  isEnabled: z.boolean().optional().describe('Enable or disable reminder'),
  notificationChannels: z.array(z.string()).optional(),
  advanceMinutes: z.number().optional(),
  snoozeMinutes: z.number().optional(),
});

const DeleteScheduledReminderSchema = z.object({
  reminderId: z.string().describe('Reminder ID to delete (required)'),
});

const DeleteAllScheduledRemindersSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  reminderType: z.string().optional().describe('Filter by reminder type'),
  isEnabled: z.boolean().optional().describe('Filter by enabled status'),
});

// --- Implementations ---

async function getScheduledReminders(userId: string, params?: z.infer<typeof GetScheduledRemindersSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM scheduled_reminders WHERE user_id = $1`;
  const queryParams: (string | boolean)[] = [userId];
  let paramIndex = 2;

  if (params?.reminderType) {
    sqlQuery += ` AND reminder_type = $${paramIndex}`;
    queryParams.push(params.reminderType);
    paramIndex++;
  }

  if (params?.isEnabled !== undefined) {
    sqlQuery += ` AND is_enabled = $${paramIndex}`;
    queryParams.push(params.isEnabled);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY reminder_time ASC, created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No reminders found', reminders: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    reminderType: row.reminder_type,
    sourceType: row.source_type,
    sourceId: row.source_id,
    title: row.title,
    message: row.message,
    reminderTime: row.reminder_time,
    daysOfWeek: row.days_of_week,
    isEnabled: row.is_enabled,
    nextTriggerAt: row.next_trigger_at,
  }));

  return JSON.stringify({ reminders: formatted, count: formatted.length }, null, 2);
}

async function getScheduledReminderById(userId: string, params: z.infer<typeof GetScheduledReminderByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM scheduled_reminders WHERE id = $1 AND user_id = $2`,
    [params.reminderId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Reminder not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    reminderType: row.reminder_type,
    sourceType: row.source_type,
    sourceId: row.source_id,
    title: row.title,
    message: row.message,
    reminderTime: row.reminder_time,
    daysOfWeek: row.days_of_week,
    timezone: row.timezone,
    notificationChannels: row.notification_channels,
    isEnabled: row.is_enabled,
    nextTriggerAt: row.next_trigger_at,
    metadata: row.metadata,
  };

  return JSON.stringify({ success: true, reminder: formatted }, null, 2);
}

async function createScheduledReminder(userId: string, params: z.infer<typeof CreateScheduledReminderSchema>): Promise<string> {
  // Verify source ownership if sourceId provided
  if (params.sourceId && params.sourceType) {
    if (params.sourceType === 'diet_plan') {
      const check = await query(
        `SELECT id FROM diet_plans WHERE id = $1 AND user_id = $2`,
        [params.sourceId, userId]
      );
      if (check.rows.length === 0) {
        return JSON.stringify({ success: false, error: 'Diet plan not found or access denied' });
      }
    } else if (params.sourceType === 'workout_plan') {
      const check = await query(
        `SELECT id FROM workout_plans WHERE id = $1 AND user_id = $2`,
        [params.sourceId, userId]
      );
      if (check.rows.length === 0) {
        return JSON.stringify({ success: false, error: 'Workout plan not found or access denied' });
      }
    }
  }

  const result = await query<{ id: string }>(
    `INSERT INTO scheduled_reminders (
      user_id, reminder_type, source_type, source_id, title, message, icon,
      reminder_time, days_of_week, timezone, notification_channels,
      advance_minutes, repeat_if_missed, snooze_minutes, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
    [
      userId,
      params.reminderType,
      params.sourceType || null,
      params.sourceId || null,
      params.title,
      params.message || null,
      params.icon || null,
      params.reminderTime,
      params.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      params.timezone || 'UTC',
      params.notificationChannels || ['push'],
      params.advanceMinutes || 0,
      params.repeatIfMissed || false,
      params.snoozeMinutes || 10,
      params.metadata ? JSON.stringify(params.metadata) : '{}',
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Reminder created successfully',
    data: { id: result.rows[0].id },
  });
}

async function updateScheduledReminder(userId: string, params: z.infer<typeof UpdateScheduledReminderSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM scheduled_reminders WHERE id = $1 AND user_id = $2`,
    [params.reminderId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Reminder not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    title: 'title',
    message: 'message',
    reminderTime: 'reminder_time',
    isEnabled: 'is_enabled',
    advanceMinutes: 'advance_minutes',
    snoozeMinutes: 'snooze_minutes',
  };

  const setClauses: string[] = [];
  const values: (string | number | boolean | number[] | string[])[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'reminderId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      if (key === 'daysOfWeek') {
        setClauses.push(`days_of_week = $${paramIndex}`);
        values.push(value as number[]);
      } else if (key === 'notificationChannels') {
        setClauses.push(`notification_channels = $${paramIndex}`);
        values.push(value as string[]);
      } else {
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(value as string | number | boolean);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE scheduled_reminders SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.reminderId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Reminder updated successfully',
  });
}

async function deleteScheduledReminder(userId: string, params: z.infer<typeof DeleteScheduledReminderSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM scheduled_reminders WHERE id = $1 AND user_id = $2`,
    [params.reminderId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Reminder not found or access denied' });
  }

  await query(
    `DELETE FROM scheduled_reminders WHERE id = $1 AND user_id = $2`,
    [params.reminderId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Reminder deleted successfully',
  });
}

async function deleteAllScheduledReminders(userId: string, params: z.infer<typeof DeleteAllScheduledRemindersSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all reminders.'
    });
  }

  let sqlQuery = `DELETE FROM scheduled_reminders WHERE user_id = $1`;
  const queryParams: (string | boolean)[] = [userId];
  let paramIndex = 2;

  if (params.reminderType) {
    sqlQuery += ` AND reminder_type = $${paramIndex}`;
    queryParams.push(params.reminderType);
    paramIndex++;
  }

  if (params.isEnabled !== undefined) {
    sqlQuery += ` AND is_enabled = $${paramIndex}`;
    queryParams.push(params.isEnabled);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} reminder(s)`,
    deletedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerReminderTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getScheduledReminders',
      description: 'Get scheduled reminders. Use when user asks about their reminders, notifications, or scheduled alerts.',
      schema: GetScheduledRemindersSchema,
      handler: withErrorHandling('getScheduledReminders', async (uid, params) =>
        getScheduledReminders(uid, params),
      ),
    },
    {
      name: 'getScheduledReminderById',
      description: 'Get a specific reminder by ID. Use when user asks about a particular reminder.',
      schema: GetScheduledReminderByIdSchema,
      handler: withErrorHandling('getScheduledReminderById', async (uid, params) =>
        getScheduledReminderById(uid, params),
      ),
    },
    {
      name: 'createScheduledReminder',
      description: 'Create a scheduled reminder. Use when user asks to set up a reminder, schedule an alert, or create a notification.',
      schema: CreateScheduledReminderSchema,
      handler: withErrorHandling('createScheduledReminder', async (uid, params) =>
        createScheduledReminder(uid, params),
      ),
    },
    {
      name: 'updateScheduledReminder',
      description: 'Update a scheduled reminder. Use when user asks to modify, enable, disable, or change reminder settings.',
      schema: UpdateScheduledReminderSchema,
      handler: withErrorHandling('updateScheduledReminder', async (uid, params) =>
        updateScheduledReminder(uid, params),
      ),
    },
    {
      name: 'deleteScheduledReminder',
      description: 'Delete a scheduled reminder. Use when user asks to remove, cancel, or delete a reminder.',
      schema: DeleteScheduledReminderSchema,
      handler: withErrorHandling('deleteScheduledReminder', async (uid, params) =>
        deleteScheduledReminder(uid, params),
      ),
    },
    {
      name: 'deleteAllScheduledReminders',
      description: 'Delete all scheduled reminders (with optional filters). Use when user asks to clear all reminders. Requires confirmation.',
      schema: DeleteAllScheduledRemindersSchema,
      handler: withErrorHandling('deleteAllScheduledReminders', async (uid, params) =>
        deleteAllScheduledReminders(uid, params),
      ),
    },
  ];
}
