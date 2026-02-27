/**
 * @file Proactive Messaging Job
 * Background job that sends proactive messages based on user data.
 *
 * Uses score-and-rank approach: all 18 message types are scored per user,
 * sorted by impact, and only the top 2-3 are sent per cycle.
 * This ensures high-priority messages (streak_risk, goal_deadline)
 * always take precedence over low-value ones (water_intake, whoop_sync).
 */

import { query } from '../database/pg.js';
import { logger } from '../services/logger.service.js';
import { proactiveMessagingService } from '../services/proactive-messaging.service.js';
import { comprehensiveUserContextService } from '../services/comprehensive-user-context.service.js';

// ============================================
// CONFIGURATION
// ============================================

const JOB_INTERVAL_MS = 8 * 60 * 60 * 1000; // Check 3x per day (every 8 hours)
const STARTUP_DELAY_MS = 30 * 1000; // 30-second delay before first run
const BATCH_SIZE = 3; // Users processed in parallel per batch
const INTER_BATCH_DELAY_MS = 2000; // 2 seconds between batches
let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let startupTimeoutId: NodeJS.Timeout | null = null;

// ============================================
// HELPERS
// ============================================

/**
 * Check if current hour falls within ANY message time window.
 * Returns false if no messages can possibly be sent at this hour,
 * allowing us to skip expensive context fetching entirely.
 */
function hasApplicableTimeWindow(hour: number, _isSunday: boolean): boolean {
  // Message windows: 6-10, 7-9, 8-10, 10-14, 12-15, 13-17, 14-18, 15-17, 18-22, 19-21, Sun 9-11
  // Plus "any time" messages (WHOOP sync, achievement) which always apply
  // Consolidated: any hour 6-22 has at least one window, plus any-time messages
  return hour >= 6 && hour < 22;
}

// ============================================
// JOB PROCESSOR
// ============================================

/**
 * Process proactive messages for all active users
 */
async function processProactiveMessages(): Promise<void> {
  if (isRunning) {
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    logger.info('[ProactiveMessagingJob] Starting proactive message check');

    // Get all active users
    // Note: users table doesn't have deleted_at column, using is_active check only
    const usersResult = await query<{ id: string }>(
      `SELECT id FROM users WHERE is_active = true`
    );

    const userIds = usersResult.rows.map((row) => row.id);

    // Pre-check: skip entire run if outside all message windows
    const now = new Date();
    const hour = now.getHours();
    const isSunday = now.getDay() === 0;

    if (!hasApplicableTimeWindow(hour, isSunday)) {
      logger.info('[ProactiveMessagingJob] Outside message windows, skipping', { hour });
      return;
    }

    logger.info('[ProactiveMessagingJob] Processing proactive messages', {
      userCount: userIds.length,
      hour,
    });

    const counters: Record<string, number> = {
      sleep: 0, whoop_sync: 0, workout: 0, nutrition: 0, wellbeing: 0,
      morning_briefing: 0, streak_risk: 0, streak_celebration: 0, recovery_advice: 0,
      goal_deadline: 0, goal_stalled: 0, water_intake: 0, habit_missed: 0,
      achievement_unlock: 0, weekly_digest: 0, competition_update: 0,
      app_inactive: 0, coach_pro_analysis: 0,
    };
    let errors = 0;
    let skippedCapped = 0;

    // Process users in small batches to avoid overwhelming the database
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (userId) => {
          try {
            // Pre-fetch cooldown state ONCE per user
            const cooldown = await proactiveMessagingService.getMessageCooldownState(userId);

            // Skip if daily cap reached (4 messages/day)
            if (cooldown.dailyCount >= 4) {
              skippedCapped++;
              return;
            }

            // Fetch comprehensive context ONCE per user
            const context = await comprehensiveUserContextService.getComprehensiveContext(userId);

            // Score all 18 message types and pick the highest-impact ones
            const candidates = await proactiveMessagingService.scoreMessageCandidates(userId, context, cooldown, hour, isSunday);
            const maxToSend = Math.min(3, 4 - cooldown.dailyCount);
            const topCandidates = candidates
              .filter(c => c.eligible && c.timeWindowValid)
              .slice(0, maxToSend);

            if (topCandidates.length > 0) {
              logger.debug('[ProactiveMessagingJob] Sending top candidates', {
                userId: userId.slice(0, 8),
                sending: topCandidates.map(c => `${c.type}(${c.score})`),
              });
            }

            // Dispatch to existing checkAndSend* methods (they handle enrichment + generation + sending)
            for (const candidate of topCandidates) {
              let sent = false;
              switch (candidate.type) {
                case 'sleep': sent = await proactiveMessagingService.checkAndSendSleepMessage(userId, context, cooldown); break;
                case 'whoop_sync': sent = await proactiveMessagingService.checkAndSendWhoopSyncMessage(userId, context, cooldown); break;
                case 'workout': sent = await proactiveMessagingService.checkAndSendWorkoutReminder(userId, context, cooldown); break;
                case 'nutrition': sent = await proactiveMessagingService.checkAndSendNutritionReminder(userId, context, cooldown); break;
                case 'wellbeing': sent = await proactiveMessagingService.checkAndSendWellbeingReminder(userId, context, cooldown); break;
                case 'goal_deadline': sent = await proactiveMessagingService.checkAndSendGoalDeadlineMessage(userId, context, cooldown); break;
                case 'goal_stalled': sent = await proactiveMessagingService.checkAndSendGoalStalledMessage(userId, context, cooldown); break;
                case 'streak_risk': sent = await proactiveMessagingService.checkAndSendStreakRiskMessage(userId, context, cooldown); break;
                case 'streak_celebration': sent = await proactiveMessagingService.checkAndSendStreakCelebrationMessage(userId, context, cooldown); break;
                case 'habit_missed': sent = await proactiveMessagingService.checkAndSendHabitMissedMessage(userId, context, cooldown); break;
                case 'water_intake': sent = await proactiveMessagingService.checkAndSendWaterIntakeMessage(userId, context, cooldown); break;
                case 'morning_briefing': sent = await proactiveMessagingService.checkAndSendMorningBriefingMessage(userId, context, cooldown); break;
                case 'weekly_digest': sent = await proactiveMessagingService.checkAndSendWeeklyDigestMessage(userId, context, cooldown); break;
                case 'achievement_unlock': sent = await proactiveMessagingService.checkAndSendAchievementMessage(userId, context, cooldown); break;
                case 'recovery_advice': sent = await proactiveMessagingService.checkAndSendRecoveryAdviceMessage(userId, context, cooldown); break;
                case 'competition_update': sent = await proactiveMessagingService.checkAndSendCompetitionUpdateMessage(userId, context, cooldown); break;
                case 'app_inactive': sent = await proactiveMessagingService.checkAndSendAppInactiveMessage(userId, context, cooldown); break;
                case 'coach_pro_analysis': sent = await proactiveMessagingService.checkAndSendCoachProMessage(userId, context, cooldown); break;
              }
              if (sent) counters[candidate.type]++;
            }

          } catch (error) {
            errors++;
            logger.error('[ProactiveMessagingJob] Error processing user', {
              userId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );

      // Delay between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < userIds.length) {
        await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
      }
    }

    const totalSent = Object.values(counters).reduce((sum, c) => sum + c, 0);
    const duration = Date.now() - startTime;
    logger.info('[ProactiveMessagingJob] Completed proactive message check', {
      userCount: userIds.length,
      skippedCapped,
      totalMessagesSent: totalSent,
      ...counters,
      errors,
      durationMs: duration,
    });
  } catch (error) {
    logger.error('[ProactiveMessagingJob] Error processing proactive messages', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  } finally {
    isRunning = false;
  }
}

// ============================================
// JOB CONTROL
// ============================================

/**
 * Start the proactive messaging job
 */
export function startProactiveMessagingJob(): void {
  if (intervalId !== null) {
    logger.warn('[ProactiveMessagingJob] Job is already running');
    return;
  }

  logger.info('[ProactiveMessagingJob] Starting proactive messaging job', {
    intervalMs: JOB_INTERVAL_MS,
    startupDelayMs: STARTUP_DELAY_MS,
    batchSize: BATCH_SIZE,
  });

  // Delay first run to let the server fully warm up and avoid query storm on startup
  startupTimeoutId = setTimeout(() => {
    startupTimeoutId = null;
    processProactiveMessages().catch((error) => {
      logger.error('[ProactiveMessagingJob] Error in initial run', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    // Then run on interval
    intervalId = setInterval(() => {
      processProactiveMessages().catch((error) => {
        logger.error('[ProactiveMessagingJob] Error in scheduled run', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

/**
 * Stop the proactive messaging job
 */
export function stopProactiveMessagingJob(): void {
  logger.info('[ProactiveMessagingJob] Stopping proactive messaging job');

  if (startupTimeoutId) {
    clearTimeout(startupTimeoutId);
    startupTimeoutId = null;
  }

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  // Wait for current run to finish (with timeout)
  const timeout = 30000; // 30 seconds
  const startTime = Date.now();
  while (isRunning && Date.now() - startTime < timeout) {
    // Wait
  }

  if (isRunning) {
    logger.warn('[ProactiveMessagingJob] Job did not finish within timeout');
  }
}

// ============================================
// EXPORTS
// ============================================

export const proactiveMessagingJob = {
  start: startProactiveMessagingJob,
  stop: stopProactiveMessagingJob,
};

