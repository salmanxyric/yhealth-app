/**
 * @file Reminder Processor Job
 * Background job that processes scheduled reminders and triggers notifications
 *
 * Architecture:
 * Client → API → Database
 *               ↓
 *         Scheduler / Queue (this job)
 *               ↓
 *      Notification Workers
 *         ↙            ↘
 *  Push / In-App     Email
 */

import { reminderSchedulerService } from '../services/reminder-scheduler.service.js';
import { taskService } from '../services/task.service.js';
import { workoutAlarmService } from '../services/workout-alarm.service.js';
import { notificationService } from '../services/notification.service.js';
import { socketService } from '../services/socket.service.js';
import { emailEngine } from '../services/email-engine.service.js';
import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { formatTime12h } from '../lib/user-timezone.js';

// ============================================
// CONFIGURATION
// ============================================

const JOB_INTERVAL_MS = 60 * 1000; // Check every minute
const CALENDAR_REMINDER_ADVANCE_MINUTES = 5;
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

// Track which calendar events we've already sent reminders for (eventId:date)
const notifiedCalendarEvents = new Set<string>();

// ============================================
// JOB PROCESSOR
// ============================================

/**
 * Process pending reminders
 * This function is called periodically to check for and trigger due reminders
 */
async function processReminders(): Promise<void> {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    // Process scheduled reminders (meals, workouts, water, etc.)
    const remindersProcessed = await reminderSchedulerService.processReminders();

    if (remindersProcessed > 0) {
      logger.info('[ReminderJob] Processed scheduled reminders', { count: remindersProcessed });
    }

    // Process task reminders (user-created tasks with notifications)
    const tasksProcessed = await taskService.processTaskReminders();

    if (tasksProcessed > 0) {
      logger.info('[ReminderJob] Processed task reminders', { count: tasksProcessed });
    }

    // Process workout alarms
    const alarmsProcessed = await processWorkoutAlarms();

    if (alarmsProcessed > 0) {
      logger.info('[ReminderJob] Processed workout alarms', { count: alarmsProcessed });
    }

    // Process upcoming Google Calendar event reminders (5 min before)
    const calendarRemindersProcessed = await processCalendarEventReminders();

    if (calendarRemindersProcessed > 0) {
      logger.info('[ReminderJob] Processed calendar event reminders', { count: calendarRemindersProcessed });
    }
  } catch (error) {
    logger.error('[ReminderJob] Failed to process reminders', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isRunning = false;
  }
}

/**
 * Process upcoming Google Calendar events — send reminder ~5 minutes before start.
 */
async function processCalendarEventReminders(): Promise<number> {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + (CALENDAR_REMINDER_ADVANCE_MINUTES + 1) * 60_000);

    const result = await query<{
      id: string;
      user_id: string;
      title: string;
      start_time: Date;
      end_time: Date;
      location: string | null;
      timezone: string | null;
    }>(
      `SELECT ce.id, ce.user_id, ce.title, ce.start_time, ce.end_time, ce.location,
              u.timezone
       FROM calendar_events ce
       JOIN users u ON ce.user_id = u.id
       WHERE ce.status = 'confirmed' AND ce.all_day = false
         AND ce.start_time > $1 AND ce.start_time <= $2`,
      [now.toISOString(), windowEnd.toISOString()],
    );

    let processed = 0;
    const today = now.toISOString().split('T')[0];

    for (const event of result.rows) {
      const key = `${event.id}:${today}`;
      if (notifiedCalendarEvents.has(key)) continue;

      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / 60_000);
      const startStr = formatTime12h(startTime, event.timezone);
      const endStr = formatTime12h(endTime, event.timezone);

      const message = minutesUntil <= 1
        ? `Your meeting "${event.title}" is starting now (${startStr} - ${endStr}).${event.location ? ` Location: ${event.location}` : ''}`
        : `Your meeting "${event.title}" starts in ${minutesUntil} minutes (${startStr} - ${endStr}).${event.location ? ` Location: ${event.location}` : ''} Take a moment to prepare.`;

      try {
        await notificationService.create({
          userId: event.user_id,
          type: 'coaching',
          title: minutesUntil <= 1 ? 'Meeting Starting Now' : `Meeting in ${minutesUntil} minutes`,
          message,
          icon: '📅',
          actionUrl: '/wellbeing/schedule',
          actionLabel: 'View Schedule',
          category: 'calendar',
          priority: 'high',
          metadata: { calendarEventId: event.id, eventTitle: event.title },
        });

        socketService.emitToUser(event.user_id, 'notification:new', {
          type: 'coaching',
          title: `Meeting in ${minutesUntil} minutes`,
          message,
          icon: '📅',
        });

        notifiedCalendarEvents.add(key);
        processed++;

        logger.info('[ReminderJob] Sent calendar event reminder', {
          eventId: event.id,
          userId: event.user_id,
          title: event.title,
          minutesUntil,
        });
      } catch (err) {
        logger.error('[ReminderJob] Failed to send calendar event reminder', {
          eventId: event.id,
          userId: event.user_id,
          error: err instanceof Error ? err.message : 'Unknown',
        });
      }
    }

    // Periodically clean up old entries (keep set from growing)
    if (notifiedCalendarEvents.size > 500) {
      notifiedCalendarEvents.clear();
    }

    return processed;
  } catch (error) {
    logger.error('[ReminderJob] Fatal error in processCalendarEventReminders', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return 0;
  }
}

/**
 * Process workout alarms that are due
 */
async function processWorkoutAlarms(): Promise<number> {
  try {
    const alarms = await workoutAlarmService.getAlarmsToTrigger();
    
    if (alarms.length > 0) {
      logger.info('[ReminderJob] Found alarms to process', {
        count: alarms.length,
        alarmIds: alarms.map(a => a.id),
        alarms: alarms.map(a => ({
          id: a.id,
          userId: a.userId,
          title: a.title,
          nextTriggerAt: a.nextTriggerAt,
          alarmTime: a.alarmTime,
        })),
      });
    }
  
  let processed = 0;

  for (const alarm of alarms) {
    try {
      // Get user timezone to verify trigger time
      const timezone = await workoutAlarmService.getUserTimezone(alarm.userId);
      const now = new Date();
      
      // Convert nextTriggerAt to user's local time for verification
      if (!alarm.nextTriggerAt) {
        logger.warn('[ReminderJob] Alarm has no nextTriggerAt', {
          alarmId: alarm.id,
          userId: alarm.userId,
        });
        continue;
      }
      const nextTriggerDate = new Date(alarm.nextTriggerAt);
      const userLocalTime = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(nextTriggerDate);
      
      const expectedAlarmTime = alarm.alarmTime;
      const actualTriggerTime = userLocalTime;
      
      const timeMatch = expectedAlarmTime === actualTriggerTime.substring(0, 5); // Compare HH:MM
      
      logger.info('[ReminderJob] Triggering alarm - time verification', {
        alarmId: alarm.id,
        userId: alarm.userId,
        title: alarm.title,
        expectedAlarmTime,
        actualTriggerTime,
        nextTriggerAt: alarm.nextTriggerAt,
        timezone,
        timeMatch,
        now: now.toISOString(),
        nowInUserTimezone: new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now),
      });
      
      // If time doesn't match, log a warning but still trigger the alarm
      // The next trigger will be recalculated correctly
      if (!timeMatch) {
        logger.warn('[ReminderJob] Alarm triggered but time mismatch detected', {
          alarmId: alarm.id,
          userId: alarm.userId,
          expectedAlarmTime,
          actualTriggerTime,
          timezone,
          nextTriggerAt: alarm.nextTriggerAt,
        });
      }
      
      // Create in-app notification
      await notificationService.create({
        userId: alarm.userId,
        type: 'reminder',
        title: alarm.title,
        message: alarm.message || "Time for your workout! Let's get moving! 💪",
        icon: '⏰',
        actionUrl: '/dashboard?tab=workouts',
        actionLabel: 'Start Workout',
        category: 'workout',
        priority: 'high',
        relatedEntityType: alarm.workoutPlanId ? 'workout_plan' : undefined,
        relatedEntityId: alarm.workoutPlanId || undefined,
        metadata: {
          alarmId: alarm.id,
          alarmTime: alarm.alarmTime,
        },
      });

      // Emit WebSocket event to client for real-time alarm modal
      try {
        socketService.emitToUser(alarm.userId, 'alarm:triggered', {
          alarmId: alarm.id,
          title: alarm.title,
          message: alarm.message || "Time for your workout! Let's get moving! 💪",
          soundFile: alarm.soundFile || 'alarm.wav',
          soundEnabled: alarm.soundEnabled !== false, // Default to true if not set
          workoutPlanId: alarm.workoutPlanId,
          snoozeMinutes: alarm.snoozeMinutes,
        });
        
        logger.info('[ReminderJob] WebSocket event emitted successfully', {
          alarmId: alarm.id,
          userId: alarm.userId,
          title: alarm.title,
        });
      } catch (socketError) {
        logger.error('[ReminderJob] Failed to emit WebSocket event', {
          alarmId: alarm.id,
          userId: alarm.userId,
          error: socketError instanceof Error ? socketError.message : 'Unknown error',
          stack: socketError instanceof Error ? socketError.stack : undefined,
        });
        // Continue processing even if WebSocket fails
      }

      // Send email if notification type includes email
      if (alarm.notificationType === 'email' || alarm.notificationType === 'all') {
        await sendAlarmEmail(alarm.userId, alarm.title, alarm.message);
      }

      // Mark alarm as triggered and calculate next trigger time
      await workoutAlarmService.markTriggered(alarm.id);

      processed++;

      logger.info('[ReminderJob] Triggered workout alarm', {
        alarmId: alarm.id,
        userId: alarm.userId,
        title: alarm.title,
        notificationType: alarm.notificationType,
      });
    } catch (error) {
      logger.error('[ReminderJob] Failed to trigger workout alarm', {
        alarmId: alarm.id,
        userId: alarm.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Continue processing other alarms even if one fails
    }
  }

  return processed;
  } catch (error) {
    logger.error('[ReminderJob] Fatal error in processWorkoutAlarms', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return 0 to prevent job crash
    return 0;
  }
}

/**
 * Send email notification for alarm
 */
async function sendAlarmEmail(
  userId: string,
  title: string,
  message: string | null
): Promise<void> {
  try {
    // Get user email and name
    const userResult = await query<{ email: string; first_name: string }>(
      `SELECT email, first_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      logger.warn('[ReminderJob] User not found for alarm email', { userId });
      return;
    }

    const user = userResult.rows[0];
    const emailContent = message || "It's time for your scheduled workout! Stay consistent and keep pushing towards your goals.";
    const appUrl = process.env['APP_URL'] || 'http://localhost:3000';

    await emailEngine.send({
      userId,
      template: 'taskReminder',
      recipient: user.email,
      subject: `${title} - Balencia`,
      data: {
        firstName: user.first_name || 'there',
        taskTitle: title,
        taskDescription: emailContent,
        scheduledTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        priority: 'medium',
        priorityIcon: '⏰',
        category: 'fitness',
        categoryIcon: '💪',
        dashboardUrl: `${appUrl}/dashboard?tab=workouts`,
        completeUrl: `${appUrl}/dashboard?tab=workouts`,
      },
      category: 'engagement',
      priority: 'normal',
    });

    logger.info('[ReminderJob] Sent alarm email via engine', { userId, email: user.email, title });
  } catch (error) {
    logger.error('[ReminderJob] Failed to send alarm email', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================
// JOB LIFECYCLE
// ============================================

/**
 * Start the reminder processor job
 */
export function startReminderProcessor(): void {
  if (intervalId) {
    logger.warn('[ReminderJob] Already running');
    return;
  }

  logger.info('[ReminderJob] Starting reminder processor', {
    intervalMs: JOB_INTERVAL_MS,
  });

  // Run immediately on start
  processReminders();

  // Then run on interval
  intervalId = setInterval(processReminders, JOB_INTERVAL_MS);
}

/**
 * Stop the reminder processor job
 */
export function stopReminderProcessor(): void {
  if (!intervalId) {
    logger.warn('[ReminderJob] Not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;

  logger.info('[ReminderJob] Stopped reminder processor');
}

/**
 * Check if the job is running
 */
export function isReminderProcessorRunning(): boolean {
  return intervalId !== null;
}

// ============================================
// EXPORTS
// ============================================

export const reminderProcessorJob = {
  start: startReminderProcessor,
  stop: stopReminderProcessor,
  isRunning: isReminderProcessorRunning,
  processNow: processReminders,
};

export default reminderProcessorJob;
