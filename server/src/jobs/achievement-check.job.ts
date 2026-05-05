/**
 * @file Achievement Progress Check Job
 * @description Runs every 15 minutes. Checks goal-linked dynamic achievements
 * for progress updates and emits Socket.IO notifications for unlocks.
 * Processes users in batches to stay within DB connection limits.
 */

import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { dynamicAchievementsService } from '../services/dynamic-achievements.service.js';
import { gamificationService } from '../services/gamification.service.js';
import { socketService } from '../services/socket.service.js';

const JOB_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const STARTUP_DELAY_MS = 720_000; // 12 minutes — after micro-wins job
const BATCH_SIZE = 100;

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

async function runAchievementCheckJob(): Promise<void> {
  if (running) {
    logger.info('[AchievementCheckJob] Previous run still in progress, skipping');
    return;
  }

  running = true;
  const startTime = Date.now();

  try {
    // Get users with pending goal-linked achievements
    const usersResult = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM dynamic_achievements
       WHERE unlocked = FALSE AND type = 'goal' AND source_goal_id IS NOT NULL
       LIMIT $1`,
      [BATCH_SIZE],
    );

    if (usersResult.rows.length === 0) {
      running = false;
      return;
    }

    let totalUnlocked = 0;

    for (const row of usersResult.rows) {
      try {
        const unlocked = await dynamicAchievementsService.checkGoalProgress(row.user_id);

        for (const ach of unlocked) {
          totalUnlocked++;

          // Award XP
          try {
            await gamificationService.awardXP(
              row.user_id,
              'achievement',
              ach.xpReward,
              undefined,
              `Achievement unlocked: ${ach.title}`,
            );
          } catch {
            // Non-fatal
          }

          // Emit Socket.IO notification
          socketService.emitToUser(row.user_id, 'achievement:unlocked', {
            achievement: {
              id: ach.id,
              title: ach.title,
              description: ach.description || ach.emotionalContext || '',
              icon: ach.icon,
              category: ach.category,
              rarity: ach.rarity,
              xpReward: ach.xpReward,
              unlocked: true,
              progress: ach.currentProgress,
              maxProgress: ach.maxProgress,
              progressPercentage: 100,
              aiGenerated: true,
              emotionalContext: ach.emotionalContext,
            },
          });

          // Persist in-app notification
          try {
            await query(
              `INSERT INTO notifications (user_id, type, title, message, data, created_at)
               VALUES ($1, 'achievement_unlock', $2, $3, $4, NOW())
               ON CONFLICT DO NOTHING`,
              [
                row.user_id,
                `Achievement Unlocked: ${ach.title}`,
                ach.emotionalContext || ach.description || `You earned "${ach.title}"!`,
                JSON.stringify({ achievementId: ach.id, xpReward: ach.xpReward, rarity: ach.rarity }),
              ],
            );
          } catch {
            // notifications table schema may vary
          }
        }
      } catch (error) {
        logger.error('[AchievementCheckJob] Error processing user', {
          userId: row.user_id,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }

    const elapsed = Date.now() - startTime;
    if (totalUnlocked > 0 || usersResult.rows.length > 10) {
      logger.info('[AchievementCheckJob] Run complete', {
        usersChecked: usersResult.rows.length,
        achievementsUnlocked: totalUnlocked,
        elapsedMs: elapsed,
      });
    }
  } catch (error) {
    logger.error('[AchievementCheckJob] Job failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  } finally {
    running = false;
  }
}

export function startAchievementCheckJob(): void {
  if (intervalId) return;

  logger.info(`[AchievementCheckJob] Scheduling (delay=${STARTUP_DELAY_MS}ms, interval=${JOB_INTERVAL_MS}ms)`);

  setTimeout(() => {
    runAchievementCheckJob();
    intervalId = setInterval(runAchievementCheckJob, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopAchievementCheckJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[AchievementCheckJob] Stopped');
  }
}
