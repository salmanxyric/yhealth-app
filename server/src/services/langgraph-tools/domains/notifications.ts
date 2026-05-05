import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetNotificationsSchema = z.object({
  type: z.string().optional().describe('Filter by notification type'),
  isRead: z.boolean().optional().describe('Filter by read status'),
  priority: z.string().optional().describe('Filter by priority: low, normal, high, urgent'),
  startDate: z.string().optional().describe('Filter notifications from this date (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('Filter notifications up to this date (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of notifications to return (default: 50)'),
});

const GetNotificationByIdSchema = z.object({
  notificationId: z.string().describe('Notification ID to retrieve (required)'),
});

const CreateNotificationSchema = z.object({
  type: z.string().describe('Notification type: achievement, goal_progress, reminder, system, etc.'),
  title: z.string().describe('Notification title (required)'),
  message: z.string().describe('Notification message (required)'),
  icon: z.string().optional().describe('Icon name or emoji'),
  imageUrl: z.string().optional().describe('Optional image URL'),
  actionUrl: z.string().optional().describe('Deep link URL'),
  actionLabel: z.string().optional().describe('CTA button text'),
  category: z.string().optional().describe('Custom category'),
  priority: z.string().optional().describe('Priority: low, normal, high, urgent'),
  relatedEntityType: z.string().optional().describe('Related entity type: goal, plan, achievement, etc.'),
  relatedEntityId: z.string().optional().describe('Related entity ID'),
  metadata: z.record(z.any()).optional().describe('Additional metadata JSON'),
  expiresAt: z.string().optional().describe('Expiration timestamp'),
});

const UpdateNotificationSchema = z.object({
  notificationId: z.string().describe('Notification ID (required)'),
  isRead: z.boolean().optional().describe('Mark as read'),
  isArchived: z.boolean().optional().describe('Archive notification'),
});

const DeleteNotificationSchema = z.object({
  notificationId: z.string().describe('Notification ID to delete (required)'),
});

const DeleteAllNotificationsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  isRead: z.boolean().optional().describe('Filter by read status'),
  type: z.string().optional().describe('Filter by type'),
});

const MarkAllNotificationsReadSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag'),
});

// --- Implementations ---

async function getNotifications(userId: string, params?: z.infer<typeof GetNotificationsSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM notifications WHERE user_id = $1`;
  const queryParams: (string | boolean | number | Date)[] = [userId];
  let paramIndex = 2;

  if (params?.type) {
    sqlQuery += ` AND type = $${paramIndex}`;
    queryParams.push(params.type);
    paramIndex++;
  }

  if (params?.isRead !== undefined) {
    sqlQuery += ` AND is_read = $${paramIndex}`;
    queryParams.push(params.isRead);
    paramIndex++;
  }

  if (params?.priority) {
    sqlQuery += ` AND priority = $${paramIndex}`;
    queryParams.push(params.priority);
    paramIndex++;
  }

  if (params?.startDate) {
    sqlQuery += ` AND created_at >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params?.endDate) {
    sqlQuery += ` AND created_at <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY created_at DESC`;

  if (params?.limit) {
    sqlQuery += ` LIMIT $${paramIndex}`;
    queryParams.push(params.limit);
  } else {
    sqlQuery += ` LIMIT 50`;
  }

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No notifications found', notifications: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    icon: row.icon,
    imageUrl: row.image_url,
    actionUrl: row.action_url,
    actionLabel: row.action_label,
    priority: row.priority,
    isRead: row.is_read,
    isArchived: row.is_archived,
    createdAt: row.created_at,
  }));

  return JSON.stringify({ notifications: formatted, count: formatted.length }, null, 2);
}

async function getNotificationById(userId: string, params: z.infer<typeof GetNotificationByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
    [params.notificationId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Notification not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    icon: row.icon,
    imageUrl: row.image_url,
    actionUrl: row.action_url,
    actionLabel: row.action_label,
    priority: row.priority,
    isRead: row.is_read,
    isArchived: row.is_archived,
    metadata: row.metadata,
    createdAt: row.created_at,
  };

  return JSON.stringify({ success: true, notification: formatted }, null, 2);
}

async function createNotification(userId: string, params: z.infer<typeof CreateNotificationSchema>): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO notifications (
      user_id, type, title, message, icon, image_url, action_url, action_label,
      category, priority, related_entity_type, related_entity_id, metadata, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id`,
    [
      userId,
      params.type,
      params.title,
      params.message,
      params.icon || null,
      params.imageUrl || null,
      params.actionUrl || null,
      params.actionLabel || null,
      params.category || null,
      params.priority || 'normal',
      params.relatedEntityType || null,
      params.relatedEntityId || null,
      params.metadata ? JSON.stringify(params.metadata) : '{}',
      params.expiresAt ? new Date(params.expiresAt) : null,
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Notification created successfully',
    data: { id: result.rows[0].id },
  });
}

async function updateNotification(userId: string, params: z.infer<typeof UpdateNotificationSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
    [params.notificationId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Notification not found or access denied' });
  }

  const setClauses: string[] = [];
  const values: (string | boolean | Date)[] = [];
  let paramIndex = 1;

  if (params.isRead !== undefined) {
    setClauses.push(`is_read = $${paramIndex}`);
    values.push(params.isRead);
    if (params.isRead) {
      setClauses.push(`read_at = CURRENT_TIMESTAMP`);
    }
    paramIndex++;
  }

  if (params.isArchived !== undefined) {
    setClauses.push(`is_archived = $${paramIndex}`);
    values.push(params.isArchived);
    if (params.isArchived) {
      setClauses.push(`archived_at = CURRENT_TIMESTAMP`);
    }
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE notifications SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.notificationId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Notification updated successfully',
  });
}

async function deleteNotification(userId: string, params: z.infer<typeof DeleteNotificationSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
    [params.notificationId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Notification not found or access denied' });
  }

  await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [params.notificationId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Notification deleted successfully',
  });
}

async function deleteAllNotifications(userId: string, params: z.infer<typeof DeleteAllNotificationsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all notifications.'
    });
  }

  let sqlQuery = `DELETE FROM notifications WHERE user_id = $1`;
  const queryParams: (string | boolean)[] = [userId];
  let paramIndex = 2;

  if (params.isRead !== undefined) {
    sqlQuery += ` AND is_read = $${paramIndex}`;
    queryParams.push(params.isRead);
    paramIndex++;
  }

  if (params.type) {
    sqlQuery += ` AND type = $${paramIndex}`;
    queryParams.push(params.type);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} notification(s)`,
    deletedCount: result.rowCount || 0,
  });
}

async function markAllNotificationsRead(userId: string, params: z.infer<typeof MarkAllNotificationsReadSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to mark all notifications as read.'
    });
  }

  const result = await query(
    `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  return JSON.stringify({
    success: true,
    message: `Marked ${result.rowCount || 0} notification(s) as read`,
    updatedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerNotificationTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getNotifications',
      description: 'Get user notifications. Use when user asks about their notifications, alerts, or messages.',
      schema: GetNotificationsSchema,
      handler: withErrorHandling('getNotifications', (uid, params) => getNotifications(uid, params)),
    },
    {
      name: 'getNotificationById',
      description: 'Get a specific notification by ID. Use when user asks about a particular notification.',
      schema: GetNotificationByIdSchema,
      handler: withErrorHandling('getNotificationById', (uid, params) => getNotificationById(uid, params)),
    },
    {
      name: 'createNotification',
      description: 'Create a notification. Use when user wants to create a custom notification or reminder.',
      schema: CreateNotificationSchema,
      handler: withErrorHandling('createNotification', (uid, params) => createNotification(uid, params)),
    },
    {
      name: 'updateNotification',
      description: 'Update a notification. Use when user asks to mark notification as read, archive, or modify it.',
      schema: UpdateNotificationSchema,
      handler: withErrorHandling('updateNotification', (uid, params) => updateNotification(uid, params)),
    },
    {
      name: 'deleteNotification',
      description: 'Delete a notification. Use when user asks to remove or delete a notification.',
      schema: DeleteNotificationSchema,
      handler: withErrorHandling('deleteNotification', (uid, params) => deleteNotification(uid, params)),
    },
    {
      name: 'deleteAllNotifications',
      description: 'Delete all notifications (with optional filters). Use when user asks to clear all notifications. Requires confirmation.',
      schema: DeleteAllNotificationsSchema,
      handler: withErrorHandling('deleteAllNotifications', (uid, params) => deleteAllNotifications(uid, params)),
    },
    {
      name: 'markAllNotificationsRead',
      description: 'Mark all notifications as read. Use when user asks to mark all notifications as read.',
      schema: MarkAllNotificationsReadSchema,
      handler: withErrorHandling('markAllNotificationsRead', (uid, params) => markAllNotificationsRead(uid, params)),
    },
  ];
}
