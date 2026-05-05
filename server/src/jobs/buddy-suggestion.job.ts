/**
 * @file Buddy Suggestion Job
 * @description Runs weekly to precompute buddy suggestions for all active users.
 * Stores results in buddy_suggestions_cache for fast retrieval.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { buddySuggestionService } from '../services/buddy-suggestion.service.js';
import { notificationEngine } from '../services/notification-engine.service.js';

const JOB_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STARTUP_DELAY_MS = 1020_000; // 17 minutes (stagger after other jobs)

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

async function processSuggestions(): Promise<void> {
  if (running) return;
  running = true;

  try {
    logger.info('[BuddySuggestionJob] Starting weekly suggestion refresh');
    const result = await buddySuggestionService.refreshAllSuggestions();
    logger.info('[BuddySuggestionJob] Refresh complete', { processed: result.processed });

    // Buddy milestone notifications — notify users when buddies hit notable streaks
    await notifyBuddyMilestones().catch(() => {});
  } catch (error) {
    logger.error('[BuddySuggestionJob] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  } finally {
    running = false;
  }
}

const MILESTONE_STREAKS = [7, 14, 30, 50, 100];

async function notifyBuddyMilestones(): Promise<void> {
  try {
    // Find users who just hit a streak milestone and notify their buddies
    const milestoneUsers = await query<{ user_id: string; first_name: string; current_streak: number }>(
      `SELECT us.user_id, u.first_name, us.current_streak
       FROM user_streaks us
       JOIN users u ON u.id = us.user_id AND u.is_active = true
       WHERE us.current_streak = ANY($1::int[])
         AND us.updated_at >= NOW() - INTERVAL '7 days'`,
      [MILESTONE_STREAKS]
    );

    for (const mu of milestoneUsers.rows) {
      const buddies = await query<{ buddy_id: string }>(
        `SELECT CASE WHEN requester_id = $1 THEN recipient_id ELSE requester_id END as buddy_id
         FROM user_follows
         WHERE (requester_id = $1 OR recipient_id = $1) AND status = 'accepted'
         LIMIT 20`,
        [mu.user_id]
      );

      for (const b of buddies.rows) {
        notificationEngine.send({
          userId: b.buddy_id,
          type: 'social',
          title: 'Buddy Milestone!',
          message: `${mu.first_name} just hit a ${mu.current_streak}-day streak! 🔥`,
          icon: '🏅',
          priority: 'low',
          relatedEntityType: 'buddy_milestone',
          relatedEntityId: mu.user_id,
          actionUrl: '/dashboard?tab=social',
        }).catch(() => {});
      }
    }

    if (milestoneUsers.rows.length > 0) {
      logger.info('[BuddySuggestionJob] Sent buddy milestone notifications', {
        milestoneUsers: milestoneUsers.rows.length,
      });
    }
  } catch (error) {
    logger.warn('[BuddySuggestionJob] Buddy milestone notification failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

export function startBuddySuggestionJob(): void {
  if (intervalId) return;

  logger.info('[BuddySuggestionJob] Scheduling weekly buddy suggestion refresh', {
    intervalMs: JOB_INTERVAL_MS,
    startupDelayMs: STARTUP_DELAY_MS,
  });

  setTimeout(() => {
    processSuggestions();
    intervalId = setInterval(processSuggestions, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopBuddySuggestionJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[BuddySuggestionJob] Stopped');
  }
}
