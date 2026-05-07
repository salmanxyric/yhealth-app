import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';
import { logger } from '../../logger.service.js';
import { scheduleService, type DailySchedule } from '../../schedule.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';
import { addDaysToISODate, getUserLocalDateISO, resolveTimeZone } from '../../../lib/user-timezone.js';

// --- Schemas ---

const ActivityCategorySchema = z.enum([
  'work',
  'exercise',
  'meal',
  'break',
  'personal',
  'study',
  'social',
  'health',
  'other',
]);

const ActivityShapeSchema = z.enum(['square', 'circle', 'rounded', 'diamond', 'hexagon']);

const CATEGORY_COLORS: Record<z.infer<typeof ActivityCategorySchema>, string> = {
  work: '#3b82f6',
  exercise: '#6d4bc3',
  meal: '#c98111',
  break: '#1595a8',
  personal: '#b63d3d',
  study: '#7c3aed',
  social: '#b83280',
  health: '#158f83',
  other: '#10b981',
};

const GetUserSchedulesSchema = z.object({
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
});

const GetScheduleByDateSchema = z.object({
  date: z.string().optional().describe('Date in ISO format (YYYY-MM-DD), or "today", "tomorrow", "yesterday". If not provided, the server resolves today from the user timezone.'),
});

const CreateScheduleItemInputSchema = z.object({
  title: z.string().describe('Item title (required)'),
  description: z.string().optional().describe('Item description'),
  startTime: z.string().describe('Start time in HH:mm format (required, e.g., "09:00" or "5:30 AM" - will be normalized automatically)'),
  endTime: z.string().optional().describe('End time in HH:mm format (e.g., "10:00" or "7:00 PM" - will be normalized automatically)'),
  durationMinutes: z.number().optional().describe('Duration in minutes (if endTime not provided)'),
  color: z.string().optional().describe('Color hex code (e.g., "#FF5733")'),
  icon: z.string().optional().describe('Icon name or emoji'),
  category: ActivityCategorySchema.optional().describe('Activity category: work, exercise, meal, break, personal, study, social, health, or other'),
  shape: ActivityShapeSchema.optional().describe('Visual shape for the schedule activity. Defaults to square.'),
  position: z.number().describe('Position in schedule (0-based, required)'),
  metadata: z.record(z.any()).optional().describe('Additional metadata'),
});

const CreateScheduleLinkInputSchema = z.object({
  sourceItemIndex: z.number().describe('Index of source item in items array (0-based)'),
  targetItemIndex: z.number().describe('Index of target item in items array (0-based)'),
  linkType: z.enum(['sequential', 'conditional', 'parallel']).optional().describe('Link type (default: sequential)'),
  delayMinutes: z.number().optional().describe('Delay in minutes between items (default: 0)'),
  conditions: z.record(z.any()).optional().describe('Conditions for conditional links'),
});

// Schema for schedule items within CreateDailyScheduleSchema (position is optional, will be auto-generated)
const CreateScheduleItemInputSchemaForSchedule = CreateScheduleItemInputSchema.extend({
  position: z.number().optional().describe('Position in schedule (0-based). If not provided, will be auto-generated based on item order in the array.'),
});

const CreateDailyScheduleSchema = z.object({
  scheduleDate: z.string().optional().describe('Schedule date in ISO format (YYYY-MM-DD), or "today", "tomorrow", "yesterday". If not provided, the server resolves today from the user timezone.'),
  templateId: z.string().optional().describe('Template ID to use for the schedule (optional)'),
  name: z.string().optional().describe('Schedule name (optional)'),
  notes: z.string().optional().describe('Schedule notes (optional)'),
  items: z.array(z.union([
    CreateScheduleItemInputSchemaForSchedule,
    z.string().describe('Schedule item as string (e.g., "Breakfast at 7:00 a.m.") - will be parsed automatically')
  ])).optional().describe('Schedule items/activities to add to the schedule. Each item should be an object with title and startTime, or a string like "Activity at time" which will be parsed. Position will be auto-generated based on item order if not provided. When user describes activities with times (e.g., "workout at 9am", "lunch at 12pm"), create items for them.'),
  links: z.array(CreateScheduleLinkInputSchema).optional().describe('Links between schedule items. Use item indices from the items array (0-based). Create links when user mentions activities happening in sequence (e.g., "after workout, then shower") or connected activities. sourceItemIndex is the first item, targetItemIndex is the item that follows.'),
});

const UpdateDailyScheduleSchema = z.object({
  scheduleId: z.string().describe('Schedule ID (required)'),
  name: z.string().optional().describe('Schedule name'),
  notes: z.string().optional().describe('Schedule notes'),
});

const DeleteDailyScheduleSchema = z.object({
  scheduleId: z.string().describe('Schedule ID to delete (required)'),
});

const CreateScheduleItemSchema = z.object({
  scheduleId: z.string().describe('Schedule ID (required) or schedule date in YYYY-MM-DD format. If a date is provided and no schedule exists for that date, a new schedule will be created automatically.'),
  title: z.string().describe('Item title (required)'),
  description: z.string().optional().describe('Description'),
  startTime: z.string().describe('Start time in HH:mm format (required)'),
  endTime: z.string().optional().describe('End time in HH:mm format'),
  durationMinutes: z.number().optional().describe('Duration in minutes'),
  color: z.string().optional().describe('Color hex code'),
  icon: z.string().optional().describe('Icon name'),
  category: ActivityCategorySchema.optional().describe('Activity category: work, exercise, meal, break, personal, study, social, health, or other'),
  shape: ActivityShapeSchema.optional().describe('Visual shape for the schedule activity. Defaults to square.'),
  position: z.number().describe('Position in schedule (required)'),
  metadata: z.record(z.any()).optional().describe('Metadata object'),
});

const UpdateScheduleItemSchema = z.object({
  itemId: z.string().describe('Schedule item ID (required)'),
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  category: ActivityCategorySchema.optional(),
  shape: ActivityShapeSchema.optional(),
  position: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

const DeleteScheduleItemSchema = z.object({
  itemId: z.string().describe('Schedule item ID to delete (required)'),
});

const CreateScheduleLinkSchema = z.object({
  scheduleId: z.string().describe('Schedule ID (required)'),
  sourceItemId: z.string().describe('Source item ID (required)'),
  targetItemId: z.string().describe('Target item ID (required)'),
  linkType: z.enum(['sequential', 'conditional', 'parallel']).optional().describe('Link type'),
  delayMinutes: z.number().optional().describe('Delay in minutes'),
  conditions: z.record(z.any()).optional().describe('Conditions object'),
});

const DeleteScheduleLinkSchema = z.object({
  linkId: z.string().describe('Schedule link ID to delete (required)'),
});

const CheckScheduleConflictsSchema = z.object({
  date: z.string().optional().describe('Date in YYYY-MM-DD format, or "today", "tomorrow", "yesterday". Defaults to today in the user timezone.'),
  startTime: z.string().describe('Proposed start time (HH:mm or "H:MM AM/PM")'),
  endTime: z.string().describe('Proposed end time (HH:mm or "H:MM AM/PM")'),
});

// --- Implementations ---

async function getScheduleToolTimezone(userId: string): Promise<string> {
  try {
    const result = await query<{ timezone: string | null }>(
      `SELECT COALESCE(up.timezone, u.timezone, 'UTC') AS timezone
       FROM users u
       LEFT JOIN user_preferences up ON up.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [userId],
    );

    return resolveTimeZone(result.rows[0]?.timezone);
  } catch (error) {
    logger.warn('[LangGraphTools] Failed to resolve user timezone for schedule tool', {
      userId,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return 'UTC';
  }
}

async function resolveScheduleDate(
  userId: string,
  rawDate: string | undefined,
): Promise<{ date: string; timezone: string; today: string }> {
  const timezone = await getScheduleToolTimezone(userId);
  const today = getUserLocalDateISO(timezone);
  const normalized = rawDate?.trim().toLowerCase();

  if (!normalized || normalized === 'today' || normalized === 'todays' || normalized === "today's") {
    return { date: today, timezone, today };
  }

  if (normalized === 'tomorrow') {
    return { date: addDaysToISODate(today, 1), timezone, today };
  }

  if (normalized === 'yesterday') {
    return { date: addDaysToISODate(today, -1), timezone, today };
  }

  return { date: rawDate!.trim(), timezone, today };
}

async function getUserSchedules(userId: string, params?: z.infer<typeof GetUserSchedulesSchema>): Promise<string> {
  // Note: scheduleService doesn't have a method to get all schedules, so we'll use direct query
  let queryText = `SELECT * FROM daily_schedules WHERE user_id = $1`;
  const queryParams: string[] = [userId];
  let paramIndex = 2;

  if (params?.startDate) {
    queryText += ` AND schedule_date >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params?.endDate) {
    queryText += ` AND schedule_date <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  queryText += ` ORDER BY schedule_date DESC`;

  const result = await query(queryText, queryParams);

  return JSON.stringify({ success: true, data: { schedules: result.rows } }, null, 2);
}

async function createDailySchedule(userId: string, params: z.infer<typeof CreateDailyScheduleSchema>): Promise<string> {
  const resolved = await resolveScheduleDate(userId, params.scheduleDate);
  const scheduleDate = resolved.date;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
    return JSON.stringify({
      success: false,
      error: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-15)'
    });
  }

  // Preprocess items: convert strings to objects if needed
  let processedItems: Array<z.infer<typeof CreateScheduleItemInputSchemaForSchedule>> | undefined;
  if (params.items && params.items.length > 0) {
    const processed: Array<z.infer<typeof CreateScheduleItemInputSchemaForSchedule>> = [];
    for (let index = 0; index < params.items.length; index++) {
      const item = params.items[index];
      // If item is a string, try to parse it into an object
      if (typeof item === 'string') {
        // Try to extract time and title from string like "Breakfast at 7:00 a.m." or "Workout at 8:00 a.m."
        const timeMatch = item.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|AM|PM)/i);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = timeMatch[2] || '00';
          const period = timeMatch[3].toUpperCase();
          let hour24 = hours;
          if (period.includes('P') && hours !== 12) hour24 += 12;
          if (period.includes('A') && hours === 12) hour24 = 0;
          const timeStr = `${hour24.toString().padStart(2, '0')}:${minutes}`;
          const title = item.replace(/\s*at\s*\d{1,2}(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?|AM|PM)/i, '').trim();
          processed.push({
            title: title || item,
            startTime: timeStr,
            position: index,
          });
        } else {
          // If no time found, log warning and skip this item
          logger.warn('[LangGraphTools] Could not parse schedule item string - no time pattern found', { item, index });
        }
      } else {
        // If already an object, ensure position is set
        processed.push({
          ...item,
          position: item.position ?? index,
        });
      }
    }
    processedItems = processed.length > 0 ? processed : undefined;
  }

  // Check if schedule already exists for this date
  const existingSchedule = await scheduleService.getScheduleByDate(userId, scheduleDate);
  let schedule: DailySchedule;
  let isUpdate = false;

  if (existingSchedule) {
    // Update existing schedule
    isUpdate = true;

    // Update schedule metadata if provided
    if (params.name !== undefined || params.notes !== undefined) {
      schedule = await scheduleService.updateSchedule(userId, existingSchedule.id, {
        name: params.name,
        notes: params.notes,
      });
    } else {
      schedule = existingSchedule;
    }
  } else {
    // Create new schedule
    schedule = await scheduleService.createSchedule(userId, {
      scheduleDate,
      templateId: params.templateId,
      name: params.name,
      notes: params.notes,
    });
  }

  const createdItems: Array<{ id: string; title: string; position: number }> = [];
  const itemErrors: Array<{ title: string; error: string }> = [];

  // Normalize time format helper
  const normalizeTime = (time: string): string => {
    // Convert "5:30 AM" or "5:30" to "05:30"
    if (!time) return time;

    // Remove AM/PM and whitespace
    let normalized = time.trim().toUpperCase();
    const isPM = normalized.includes('PM');
    const isAM = normalized.includes('AM');

    normalized = normalized.replace(/[AP]M/gi, '').trim();

    // Parse hours and minutes
    const parts = normalized.split(':');
    if (parts.length !== 2) return time; // Return original if format is unexpected

    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');

    // Handle 12-hour format
    if (isPM && hours !== 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Create schedule items if provided
  if (processedItems && processedItems.length > 0) {
    for (let index = 0; index < processedItems.length; index++) {
      const itemInput = processedItems[index];
      try {
        // Normalize time formats
        const normalizedStartTime = normalizeTime(itemInput.startTime);
        const normalizedEndTime = itemInput.endTime ? normalizeTime(itemInput.endTime) : undefined;

        // Validate required fields
        if (!itemInput.title || !normalizedStartTime) {
          const errorMsg = !itemInput.title ? 'Missing title' : 'Missing or invalid startTime';
          itemErrors.push({ title: itemInput.title || 'Unknown', error: errorMsg });
          logger.warn('[LangGraphTools] Invalid schedule item', {
            userId,
            scheduleId: schedule.id,
            itemInput,
            error: errorMsg
          });
          continue;
        }

        // Auto-generate position if not provided (use index as position)
        const position: number = itemInput.position ?? index;
        const category = itemInput.category;
        const shape = itemInput.shape || 'square';
        const color = itemInput.color || (category ? CATEGORY_COLORS[category] : undefined);
        const metadata = {
          ...(itemInput.metadata || {}),
          shape,
        };

        const item = await scheduleService.addScheduleItem(userId, schedule.id, {
          title: itemInput.title,
          description: itemInput.description,
          startTime: normalizedStartTime,
          endTime: normalizedEndTime,
          durationMinutes: itemInput.durationMinutes || (!normalizedEndTime ? 30 : undefined),
          color,
          icon: itemInput.icon,
          category,
          shape,
          position: position,
          metadata,
        });
        createdItems.push({ id: item.id, title: item.title, position: item.position });

        // Queue embedding for the schedule item
        await embeddingQueueService.enqueueEmbedding({
          userId,
          sourceType: 'schedule_item',
          sourceId: item.id,
          operation: 'create',
          priority: JobPriorities.MEDIUM,
        }).catch((err) => {
          logger.warn('[LangGraphTools] Failed to enqueue embedding for schedule item', {
            itemId: item.id,
            error: err
          });
        });
      } catch (itemError) {
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        itemErrors.push({ title: itemInput.title || 'Unknown', error: errorMessage });
        logger.error('[LangGraphTools] Error creating schedule item', {
          userId,
          scheduleId: schedule.id,
          itemInput,
          error: itemError instanceof Error ? itemError.message : 'Unknown error',
          stack: itemError instanceof Error ? itemError.stack : undefined
        });
        // Continue with other items
      }
    }
  }

  // Create schedule links if provided
  const createdLinks: Array<{ id: string; sourceItemId: string; targetItemId: string }> = [];
  const linkErrors: Array<{ sourceItemId: string; targetItemId: string; error: string }> = [];

  if (params.links && params.links.length > 0 && createdItems.length > 0) {
    // Get existing links to avoid duplicates
    const existingLinks = schedule.links || [];
    const existingLinkKeys = new Set(
      existingLinks.map(link => `${link.sourceItemId}-${link.targetItemId}`)
    );

    for (const linkInput of params.links) {
      try {
        // Validate indices
        if (
          linkInput.sourceItemIndex < 0 ||
          linkInput.sourceItemIndex >= createdItems.length ||
          linkInput.targetItemIndex < 0 ||
          linkInput.targetItemIndex >= createdItems.length
        ) {
          logger.warn('[LangGraphTools] Invalid link indices', {
            userId,
            sourceIndex: linkInput.sourceItemIndex,
            targetIndex: linkInput.targetItemIndex,
            itemsCount: createdItems.length
          });
          continue;
        }

        const sourceItem = createdItems[linkInput.sourceItemIndex];
        const targetItem = createdItems[linkInput.targetItemIndex];

        if (!sourceItem || !targetItem) {
          continue;
        }

        // Check if link already exists
        const linkKey = `${sourceItem.id}-${targetItem.id}`;
        if (existingLinkKeys.has(linkKey)) {
          logger.info('[LangGraphTools] Link already exists, skipping', {
            userId,
            scheduleId: schedule.id,
            sourceItemId: sourceItem.id,
            targetItemId: targetItem.id,
          });
          // Find and add the existing link to createdLinks
          const existingLink = existingLinks.find(
            l => l.sourceItemId === sourceItem.id && l.targetItemId === targetItem.id
          );
          if (existingLink) {
            createdLinks.push({
              id: existingLink.id,
              sourceItemId: existingLink.sourceItemId,
              targetItemId: existingLink.targetItemId,
            });
          }
          continue;
        }

        try {
          const link = await scheduleService.createScheduleLink(userId, schedule.id, {
            sourceItemId: sourceItem.id,
            targetItemId: targetItem.id,
            linkType: linkInput.linkType || 'sequential',
            delayMinutes: linkInput.delayMinutes || 0,
            conditions: linkInput.conditions || {},
          });
          createdLinks.push({
            id: link.id,
            sourceItemId: link.sourceItemId,
            targetItemId: link.targetItemId
          });
          // Add to existing links set to avoid duplicates in same batch
          existingLinkKeys.add(linkKey);
        } catch (createError: any) {
          // Handle duplicate key error (unique constraint violation)
          if (createError?.code === '23505' || createError?.errorCode === '23505' ||
              (createError?.message && createError.message.includes('duplicate key'))) {
            logger.info('[LangGraphTools] Link already exists (duplicate key), skipping', {
              userId,
              scheduleId: schedule.id,
              sourceItemId: sourceItem.id,
              targetItemId: targetItem.id,
            });
            // Try to get the existing link
            try {
              const existingLinksResult = await scheduleService.getScheduleById(userId, schedule.id);
              const existingLink = existingLinksResult.links.find(
                l => l.sourceItemId === sourceItem.id && l.targetItemId === targetItem.id
              );
              if (existingLink) {
                createdLinks.push({
                  id: existingLink.id,
                  sourceItemId: existingLink.sourceItemId,
                  targetItemId: existingLink.targetItemId,
                });
                existingLinkKeys.add(linkKey);
              }
            } catch {
              // Ignore if we can't retrieve existing link
            }
          } else {
            throw createError; // Re-throw if it's a different error
          }
        }
      } catch (linkError) {
        const errorMessage = linkError instanceof Error ? linkError.message : 'Unknown error';
        linkErrors.push({
          sourceItemId: createdItems[linkInput.sourceItemIndex]?.id || 'unknown',
          targetItemId: createdItems[linkInput.targetItemIndex]?.id || 'unknown',
          error: errorMessage,
        });
        logger.warn('[LangGraphTools] Error creating schedule link', {
          userId,
          scheduleId: schedule.id,
          linkInput,
          error: linkError instanceof Error ? linkError.message : 'Unknown error',
          stack: linkError instanceof Error ? linkError.stack : undefined
        });
        // Continue with other links
      }
    }
  }

  // Queue embedding for the schedule
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'schedule',
    sourceId: schedule.id,
    operation: isUpdate ? 'update' : 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding for schedule', {
      scheduleId: schedule.id,
      error: err
    });
  });

  // Get the complete schedule with items and links to verify database persistence
  const completeSchedule = await scheduleService.getScheduleById(userId, schedule.id);

  // Log successful database save
  logger.info('[LangGraphTools] Schedule saved to database', {
    userId,
    scheduleId: schedule.id,
    scheduleDate,
    action: isUpdate ? 'updated' : 'created',
    itemsCount: createdItems.length,
    linksCount: createdLinks.length,
    totalItemsInSchedule: completeSchedule.items.length,
    totalLinksInSchedule: completeSchedule.links.length,
  });

  // Build response message with explicit database confirmation
  const action = isUpdate ? 'updated' : 'created';
  let message = `Daily schedule ${action} and saved to database successfully for ${scheduleDate}`;
  if (createdItems.length > 0) {
    message += ` with ${createdItems.length} new item${createdItems.length > 1 ? 's' : ''}`;
  }
  if (createdLinks.length > 0) {
    message += ` and ${createdLinks.length} link${createdLinks.length > 1 ? 's' : ''} (including existing ones)`;
  }
  message += `. Schedule ID: ${schedule.id}. All data has been persisted to the database.`;

  if (itemErrors.length > 0) {
    message += ` Note: ${itemErrors.length} item${itemErrors.length > 1 ? 's' : ''} failed to create.`;
  }

  if (linkErrors.length > 0) {
    message += ` Note: ${linkErrors.length} link${linkErrors.length > 1 ? 's' : ''} failed to create.`;
  }

  // Verify database persistence by checking schedule exists
  const verificationSchedule = await scheduleService.getScheduleByDate(userId, scheduleDate);
  if (!verificationSchedule || verificationSchedule.id !== schedule.id) {
    logger.error('[LangGraphTools] Schedule verification failed - schedule not found in database', {
      userId,
      scheduleId: schedule.id,
      scheduleDate,
    });
    return JSON.stringify({
      success: false,
      error: 'Schedule was created but verification failed. Please check the database.',
      message: 'Schedule creation completed but verification failed.',
    });
  }

  return JSON.stringify({
    success: (itemErrors.length === 0 && linkErrors.length === 0) || createdItems.length > 0, // Success if at least some items were created
    message,
    data: {
      schedule: completeSchedule,
      scheduleId: schedule.id,
      scheduleDate,
      today: resolved.today,
      timezone: resolved.timezone,
      createdItems: createdItems.length,
      createdLinks: createdLinks.length,
      totalItems: completeSchedule.items.length,
      totalLinks: completeSchedule.links.length,
      failedItems: itemErrors.length > 0 ? itemErrors : undefined,
      failedLinks: linkErrors.length > 0 ? linkErrors : undefined,
      wasUpdated: isUpdate,
      databaseSaved: true, // Explicit confirmation that data is in database
    }
  });
}

async function updateDailySchedule(userId: string, params: z.infer<typeof UpdateDailyScheduleSchema>): Promise<string> {
  const schedule = await scheduleService.updateSchedule(userId, params.scheduleId, {
    name: params.name,
    notes: params.notes,
  });

  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'schedule',
    sourceId: schedule.id,
    operation: 'update',
    priority: JobPriorities.MEDIUM,
  });

  return JSON.stringify({ success: true, message: 'Schedule updated successfully', data: schedule });
}

async function deleteDailySchedule(userId: string, params: z.infer<typeof DeleteDailyScheduleSchema>): Promise<string> {
  await scheduleService.deleteSchedule(userId, params.scheduleId);

  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'schedule',
    sourceId: params.scheduleId,
    operation: 'delete',
    priority: JobPriorities.MEDIUM,
  });

  return JSON.stringify({ success: true, message: 'Schedule deleted successfully' });
}

async function getScheduleByDate(userId: string, params: z.infer<typeof GetScheduleByDateSchema>): Promise<string> {
  const resolved = await resolveScheduleDate(userId, params.date);
  const date = resolved.date;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return JSON.stringify({
      success: false,
      error: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-15)'
    });
  }

  const result = await scheduleService.getScheduleByDate(userId, date);

  if (result) {
    logger.info('[LangGraphTools] Schedule retrieved from database', {
      userId,
      scheduleId: result.id,
      scheduleDate: date,
      itemsCount: result.items?.length || 0,
      linksCount: result.links?.length || 0,
    });

    return JSON.stringify({
      success: true,
      data: result,
      requestedDate: date,
      today: resolved.today,
      timezone: resolved.timezone,
      message: result.items && result.items.length > 0
        ? `Schedule found for ${date} with ${result.items.length} item${result.items.length > 1 ? 's' : ''}`
        : `Schedule found for ${date} (no items yet)`
    }, null, 2);
  } else {
    logger.info('[LangGraphTools] No schedule found for date', {
      userId,
      scheduleDate: date,
    });

    return JSON.stringify({
      success: true,
      data: null,
      requestedDate: date,
      today: resolved.today,
      timezone: resolved.timezone,
      message: `No schedule found for ${date}`
    }, null, 2);
  }
}

async function createScheduleItem(userId: string, params: z.infer<typeof CreateScheduleItemSchema>): Promise<string> {
  let scheduleId = params.scheduleId;

  // Check if scheduleId is actually a date (YYYY-MM-DD format)
  // This can happen if the AI passes a date instead of a schedule ID
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (datePattern.test(scheduleId)) {
    // It's a date, look up the schedule by date
    const schedule = await scheduleService.getScheduleByDate(userId, scheduleId);

    if (!schedule) {
      // Schedule doesn't exist for this date, create it first
      const newSchedule = await scheduleService.createSchedule(userId, {
        scheduleDate: scheduleId,
      });
      scheduleId = newSchedule.id;

      // Queue embedding for the new schedule
      await embeddingQueueService.enqueueEmbedding({
        userId,
        sourceType: 'schedule',
        sourceId: newSchedule.id,
        operation: 'create',
        priority: JobPriorities.MEDIUM,
      }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));
    } else {
      scheduleId = schedule.id;
    }
  }

  const result = await scheduleService.addScheduleItem(userId, scheduleId, {
    title: params.title,
    description: params.description,
    startTime: params.startTime,
    endTime: params.endTime,
    durationMinutes: params.durationMinutes || (!params.endTime ? 30 : undefined),
    color: params.color || (params.category ? CATEGORY_COLORS[params.category] : undefined),
    icon: params.icon,
    category: params.category,
    shape: params.shape || 'square',
    position: params.position,
    metadata: {
      ...(params.metadata || {}),
      shape: params.shape || 'square',
    },
  });

  // Queue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'wellbeing',
    sourceId: result.id,
    operation: 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => logger.warn('[EmbeddingQueue] Failed to enqueue', { error: String(err) }));

  return JSON.stringify({ success: true, data: { item: result } }, null, 2);
}

async function updateScheduleItem(userId: string, params: z.infer<typeof UpdateScheduleItemSchema>): Promise<string> {
  const result = await scheduleService.updateScheduleItem(userId, params.itemId, {
    title: params.title,
    description: params.description,
    startTime: params.startTime,
    endTime: params.endTime,
    durationMinutes: params.durationMinutes,
    color: params.color,
    icon: params.icon,
    category: params.category,
    shape: params.shape,
    position: params.position,
    metadata: params.shape
      ? { ...(params.metadata || {}), shape: params.shape }
      : params.metadata,
  });

  // Queue embedding update for schedule item
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'schedule_item',
    sourceId: params.itemId,
    operation: 'update',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding update for schedule item', {
      itemId: params.itemId,
      error: err
    });
  });

  return JSON.stringify({ success: true, data: { item: result } }, null, 2);
}

async function deleteScheduleItem(userId: string, params: z.infer<typeof DeleteScheduleItemSchema>): Promise<string> {
  await scheduleService.deleteScheduleItem(userId, params.itemId);

  // Queue embedding deletion for schedule item
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'schedule_item',
    sourceId: params.itemId,
    operation: 'delete',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding deletion for schedule item', {
      itemId: params.itemId,
      error: err
    });
  });

  return JSON.stringify({ success: true, message: 'Schedule item deleted successfully' }, null, 2);
}

async function createScheduleLink(userId: string, params: z.infer<typeof CreateScheduleLinkSchema>): Promise<string> {
  const result = await scheduleService.createScheduleLink(userId, params.scheduleId, {
    sourceItemId: params.sourceItemId,
    targetItemId: params.targetItemId,
    linkType: params.linkType || 'sequential',
    delayMinutes: params.delayMinutes || 0,
    conditions: params.conditions || {},
  });

  return JSON.stringify({ success: true, data: { link: result } }, null, 2);
}

async function deleteScheduleLink(userId: string, params: z.infer<typeof DeleteScheduleLinkSchema>): Promise<string> {
  await scheduleService.deleteScheduleLink(userId, params.linkId);
  return JSON.stringify({ success: true, message: 'Schedule link deleted successfully' }, null, 2);
}

async function checkScheduleConflicts(
  userId: string,
  params: z.infer<typeof CheckScheduleConflictsSchema>,
): Promise<string> {
  const resolved = await resolveScheduleDate(userId, params.date);
  const date = resolved.date;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return JSON.stringify({
      success: false,
      error: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-15)',
    });
  }

  const normalizeTime = (time: string): string => {
    if (!time) return time;
    let normalized = time.trim().toUpperCase();
    const isPM = normalized.includes('PM');
    const isAM = normalized.includes('AM');
    normalized = normalized.replace(/[AP]M/gi, '').trim();
    const parts = normalized.split(':');
    if (parts.length !== 2) return time;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');
    if (isPM && hours !== 12) hours += 12;
    else if (isAM && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const proposedStart = normalizeTime(params.startTime);
  const proposedEnd = normalizeTime(params.endTime);

  const result = await query(
    `SELECT si.id, si.title, si.start_time, si.end_time, si.category, si.description
     FROM schedule_items si
     JOIN daily_schedules ds ON si.schedule_id = ds.id
     WHERE ds.user_id = $1
       AND ds.schedule_date = $2::date
       AND ds.is_template = false
       AND si.start_time < $4::time
       AND (si.end_time > $3::time OR si.end_time IS NULL)
     ORDER BY si.start_time`,
    [userId, date, proposedStart, proposedEnd],
  );

  const conflicts = result.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    description: row.description,
  }));

  if (conflicts.length === 0) {
    return JSON.stringify({
      success: true,
      hasConflicts: false,
      conflicts: [],
      message: `No conflicts found for ${date} between ${proposedStart} and ${proposedEnd}. Safe to create.`,
    });
  }

  return JSON.stringify({
    success: true,
    hasConflicts: true,
    conflictCount: conflicts.length,
    conflicts,
    proposedRange: { date, startTime: proposedStart, endTime: proposedEnd },
    message: `Found ${conflicts.length} conflicting item(s) for ${date} between ${proposedStart} and ${proposedEnd}. Ask the user how to proceed: keep both, replace existing, or adjust times.`,
  });
}

// --- Registration ---

export function registerScheduleTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'createDailySchedule',
      description: 'CRITICAL: ALWAYS call this tool when user requests schedule creation - NEVER just describe a schedule in text format. This tool saves schedules to the database. Use when user says "create schedule", "plan my day", "set up a schedule", "create a daily schedule", "schedule my day", "add in db", or when user describes daily activities with times. IMPORTANT: This is for daily schedules (daily_schedules table), NOT workout plans, diet plans, or user plans. No goal ID is required. scheduleDate is OPTIONAL - if not provided, it will default to today\'s date (YYYY-MM-DD format). If a schedule already exists for the same date, it will be automatically updated with new items and links. You can optionally include items (activities) and links (connections between activities) in the same call. When user describes activities with times, create items for them. Each item needs: title (required), startTime (required), and optionally endTime, description, icon, category, color, and shape. Valid categories: work, exercise, meal, break, personal, study, social, health, other. Valid shapes: square, circle, rounded, diamond, hexagon. Position will be auto-generated based on item order if not provided. When user mentions activities happening in sequence or connected activities, create links between them. Items and links will be added to existing schedules, not replace them. Before creating, call checkScheduleConflicts first to detect time overlaps. If conflicts found, present them to the user and ask how to proceed (replace existing, keep both, or adjust times). Only create after user confirms or no conflicts exist. The schedule will be automatically saved to the database and, when Google Calendar is linked, manual activities are best-effort synced to Google Calendar.',
      schema: CreateDailyScheduleSchema,
      handler: withErrorHandling('createDailySchedule', async (uid, params) =>
        createDailySchedule(uid, params),
      ),
    },
    {
      name: 'getUserSchedules',
      description: 'Get the user\'s daily schedules. Use when user asks about their schedules, daily plans, or schedule history.',
      schema: GetUserSchedulesSchema,
      handler: withErrorHandling('getUserSchedules', async (uid, params) =>
        getUserSchedules(uid, params),
      ),
    },
    {
      name: 'getScheduleByDate',
      description: 'Get schedule for a specific date. Use when user asks about their schedule for a particular date or day. For "today", omit the date or pass "today"; the server resolves the correct current date from the user timezone. You can call this tool without a date parameter when user asks "what\'s my schedule", "show my schedule", "my schedule today", etc.',
      schema: GetScheduleByDateSchema,
      handler: withErrorHandling('getScheduleByDate', async (uid, params) =>
        getScheduleByDate(uid, params),
      ),
    },
    {
      name: 'updateDailySchedule',
      description: 'Update a daily schedule. Use when user asks to modify, change, or update their schedule.',
      schema: UpdateDailyScheduleSchema,
      handler: withErrorHandling('updateDailySchedule', async (uid, params) =>
        updateDailySchedule(uid, params),
      ),
    },
    {
      name: 'deleteDailySchedule',
      description: 'Delete a daily schedule. Use when user asks to remove or delete their schedule.',
      schema: DeleteDailyScheduleSchema,
      handler: withErrorHandling('deleteDailySchedule', async (uid, params) =>
        deleteDailySchedule(uid, params),
      ),
    },
    {
      name: 'createScheduleItem',
      description: 'Create a schedule item. Use when user mentions an activity, appointment, or task with a time. Supports title, description, start/end time, category, color, shape, and icon. If endTime is missing, default duration is 30 minutes. When Google Calendar is linked, manual activities are best-effort synced to Google Calendar.',
      schema: CreateScheduleItemSchema,
      handler: withErrorHandling('createScheduleItem', async (uid, params) =>
        createScheduleItem(uid, params),
      ),
    },
    {
      name: 'updateScheduleItem',
      description: 'Update a schedule item. Use when user asks to modify, change, or update a scheduled activity.',
      schema: UpdateScheduleItemSchema,
      handler: withErrorHandling('updateScheduleItem', async (uid, params) =>
        updateScheduleItem(uid, params),
      ),
    },
    {
      name: 'deleteScheduleItem',
      description: 'Delete a schedule item. Use when user asks to remove or cancel a scheduled activity.',
      schema: DeleteScheduleItemSchema,
      handler: withErrorHandling('deleteScheduleItem', async (uid, params) =>
        deleteScheduleItem(uid, params),
      ),
    },
    {
      name: 'createScheduleLink',
      description: 'Create a link between schedule items. Use when user wants to connect or link activities in their schedule.',
      schema: CreateScheduleLinkSchema,
      handler: withErrorHandling('createScheduleLink', async (uid, params) =>
        createScheduleLink(uid, params),
      ),
    },
    {
      name: 'deleteScheduleLink',
      description: 'Delete a schedule link. Use when user wants to remove a connection between schedule items.',
      schema: DeleteScheduleLinkSchema,
      handler: withErrorHandling('deleteScheduleLink', async (uid, params) =>
        deleteScheduleLink(uid, params),
      ),
    },
    {
      name: 'checkScheduleConflicts',
      description: 'Check for time conflicts before scheduling. Call BEFORE createDailySchedule or createScheduleItem when user wants to add an activity at a specific time. Returns any conflicting items with their IDs, titles, and times. If conflicts are found, ask user how to proceed (replace existing, keep both, or adjust times) before creating.',
      schema: CheckScheduleConflictsSchema,
      handler: withErrorHandling('checkScheduleConflicts', async (uid, params) =>
        checkScheduleConflicts(uid, params),
      ),
    },
  ];
}
