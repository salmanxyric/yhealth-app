/**
 * @file Proactive Messaging Service
 * @description Generates and sends proactive messages based on user data
 */

import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { query, transaction } from '../database/pg.js';
import { logger } from './logger.service.js';
import { messageService } from './message.service.js';
import { socketService } from './socket.service.js';
import { gamificationService } from './gamification.service.js';
import { userCoachingProfileService } from './user-coaching-profile.service.js';
import { dailyAnalysisService } from './daily-analysis.service.js';
import type { DailyAnalysisReport, StructuredInsight, CrossDomainInsight, CoachingDirective } from './daily-analysis.service.js';
import type { StableTraits, CoachEmotionalState, RelationshipDepth } from './user-coaching-profile.service.js';
import { llmCircuitBreaker } from './llm-circuit-breaker.service.js';


// ============================================
// CONSTANTS
// ============================================

const AI_COACH_USER_ID = process.env.AI_COACH_USER_ID || '00000000-0000-0000-0000-000000000001';

// ============================================
// TYPES
// ============================================

export type ProactiveMessageType =
  | 'sleep' | 'whoop_sync' | 'workout' | 'nutrition' | 'wellbeing'
  | 'goal_deadline' | 'goal_stalled' | 'streak_risk' | 'streak_celebration'
  | 'habit_missed' | 'water_intake' | 'morning_briefing' | 'weekly_digest'
  | 'achievement_unlock' | 'recovery_advice' | 'competition_update'
  | 'app_inactive' | 'coach_pro_analysis'
  | 'meal_alignment' | 'daily_progress_review'
  | 'score_declining';

export interface ProactiveContext {
  type: ProactiveMessageType;
  data: Record<string, any>;
  userContext: any; // ComprehensiveUserContext
  // Pre-computed analysis (Phase 2 upgrade)
  analysisReport?: DailyAnalysisReport | null;
  relevantInsights?: StructuredInsight[];
  crossDomainInsights?: CrossDomainInsight[];
  coachingDirective?: CoachingDirective | null;
  stableTraits?: StableTraits | null;
  // Coach emotional intelligence
  coachEmotion?: CoachEmotionalState;
  relationshipDepth?: RelationshipDepth;
}

export interface MessageCandidate {
  type: ProactiveMessageType;
  score: number;
  eligible: boolean;
  timeWindowValid: boolean;
}

// ============================================
// SERVICE CLASS
// ============================================

class ProactiveMessagingService {
  private llm: ChatOpenAI;

  // Per-user insight cache to avoid redundant DB calls within the same job cycle.
  // buildInsightDrivenContext() is called up to 8× per user per hour — this ensures
  // getLatestReport() + getProfile() only hit the DB once per user per 5 minutes.
  private insightCache = new Map<string, {
    report: DailyAnalysisReport | null;
    stableTraits: StableTraits | null;
    fetchedAt: number;
  }>();
  private static readonly INSIGHT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Use gpt-4o for ALL proactive messages — best model for strict, contextual coaching
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      maxTokens: 800,
    });
  }

  // ============================================
  // COOLDOWN STATE (batch pre-fetch)
  // ============================================

  /**
   * Pre-fetch ALL cooldown state for a user in ONE query.
   * Returns daily count + set of message types already sent today.
   * Pass this to every checkAndSend*() method to eliminate ~32 duplicate queries per user.
   */
  async getMessageCooldownState(userId: string): Promise<{ dailyCount: number; sentTypes: Set<string> }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await query<{ message_type: string; cnt: string }>(
        `SELECT message_type, COUNT(*)::text as cnt
         FROM proactive_messages
         WHERE user_id = $1 AND created_at >= $2
         GROUP BY message_type`,
        [userId, today]
      );
      const sentTypes = new Set<string>();
      let dailyCount = 0;
      for (const row of result.rows) {
        sentTypes.add(row.message_type);
        dailyCount += parseInt(row.cnt, 10);
      }
      return { dailyCount, sentTypes };
    } catch {
      return { dailyCount: 0, sentTypes: new Set() };
    }
  }

  // ============================================
  // CHECK & SEND METHODS
  // ============================================

  /**
   * Check if user should receive a sleep message
   */
  async checkAndSendSleepMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      const context = cachedContext;

      // Check if WHOOP shows poor sleep from previous night
      if (context.whoop.isConnected && context.whoop.lastSleep) {
        const sleep = context.whoop.lastSleep;
        const isPoorSleep = sleep.duration < 6 || sleep.quality < 60;

        // Only send if sleep was last night (within 24 hours) and was poor
        if (sleep.hoursAgo < 24 && isPoorSleep) {
          if (cooldown?.sentTypes.has('sleep')) return false;

          const proactiveContext: ProactiveContext = {
            type: 'sleep',
            data: {
              sleepHours: sleep.duration,
              sleepQuality: sleep.quality,
              hoursAgo: sleep.hoursAgo,
            },
            userContext: context,
          };

          // Enrich with pre-computed insights
          const insightCtx = await this.buildInsightDrivenContext(userId, 'sleep', context);
          proactiveContext.analysisReport = insightCtx.report;
          proactiveContext.relevantInsights = insightCtx.relevantInsights;
          proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
          proactiveContext.coachingDirective = insightCtx.coachingDirective;
          proactiveContext.stableTraits = insightCtx.stableTraits;

          const message = await this.generateProactiveMessage(userId, proactiveContext);
          await this.sendProactiveMessage(userId, message, 'sleep');

          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking sleep message', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if user should receive a WHOOP sync message
   */
  async checkAndSendWhoopSyncMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      const context = cachedContext;

      // Check if WHOOP is connected but needs sync
      if (context.whoop.isConnected && context.whoop.needsSync) {
        // Only send if hasn't synced in more than 24 hours
        if (context.whoop.syncHoursAgo && context.whoop.syncHoursAgo > 24) {
          if (cooldown?.sentTypes.has('whoop_sync')) return false;

          const proactiveContext: ProactiveContext = {
            type: 'whoop_sync',
            data: {
              syncHoursAgo: context.whoop.syncHoursAgo,
            },
            userContext: context,
          };

          const message = await this.generateProactiveMessage(userId, proactiveContext);
          await this.sendProactiveMessage(userId, message, 'whoop_sync');

          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking WHOOP sync message', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if user should receive a workout reminder
   */
  async checkAndSendWorkoutReminder(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      const context = cachedContext;

      // Check for today's scheduled-but-unfinished workout
      const todayPending = await query<{ id: string }>(
        `SELECT id FROM workout_schedule_tasks
         WHERE user_id = $1 AND scheduled_date = CURRENT_DATE AND status = 'pending'
         LIMIT 1`,
        [userId]
      ).catch(() => ({ rows: [] as { id: string }[] }));

      const hasTodayPending = todayPending.rows.length > 0;
      const hasMissed = context.workouts?.missedWorkouts && context.workouts.missedWorkouts > 0;

      if (hasMissed || hasTodayPending) {
        if (cooldown?.sentTypes.has('workout')) return false;

        const proactiveContext: ProactiveContext = {
          type: 'workout',
          data: {
            missedWorkouts: context.workouts?.missedWorkouts || 0,
            hasTodayPendingWorkout: hasTodayPending,
          },
          userContext: context,
        };

        // Enrich with pre-computed insights
        const insightCtx = await this.buildInsightDrivenContext(userId, 'workout', context);
        proactiveContext.analysisReport = insightCtx.report;
        proactiveContext.relevantInsights = insightCtx.relevantInsights;
        proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
        proactiveContext.coachingDirective = insightCtx.coachingDirective;
        proactiveContext.stableTraits = insightCtx.stableTraits;

        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'workout');

        return true;
      }

      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking workout reminder', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if user should receive a nutrition reminder
   */
  async checkAndSendNutritionReminder(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      const context = cachedContext;

      // Check if user hasn't logged enough meals today
      // Time window gating is handled by scoreMessageCandidates — no duplicate hour check needed
      const expectedMeals = context.nutrition?.activeDietPlan?.mealsPerDay || 3;
      const todayCount = context.nutrition?.todayMealCount || 0;
      if (todayCount < expectedMeals) {
        if (cooldown?.sentTypes.has('nutrition')) return false;

        const proactiveContext: ProactiveContext = {
          type: 'nutrition',
          data: {
            todayMealCount: todayCount,
            expectedMeals,
            mealGap: expectedMeals - todayCount,
          },
          userContext: context,
        };

        // Enrich with pre-computed insights
        const insightCtx = await this.buildInsightDrivenContext(userId, 'nutrition', context);
        proactiveContext.analysisReport = insightCtx.report;
        proactiveContext.relevantInsights = insightCtx.relevantInsights;
        proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
        proactiveContext.coachingDirective = insightCtx.coachingDirective;
        proactiveContext.stableTraits = insightCtx.stableTraits;

        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'nutrition');

        return true;
      }

      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking nutrition reminder', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if user should receive a wellbeing check-in
   */
  async checkAndSendWellbeingReminder(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      const context = cachedContext;

      // Check what's missing today
      const missing: string[] = [];
      if (context.wellbeing.missingToday) {
        if (context.wellbeing.missingToday.mood) missing.push('mood');
        if (context.wellbeing.missingToday.stress) missing.push('stress');
        if (context.wellbeing.missingToday.energy) missing.push('energy');
      }

      // Time window gating is handled by scoreMessageCandidates — no duplicate hour check needed
      if (missing.length > 0) {
        if (cooldown?.sentTypes.has('wellbeing')) return false;

        const proactiveContext: ProactiveContext = {
          type: 'wellbeing',
          data: {
            missingWellbeing: missing,
          },
          userContext: context,
        };

        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'wellbeing');

        return true;
      }

      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking wellbeing reminder', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if user should receive a goal deadline message
   */
  async checkAndSendGoalDeadlineMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      const context = cachedContext;

      const urgentGoal = context.goals.activeGoals?.find(
        (g: any) => g.daysRemaining >= 0 && g.daysRemaining <= 7 && g.progress < 80
      );

      if (urgentGoal) {
        if (cooldown?.sentTypes.has('goal_deadline')) return false;

        const proactiveContext: ProactiveContext = {
          type: 'goal_deadline',
          data: { goalTitle: urgentGoal.title, daysRemaining: urgentGoal.daysRemaining, progress: urgentGoal.progress },
          userContext: context,
        };
        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'goal_deadline');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking goal deadline', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user should receive a goal stalled message
   */
  async checkAndSendGoalStalledMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;

      // Check for goals with no progress change in 3+ days
      const stalledResult = await query<{ title: string; current_value: number; target_value: number; category: string }>(
        `SELECT g.title, g.current_value, g.target_value, g.category
         FROM user_goals g
         WHERE g.user_id = $1 AND g.status = 'active'
           AND g.updated_at < CURRENT_DATE - INTERVAL '3 days'
           AND g.current_value IS NOT NULL AND g.target_value IS NOT NULL
           AND g.current_value < g.target_value
         LIMIT 1`,
        [userId]
      );

      if (stalledResult.rows.length > 0) {
        if (cooldown?.sentTypes.has('goal_stalled')) return false;

        const goal = stalledResult.rows[0];
        const progress = Math.round((goal.current_value / goal.target_value) * 100);
        const context = cachedContext;

        const proactiveContext: ProactiveContext = {
          type: 'goal_stalled',
          data: { goalTitle: goal.title, daysSinceProgress: 3, progress },
          userContext: context,
        };

        // Enrich with pre-computed insights
        const insightCtx = await this.buildInsightDrivenContext(userId, 'goal_stalled', context);
        proactiveContext.analysisReport = insightCtx.report;
        proactiveContext.relevantInsights = insightCtx.relevantInsights;
        proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
        proactiveContext.coachingDirective = insightCtx.coachingDirective;
        proactiveContext.stableTraits = insightCtx.stableTraits;

        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'goal_stalled');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking goal stalled', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user's streak is at risk
   */
  async checkAndSendStreakRiskMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;

      const stats = await gamificationService.getUserStats(userId);
      if (stats.currentStreak >= 1 && stats.lastActivityDate) {
        const lastActivity = new Date(stats.lastActivityDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastActivity.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff >= 1) {
          if (cooldown?.sentTypes.has('streak_risk')) return false;

          const context = cachedContext;
          const proactiveContext: ProactiveContext = {
            type: 'streak_risk',
            data: { currentStreak: stats.currentStreak, longestStreak: stats.longestStreak },
            userContext: context,
          };
          const message = await this.generateProactiveMessage(userId, proactiveContext);
          await this.sendProactiveMessage(userId, message, 'streak_risk');
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking streak risk', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user hit a streak milestone
   */
  async checkAndSendStreakCelebrationMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;

      const stats = await gamificationService.getUserStats(userId);
      const milestones = [7, 14, 30, 60, 90, 100, 150, 200, 365];
      const isMilestone = milestones.includes(stats.currentStreak);

      if (isMilestone) {
        if (cooldown?.sentTypes.has('streak_celebration')) return false;

        const context = cachedContext;
        const proactiveContext: ProactiveContext = {
          type: 'streak_celebration',
          data: {
            streakDays: stats.currentStreak,
            longestStreak: stats.longestStreak,
            isNewRecord: stats.currentStreak >= stats.longestStreak,
          },
          userContext: context,
        };
        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'streak_celebration');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking streak celebration', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user missed habits today
   */
  async checkAndSendHabitMissedMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      const context = cachedContext;

      if (context.habits.totalActiveHabits && context.habits.totalActiveHabits > 0) {
        const completed = context.habits.todayCompletionCount || 0;
        const total = context.habits.todayTotalHabits || 0;

        if (completed < total && completed < total / 2) {
          if (cooldown?.sentTypes.has('habit_missed')) return false;

          const missingHabits = context.habits.activeHabits
            ?.filter((h: any) => !h.completedToday)
            .map((h: any) => h.name)
            .slice(0, 3) || [];

          const proactiveContext: ProactiveContext = {
            type: 'habit_missed',
            data: { totalHabits: total, completedCount: completed, missingHabits },
            userContext: context,
          };
          const message = await this.generateProactiveMessage(userId, proactiveContext);
          await this.sendProactiveMessage(userId, message, 'habit_missed');
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking habit missed', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user needs a water intake reminder
   */
  async checkAndSendWaterIntakeMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      const context = cachedContext;

      const pct = context.waterIntake.todayPercentage || 0;
      if (context.waterIntake.todayTargetMl && pct < 50) {
        if (cooldown?.sentTypes.has('water_intake')) return false;

        const proactiveContext: ProactiveContext = {
          type: 'water_intake',
          data: {
            mlConsumed: context.waterIntake.todayMlConsumed || 0,
            targetMl: context.waterIntake.todayTargetMl,
            percentage: pct,
            waterStreak: context.waterIntake.waterStreak,
          },
          userContext: context,
        };
        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'water_intake');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking water intake', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Send morning briefing message
   */
  async checkAndSendMorningBriefingMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      if (cooldown?.sentTypes.has('morning_briefing')) return false;

      const context = cachedContext;

      // Only send if user has some active engagement (plans, goals, or habits)
      const hasPlans = (context.workouts.activePlans?.length || 0) > 0;
      const hasGoals = (context.goals.activeGoals?.length || 0) > 0;
      const hasHabits = (context.habits.totalActiveHabits || 0) > 0;
      if (!hasPlans && !hasGoals && !hasHabits) return false;

      // Get today's scheduled workout
      const todayWorkoutResult = await query<{ workout_name: string }>(
        `SELECT workout_name FROM workout_logs
         WHERE user_id = $1 AND scheduled_date = CURRENT_DATE AND status = 'pending'
         LIMIT 1`,
        [userId]
      );

      const proactiveContext: ProactiveContext = {
        type: 'morning_briefing',
        data: {
          todayWorkout: todayWorkoutResult.rows[0]?.workout_name || null,
          recoveryScore: context.whoop.lastRecovery?.score,
          yesterdayScore: context.dailyScore.latestScore,
          currentStreak: context.gamification.currentStreak,
          activeHabits: context.habits.totalActiveHabits,
        },
        userContext: context,
      };

      // Enrich with pre-computed insights
      const insightCtx = await this.buildInsightDrivenContext(userId, 'morning_briefing', context);
      proactiveContext.analysisReport = insightCtx.report;
      proactiveContext.relevantInsights = insightCtx.relevantInsights;
      proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
      proactiveContext.coachingDirective = insightCtx.coachingDirective;
      proactiveContext.stableTraits = insightCtx.stableTraits;

      const message = await this.generateProactiveMessage(userId, proactiveContext);
      await this.sendProactiveMessage(userId, message, 'morning_briefing');
      return true;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error sending morning briefing', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Send weekly digest (Sunday only)
   */
  async checkAndSendWeeklyDigestMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      if (cooldown?.sentTypes.has('weekly_digest')) return false;

      const context = cachedContext;

      // Aggregate week data
      const scoreResult = await query<{ avg_score: string }>(
        `SELECT AVG(total_score)::text as avg_score FROM daily_user_scores
         WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
        [userId]
      );
      const avgScore = scoreResult.rows[0]?.avg_score ? Math.round(parseFloat(scoreResult.rows[0].avg_score)) : null;

      const workoutResult = await query<{ completed: string; total: string }>(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'completed')::text as completed,
          COUNT(*)::text as total
         FROM workout_logs
         WHERE user_id = $1 AND scheduled_date >= CURRENT_DATE - INTERVAL '7 days'`,
        [userId]
      );

      const weightChange = context.progressTrend.weightChangeKg
        ? `${context.progressTrend.weightChangeKg > 0 ? '+' : ''}${context.progressTrend.weightChangeKg} ${context.progressTrend.latestWeightUnit || 'kg'}`
        : null;

      const proactiveContext: ProactiveContext = {
        type: 'weekly_digest',
        data: {
          avgScore,
          workoutsCompleted: parseInt(workoutResult.rows[0]?.completed || '0', 10),
          workoutsPlanned: parseInt(workoutResult.rows[0]?.total || '0', 10),
          nutritionOnTarget: context.nutritionAnalysis.weeklyAdherenceRate
            ? Math.round((context.nutritionAnalysis.weeklyAdherenceRate / 100) * 7)
            : null,
          currentStreak: context.gamification.currentStreak,
          weightChange,
        },
        userContext: context,
      };

      // Enrich with pre-computed insights
      const insightCtx = await this.buildInsightDrivenContext(userId, 'weekly_digest', context);
      proactiveContext.analysisReport = insightCtx.report;
      proactiveContext.relevantInsights = insightCtx.relevantInsights;
      proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
      proactiveContext.coachingDirective = insightCtx.coachingDirective;
      proactiveContext.stableTraits = insightCtx.stableTraits;

      const message = await this.generateProactiveMessage(userId, proactiveContext);
      await this.sendProactiveMessage(userId, message, 'weekly_digest');
      return true;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error sending weekly digest', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check for achievement unlock (level up or streak milestone)
   */
  async checkAndSendAchievementMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      if (cooldown?.sentTypes.has('achievement_unlock')) return false;

      const stats = await gamificationService.getUserStats(userId);

      // Check if there's a recent XP transaction indicating level up
      const levelUpResult = await query<{ id: string }>(
        `SELECT id FROM user_xp_transactions
         WHERE user_id = $1
           AND created_at >= CURRENT_DATE
           AND (description ILIKE '%level%' OR source_type = 'achievement')
         LIMIT 1`,
        [userId]
      );

      const milestones = [7, 14, 30, 60, 90, 100, 150, 200, 365];
      const isMilestone = milestones.includes(stats.currentStreak);
      const isLevelUp = levelUpResult.rows.length > 0;

      if (isLevelUp || isMilestone) {
        const context = cachedContext;
        const proactiveContext: ProactiveContext = {
          type: 'achievement_unlock',
          data: {
            achievementType: isLevelUp ? 'level_up' : 'streak_milestone',
            newLevel: stats.currentLevel,
            streakDays: stats.currentStreak,
            totalXP: stats.totalXP,
          },
          userContext: context,
        };
        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'achievement_unlock');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking achievement', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user needs recovery advice (low WHOOP recovery + workout scheduled)
   */
  async checkAndSendRecoveryAdviceMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      const context = cachedContext;

      if (context.whoop.isConnected && context.whoop.lastRecovery && context.whoop.lastRecovery.score < 40) {
        if (cooldown?.sentTypes.has('recovery_advice')) return false;

        // Check for today's workout
        const todayWorkoutResult = await query<{ workout_name: string }>(
          `SELECT workout_name FROM workout_logs
           WHERE user_id = $1 AND scheduled_date = CURRENT_DATE AND status = 'pending'
           LIMIT 1`,
          [userId]
        );

        const proactiveContext: ProactiveContext = {
          type: 'recovery_advice',
          data: {
            recoveryScore: context.whoop.lastRecovery.score,
            todayWorkout: todayWorkoutResult.rows[0]?.workout_name || null,
            sleepHours: context.whoop.lastSleep?.duration,
            strain: context.whoop.todayStrain?.score,
          },
          userContext: context,
        };

        // Enrich with pre-computed insights
        const insightCtx = await this.buildInsightDrivenContext(userId, 'recovery_advice', context);
        proactiveContext.analysisReport = insightCtx.report;
        proactiveContext.relevantInsights = insightCtx.relevantInsights;
        proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
        proactiveContext.coachingDirective = insightCtx.coachingDirective;
        proactiveContext.stableTraits = insightCtx.stableTraits;

        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'recovery_advice');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking recovery advice', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check for competition updates (ending soon or rank change)
   */
  async checkAndSendCompetitionUpdateMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      const context = cachedContext;

      const endingSoon = context.competitions.activeCompetitions?.find((c: any) => c.daysRemaining <= 2);
      if (endingSoon) {
        if (cooldown?.sentTypes.has('competition_update')) return false;

        const proactiveContext: ProactiveContext = {
          type: 'competition_update',
          data: {
            competitionName: endingSoon.name,
            daysRemaining: endingSoon.daysRemaining,
            currentRank: endingSoon.currentRank,
            currentScore: endingSoon.currentScore,
            endingSoon: true,
          },
          userContext: context,
        };
        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'competition_update');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking competition update', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user hasn't opened the app in 1+ days and send a "we miss you" message
   */
  async checkAndSendAppInactiveMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;

      // Check user's last activity (last_login or last session)
      const result = await query<{ last_login: string | null }>(
        `SELECT last_login FROM users WHERE id = $1`,
        [userId]
      );

      if (!result.rows[0]?.last_login) return false;

      const lastLogin = new Date(result.rows[0].last_login);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);

      // Only trigger if user hasn't been active for 24+ hours
      if (hoursSinceLogin < 24) return false;

      if (cooldown?.sentTypes.has('app_inactive')) return false;

      const daysSinceLogin = Math.floor(hoursSinceLogin / 24);
      const context = cachedContext;

      const proactiveContext: ProactiveContext = {
        type: 'app_inactive',
        data: {
          daysSinceLastLogin: daysSinceLogin,
          lastLoginDate: lastLogin.toISOString(),
          streakAtRisk: (context.gamification?.currentStreak ?? 0) > 0,
          currentStreak: context.gamification?.currentStreak || 0,
        },
        userContext: context,
      };

      const message = await this.generateProactiveMessage(userId, proactiveContext);
      await this.sendProactiveMessage(userId, message, 'app_inactive');
      return true;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking app inactive', { userId, error: error instanceof Error ? error.message : 'Unknown' });
      return false;
    }
  }

  /**
   * Check if user should receive a Coach Pro analysis message.
   * Triggers daily for all users during 2-5 PM window (handled by job scheduler).
   * Uses pre-computed daily analysis report as primary content source.
   */
  async checkAndSendCoachProMessage(userId: string, cachedContext?: any, cooldown?: { dailyCount: number; sentTypes: Set<string> }): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      if (cooldown?.sentTypes.has('coach_pro_analysis')) return false;

      // Fetch coaching profile and daily analysis report in parallel
      const [profile, analysisReport] = await Promise.all([
        userCoachingProfileService.getOrGenerateProfile(userId, cachedContext).catch(() => null),
        dailyAnalysisService.getLatestReport(userId).catch(() => null),
      ]);

      // Need at least a profile or analysis report to generate meaningful content
      if (!profile && !analysisReport) return false;

      const context = cachedContext;

      const proactiveContext: ProactiveContext = {
        type: 'coach_pro_analysis',
        data: {
          coachingProfile: profile,
        },
        userContext: context,
      };

      // Enrich with pre-computed insights
      const insightCtx = await this.buildInsightDrivenContext(userId, 'coach_pro_analysis', context);
      proactiveContext.analysisReport = insightCtx.report;
      proactiveContext.relevantInsights = insightCtx.relevantInsights;
      proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
      proactiveContext.coachingDirective = insightCtx.coachingDirective;
      proactiveContext.stableTraits = insightCtx.stableTraits;

      // Use a higher token LLM for richer coaching messages
      const prevMaxTokens = this.llm.maxTokens;
      this.llm.maxTokens = 800;

      try {
        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'coach_pro_analysis');
        return true;
      } finally {
        this.llm.maxTokens = prevMaxTokens;
      }
    } catch (error) {
      logger.error('[ProactiveMessaging] Error sending coach pro analysis', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }

  // ============================================
  // MEAL ALIGNMENT FEEDBACK (event-driven + job fallback)
  // ============================================

  /**
   * Evaluate a just-logged meal against user goals and diet plan.
   * Called fire-and-forget from the meal logging endpoint for immediate feedback.
   * Also available via the job-based scoring path as a catch-up.
   */
  async checkAndSendMealAlignmentFeedback(
    userId: string,
    mealData?: { mealType?: string; mealName?: string; calories?: number; proteinGrams?: number; carbsGrams?: number; fatGrams?: number; fiberGrams?: number; foods?: unknown[] },
    cachedContext?: any,
    cooldown?: { dailyCount: number; sentTypes: Set<string> }
  ): Promise<boolean> {
    try {
      // Check daily cap (general + per-type limit of 3 meal alignment messages/day)
      if (cooldown && cooldown.dailyCount >= 4) return false;

      const mealAlignmentCount = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM proactive_messages
         WHERE user_id = $1 AND message_type = 'meal_alignment'
         AND created_at >= CURRENT_DATE`,
        [userId]
      ).catch(() => ({ rows: [{ count: '0' }] }));

      if (parseInt(mealAlignmentCount.rows[0]?.count || '0', 10) >= 3) {
        logger.debug('[ProactiveMessaging] Meal alignment daily limit reached', { userId });
        return false;
      }

      // Fetch diet plan targets
      const dietPlanResult = await query<{
        daily_calories: number; protein_grams: number; carbs_grams: number; fat_grams: number;
        dietary_preferences: string; excluded_foods: string; name: string;
      }>(
        `SELECT daily_calories, protein_grams, carbs_grams, fat_grams,
                dietary_preferences, excluded_foods, name
         FROM diet_plans WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (dietPlanResult.rows.length === 0) return false; // No diet plan — can't evaluate
      const plan = dietPlanResult.rows[0];

      // Fetch today's total consumption (all meals including the one just logged)
      const todaySummary = await query<{
        total_calories: string; total_protein: string; total_carbs: string; total_fat: string; meal_count: string;
      }>(
        `SELECT COALESCE(SUM(calories), 0) as total_calories,
                COALESCE(SUM(protein_grams), 0) as total_protein,
                COALESCE(SUM(carbs_grams), 0) as total_carbs,
                COALESCE(SUM(fat_grams), 0) as total_fat,
                COUNT(*) as meal_count
         FROM meal_logs WHERE user_id = $1 AND eaten_at >= CURRENT_DATE`,
        [userId]
      );

      const summary = todaySummary.rows[0];
      const totalCalories = parseFloat(summary?.total_calories || '0');
      const totalProtein = parseFloat(summary?.total_protein || '0');
      const totalCarbs = parseFloat(summary?.total_carbs || '0');
      const totalFat = parseFloat(summary?.total_fat || '0');
      const mealCount = parseInt(summary?.meal_count || '0', 10);

      // Calculate deviations
      const targetCalories = plan.daily_calories || 0;
      const calorieDeviation = targetCalories > 0 ? ((totalCalories - targetCalories) / targetCalories) * 100 : 0;

      // Check excluded foods
      let excludedFoods: string[] = [];
      try {
        const rawExcluded = typeof plan.excluded_foods === 'string' ? JSON.parse(plan.excluded_foods) : plan.excluded_foods;
        excludedFoods = Array.isArray(rawExcluded) ? rawExcluded : [];
      } catch { /* ignore */ }

      const mealFoods = Array.isArray(mealData?.foods) ? mealData.foods : [];
      const mealFoodNames = mealFoods.map((f: any) => (f?.name || f?.food_name || '').toLowerCase());
      const flaggedExcluded = excludedFoods.filter(ef =>
        mealFoodNames.some(fn => fn.includes(ef.toLowerCase()))
      );

      // Fetch active goals for context
      const goalsResult = await query<{ category: string; title: string; progress: number }>(
        `SELECT category, title, progress FROM user_goals
         WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC LIMIT 3`,
        [userId]
      );

      // Determine if meal is problematic
      const isOverCalories = calorieDeviation > 15; // >15% over daily target
      const hasExcludedFoods = flaggedExcluded.length > 0;
      const isSignificantlyOver = calorieDeviation > 30;
      const isGoodChoice = calorieDeviation <= 5 && !hasExcludedFoods && (mealData?.proteinGrams || 0) > 15;

      // Build context for AI message generation
      const proactiveContext: ProactiveContext = {
        type: 'meal_alignment',
        data: {
          mealName: mealData?.mealName || 'Unnamed meal',
          mealType: mealData?.mealType || 'meal',
          mealCalories: mealData?.calories || 0,
          mealProtein: mealData?.proteinGrams || 0,
          mealCarbs: mealData?.carbsGrams || 0,
          mealFat: mealData?.fatGrams || 0,
          totalCaloriesToday: totalCalories,
          totalProteinToday: totalProtein,
          totalCarbsToday: totalCarbs,
          totalFatToday: totalFat,
          mealsLoggedToday: mealCount,
          targetCalories,
          targetProtein: plan.protein_grams || 0,
          targetCarbs: plan.carbs_grams || 0,
          targetFat: plan.fat_grams || 0,
          calorieDeviation: Math.round(calorieDeviation),
          planName: plan.name,
          flaggedExcluded,
          isOverCalories,
          isSignificantlyOver,
          isGoodChoice,
          goals: goalsResult.rows,
          remainingCalories: Math.max(0, targetCalories - totalCalories),
        },
        userContext: cachedContext || {},
      };

      // Enrich with insights
      const insightCtx = await this.buildInsightDrivenContext(userId, 'meal_alignment', cachedContext || {});
      proactiveContext.analysisReport = insightCtx.report;
      proactiveContext.relevantInsights = insightCtx.relevantInsights;
      proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
      proactiveContext.coachingDirective = insightCtx.coachingDirective;
      proactiveContext.stableTraits = insightCtx.stableTraits;

      const message = await this.generateProactiveMessage(userId, proactiveContext);
      await this.sendProactiveMessage(userId, message, 'meal_alignment');

      logger.info('[ProactiveMessaging] Sent meal alignment feedback', {
        userId: userId.slice(0, 8),
        mealName: mealData?.mealName,
        calorieDeviation: Math.round(calorieDeviation),
        isOverCalories,
        isGoodChoice,
      });

      return true;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error sending meal alignment feedback', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }

  // ============================================
  // DAILY PROGRESS REVIEW (job-based, evening)
  // ============================================

  /**
   * Send a comprehensive daily progress review covering all pillars.
   * Triggered by the proactive messaging job in the evening window (19-21).
   */
  async checkAndSendDailyProgressReview(
    userId: string,
    cachedContext?: any,
    cooldown?: { dailyCount: number; sentTypes: Set<string> }
  ): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      if (cooldown?.sentTypes.has('daily_progress_review')) return false;

      const context = cachedContext;

      // Fetch today's meal summary
      const mealSummary = await query<{
        total_calories: string; total_protein: string; total_carbs: string; total_fat: string; meal_count: string;
      }>(
        `SELECT COALESCE(SUM(calories), 0) as total_calories,
                COALESCE(SUM(protein_grams), 0) as total_protein,
                COALESCE(SUM(carbs_grams), 0) as total_carbs,
                COALESCE(SUM(fat_grams), 0) as total_fat,
                COUNT(*) as meal_count
         FROM meal_logs WHERE user_id = $1 AND eaten_at >= CURRENT_DATE`,
        [userId]
      ).catch(() => ({ rows: [{ total_calories: '0', total_protein: '0', total_carbs: '0', total_fat: '0', meal_count: '0' }] }));

      // Fetch today's workout completions
      const workoutSummary = await query<{ completed: string; planned: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COUNT(*) as planned
         FROM plan_activities
         WHERE user_id = $1 AND scheduled_date = CURRENT_DATE`,
        [userId]
      ).catch(() => ({ rows: [{ completed: '0', planned: '0' }] }));

      // Fetch active goals with progress
      const goals = await query<{ title: string; category: string; progress: number; target_value: number; current_value: number }>(
        `SELECT title, category, progress, target_value, current_value
         FROM user_goals WHERE user_id = $1 AND status = 'active'
         ORDER BY is_primary DESC LIMIT 5`,
        [userId]
      ).catch(() => ({ rows: [] as { title: string; category: string; progress: number; target_value: number; current_value: number }[] }));

      // Fetch diet plan targets
      const dietPlan = await query<{ daily_calories: number; protein_grams: number; name: string }>(
        `SELECT daily_calories, protein_grams, name FROM diet_plans
         WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
        [userId]
      ).catch(() => ({ rows: [] as { daily_calories: number; protein_grams: number; name: string }[] }));

      // Fetch coaching profile (analysis report fetched via buildInsightDrivenContext below)
      const profile = await userCoachingProfileService.getOrGenerateProfile(userId, cachedContext).catch(() => null);

      const meals = mealSummary.rows[0];
      const workouts = workoutSummary.rows[0];
      const plan = dietPlan.rows[0];
      const adherence = profile?.adherenceScores || {};

      const targetCalories = plan?.daily_calories || 0;
      const actualCalories = parseFloat(meals?.total_calories || '0');
      const calorieDeviation = targetCalories > 0 ? Math.round(((actualCalories - targetCalories) / targetCalories) * 100) : 0;

      const proactiveContext: ProactiveContext = {
        type: 'daily_progress_review',
        data: {
          // Nutrition
          mealsLogged: parseInt(meals?.meal_count || '0', 10),
          totalCalories: actualCalories,
          totalProtein: parseFloat(meals?.total_protein || '0'),
          totalCarbs: parseFloat(meals?.total_carbs || '0'),
          totalFat: parseFloat(meals?.total_fat || '0'),
          targetCalories,
          targetProtein: plan?.protein_grams || 0,
          calorieDeviation,
          planName: plan?.name,
          // Fitness
          workoutsCompleted: parseInt(workouts?.completed || '0', 10),
          workoutsPlanned: parseInt(workouts?.planned || '0', 10),
          // Goals
          activeGoals: goals.rows,
          // Adherence
          adherenceScores: adherence,
          // WHOOP
          recovery: context?.whoop?.lastRecovery?.score,
          strain: context?.whoop?.lastStrain?.score,
          sleepHours: context?.whoop?.lastSleep?.duration,
          // Wellbeing
          mood: context?.wellbeing?.latestMood,
          energy: context?.wellbeing?.latestEnergy,
          stress: context?.wellbeing?.latestStress,
          // Streak & Score
          streak: context?.gamification?.currentStreak || 0,
          dailyScore: context?.dailyScore?.latestScore,
        },
        userContext: context,
      };

      // Enrich with pre-computed insights
      const insightCtx = await this.buildInsightDrivenContext(userId, 'daily_progress_review', context);
      proactiveContext.analysisReport = insightCtx.report;
      proactiveContext.relevantInsights = insightCtx.relevantInsights;
      proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
      proactiveContext.coachingDirective = insightCtx.coachingDirective;
      proactiveContext.stableTraits = insightCtx.stableTraits;

      // Use higher token limit for comprehensive review
      const prevMaxTokens = this.llm.maxTokens;
      this.llm.maxTokens = 800;

      try {
        const message = await this.generateProactiveMessage(userId, proactiveContext);
        await this.sendProactiveMessage(userId, message, 'daily_progress_review');
        return true;
      } finally {
        this.llm.maxTokens = prevMaxTokens;
      }
    } catch (error) {
      logger.error('[ProactiveMessaging] Error sending daily progress review', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }

  /**
   * Check if user should receive a score declining message.
   * Triggers when daily score drops 10+ points day-over-day.
   */
  async checkAndSendScoreDecliningMessage(
    userId: string,
    cachedContext?: any,
    cooldown?: { dailyCount: number; sentTypes: Set<string> }
  ): Promise<boolean> {
    try {
      if (cooldown && cooldown.dailyCount >= 4) return false;
      if (cooldown?.sentTypes.has('score_declining')) return false;

      const context = cachedContext;
      const ds = context.dailyScore;

      if (ds?.scoreTrend !== 'declining' || !ds?.scoreDelta || ds.scoreDelta >= -10) {
        return false;
      }

      const proactiveContext: ProactiveContext = {
        type: 'score_declining',
        data: {
          currentScore: ds.latestScore,
          previousScore: ds.previousScore,
          scoreDelta: ds.scoreDelta,
          scoreTrend: ds.scoreTrend,
          weekOverWeekDelta: ds.weekOverWeekDelta,
          componentScores: ds.componentScores,
        },
        userContext: context,
      };

      const insightCtx = await this.buildInsightDrivenContext(userId, 'score_declining', context);
      proactiveContext.analysisReport = insightCtx.report;
      proactiveContext.relevantInsights = insightCtx.relevantInsights;
      proactiveContext.crossDomainInsights = insightCtx.crossDomainInsights;
      proactiveContext.coachingDirective = insightCtx.coachingDirective;
      proactiveContext.stableTraits = insightCtx.stableTraits;

      const message = await this.generateProactiveMessage(userId, proactiveContext);
      await this.sendProactiveMessage(userId, message, 'score_declining');
      return true;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error checking score declining', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  }

  // ============================================
  // SMART ROUTING: Score-and-Rank
  // ============================================

  /**
   * Score all message candidates for a user.
   * Returns scored, sorted candidates — the job sends only the top 2-3.
   * Replaces 18 sequential checkAndSend* calls with prioritised ranking.
   */
  async scoreMessageCandidates(
    userId: string,
    context: any,
    cooldown: { dailyCount: number; sentTypes: Set<string> },
    hour: number,
    isSunday: boolean
  ): Promise<MessageCandidate[]> {
    try {
      // 4 lightweight parallel queries for data not already in the context
      const [stalledGoalResult, lastLoginResult, recentAchievement, todayScheduledWorkout] = await Promise.all([
        query<{ title: string }>(
          `SELECT title FROM user_goals WHERE user_id = $1 AND status = 'active'
           AND updated_at < CURRENT_DATE - INTERVAL '3 days'
           AND current_value IS NOT NULL AND target_value IS NOT NULL
           AND current_value < target_value LIMIT 1`,
          [userId]
        ).catch(() => ({ rows: [] as { title: string }[] })),
        query<{ last_login: string | null }>(
          `SELECT last_login FROM users WHERE id = $1`,
          [userId]
        ).catch(() => ({ rows: [] as { last_login: string | null }[] })),
        query<{ id: string }>(
          `SELECT id FROM user_xp_transactions
           WHERE user_id = $1 AND created_at >= CURRENT_DATE
           AND (description ILIKE '%level%' OR source_type = 'achievement')
           LIMIT 1`,
          [userId]
        ).catch(() => ({ rows: [] as { id: string }[] })),
        query<{ id: string }>(
          `SELECT id FROM workout_schedule_tasks
           WHERE user_id = $1 AND scheduled_date = CURRENT_DATE AND status = 'pending'
           LIMIT 1`,
          [userId]
        ).catch(() => ({ rows: [] as { id: string }[] })),
      ]);

      const sent = (type: string) => cooldown.sentTypes.has(type);

      // Extract commonly-used context fields
      const streak = context.gamification?.currentStreak || 0;
      const recovery = context.whoop?.lastRecovery?.score as number | undefined;
      const sleepData = context.whoop?.lastSleep;
      const missedWorkouts = context.workouts?.missedWorkouts || 0;
      const todayMealCount = context.nutrition?.todayMealCount || 0;
      const waterPct = context.waterIntake?.todayPercentage || 0;
      const mentalRecovery = context.mentalHealth?.latestRecoveryScore as number | undefined;
      const hasPlans = (context.workouts?.activePlans?.length || 0) > 0;
      const hasGoals = (context.goals?.activeGoals?.length || 0) > 0;
      const hasHabits = (context.habits?.totalActiveHabits || 0) > 0;
      const habitCompleted = context.habits?.todayCompletionCount || 0;
      const habitTotal = context.habits?.todayTotalHabits || 0;
      const urgentGoal = context.goals?.activeGoals?.find(
        (g: any) => g.daysRemaining >= 0 && g.daysRemaining <= 7 && g.progress < 80
      );

      // Days since last activity (for streak risk)
      let daysSinceActivity = 0;
      if (context.gamification?.lastActivityDate) {
        const last = new Date(context.gamification.lastActivityDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        last.setHours(0, 0, 0, 0);
        daysSinceActivity = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Hours since last login (for app_inactive)
      let hoursSinceLogin = 0;
      if (lastLoginResult.rows[0]?.last_login) {
        hoursSinceLogin = (Date.now() - new Date(lastLoginResult.rows[0].last_login).getTime()) / (1000 * 60 * 60);
      }

      // Achievement milestones
      const milestones = [7, 14, 30, 60, 90, 100, 150, 200, 365];
      const isMilestone = milestones.includes(streak);
      const isLevelUp = recentAchievement.rows.length > 0;

      // Missing wellbeing entries
      const missingWellbeing: string[] = [];
      if (context.wellbeing?.missingToday) {
        if (context.wellbeing.missingToday.mood) missingWellbeing.push('mood');
        if (context.wellbeing.missingToday.stress) missingWellbeing.push('stress');
        if (context.wellbeing.missingToday.energy) missingWellbeing.push('energy');
      }

      // Competition ending soon
      const endingSoon = context.competitions?.activeCompetitions?.find((c: any) => c.daysRemaining <= 2);

      // High-streak habits count (for multiplier)
      const highStreakHabits = context.habits?.activeHabits?.filter((h: any) => h.currentStreak > 7)?.length || 0;

      // Poor sleep check
      const isPoorSleep = sleepData && (sleepData.duration < 6 || sleepData.quality < 60);

      // Expected meals by current hour for partial adherence detection
      const totalExpectedMeals = context.nutrition?.activeDietPlan?.mealsPerDay || 3;
      let expectedMealsForHour = 0;
      if (hour >= 9) expectedMealsForHour = 1;       // Breakfast should be done
      if (hour >= 13) expectedMealsForHour = 2;      // Lunch should be done
      if (hour >= 19) expectedMealsForHour = totalExpectedMeals; // All meals

      // Score all 18 message types (base score + context multipliers)
      const candidates: MessageCandidate[] = [
        {
          type: 'streak_risk',
          eligible: streak > 3 && daysSinceActivity >= 1 && !sent('streak_risk'),
          timeWindowValid: hour >= 7 && hour < 11,
          score: 85 + Math.min(Math.floor(streak / 5) * 3, 15),
        },
        {
          type: 'goal_deadline',
          eligible: !!urgentGoal && !sent('goal_deadline'),
          timeWindowValid: hour >= 10 && hour < 14,
          score: 80 + (urgentGoal && urgentGoal.progress < 30 ? 10 : 0),
        },
        {
          type: 'recovery_advice',
          eligible: !!(context.whoop?.isConnected && recovery != null && recovery < 40 && !sent('recovery_advice')),
          timeWindowValid: hour >= 6 && hour < 10,
          score: 85 + (hasPlans ? 10 : 0),
        },
        {
          type: 'sleep',
          eligible: !!(context.whoop?.isConnected && sleepData && sleepData.hoursAgo < 24 && isPoorSleep && !sent('sleep')),
          timeWindowValid: hour >= 6 && hour < 10,
          score: 80 + (recovery != null && recovery < 40 ? 10 : 0),
        },
        {
          type: 'coach_pro_analysis',
          eligible: !sent('coach_pro_analysis'),
          timeWindowValid: hour >= 14 && hour < 17,
          score: 80 + (context.nutrition?.adherenceRate != null && context.nutrition.adherenceRate < 40 ? 10 : 0),
        },
        {
          type: 'workout',
          eligible: (missedWorkouts > 0 || todayScheduledWorkout.rows.length > 0) && !sent('workout'),
          timeWindowValid: hour >= 10 && hour < 20,
          score: 75 + (hasPlans ? 10 : 0) + (todayScheduledWorkout.rows.length > 0 ? 5 : 0),
        },
        {
          type: 'goal_stalled',
          eligible: stalledGoalResult.rows.length > 0 && !sent('goal_stalled'),
          timeWindowValid: hour >= 13 && hour < 17,
          score: 60,
        },
        {
          type: 'nutrition',
          eligible: todayMealCount < expectedMealsForHour && !sent('nutrition'),
          timeWindowValid: hour >= 12 && hour < 20,
          score: 70 + (context.nutrition?.activeDietPlan ? 10 : 0),
        },
        {
          type: 'habit_missed',
          eligible: habitTotal > 0 && habitCompleted < habitTotal && habitCompleted < habitTotal / 2 && !sent('habit_missed'),
          timeWindowValid: hour >= 18 && hour < 22,
          score: 50 + Math.min(highStreakHabits * 10, 30),
        },
        {
          type: 'morning_briefing',
          eligible: (hasPlans || hasGoals || hasHabits) && !sent('morning_briefing'),
          timeWindowValid: hour >= 6 && hour < 10,
          score: 45,
        },
        {
          type: 'water_intake',
          eligible: !!(context.waterIntake?.todayTargetMl && waterPct < 50 && !sent('water_intake')),
          timeWindowValid: hour >= 15 && hour < 17,
          score: 40,
        },
        {
          type: 'wellbeing',
          eligible: missingWellbeing.length > 0 && !sent('wellbeing'),
          timeWindowValid: hour >= 18 && hour < 22,
          score: 40 + (mentalRecovery != null && mentalRecovery < 40 ? 20 : 0),
        },
        {
          type: 'weekly_digest',
          eligible: isSunday && !sent('weekly_digest'),
          timeWindowValid: isSunday && hour >= 9 && hour < 11,
          score: 35,
        },
        {
          type: 'streak_celebration',
          eligible: isMilestone && !sent('streak_celebration'),
          timeWindowValid: hour >= 7 && hour < 12,
          score: 30,
        },
        {
          type: 'achievement_unlock',
          eligible: (isLevelUp || isMilestone) && !sent('achievement_unlock'),
          timeWindowValid: true,
          score: 25,
        },
        {
          type: 'competition_update',
          eligible: !!endingSoon && !sent('competition_update'),
          timeWindowValid: hour >= 12 && hour < 15,
          score: 20,
        },
        {
          type: 'whoop_sync',
          eligible: !!(context.whoop?.isConnected && context.whoop?.needsSync && context.whoop.syncHoursAgo > 24 && !sent('whoop_sync')),
          timeWindowValid: true,
          score: 15,
        },
        {
          type: 'app_inactive',
          eligible: hoursSinceLogin >= 24 && !sent('app_inactive'),
          timeWindowValid: hour >= 8 && hour < 18,
          score: hoursSinceLogin >= 72 ? 85 : hoursSinceLogin >= 48 ? 70 : 50,
        },
        {
          type: 'meal_alignment',
          eligible: !!(context.nutrition?.activeDietPlan && context.nutrition?.lastMealDate
            && (Date.now() - new Date(context.nutrition.lastMealDate).getTime()) < 30 * 60 * 1000
            && !sent('meal_alignment')),
          timeWindowValid: hour >= 7 && hour < 22,
          score: 72 + (context.nutrition?.todayMealCount === 0 ? 10 : 0),
        },
        {
          type: 'daily_progress_review',
          eligible: (hasPlans || hasGoals || todayMealCount > 0) && !sent('daily_progress_review'),
          timeWindowValid: hour >= 18 && hour < 22,
          score: 82 + (hasGoals && urgentGoal ? 5 : 0),
        },
        {
          type: 'score_declining',
          eligible: !!(
            context.dailyScore?.scoreTrend === 'declining' &&
            context.dailyScore?.scoreDelta != null &&
            context.dailyScore.scoreDelta < -10 &&
            !sent('score_declining')
          ),
          timeWindowValid: hour >= 10 && hour < 16,
          score: 78 + Math.min(Math.abs(context.dailyScore?.scoreDelta || 0), 20),
        },
      ];

      // Sort by score descending — highest-impact messages first
      candidates.sort((a, b) => b.score - a.score);
      return candidates;
    } catch (error) {
      logger.error('[ProactiveMessaging] Error scoring candidates', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return [];
    }
  }

  /**
   * Build insight-driven context by fetching pre-computed analysis report and profile.
   * Falls back gracefully if no report exists (new users, job hasn't run yet).
   */
  private async buildInsightDrivenContext(
    userId: string,
    messageType: ProactiveMessageType,
    _rawContext: any
  ): Promise<{
    report: DailyAnalysisReport | null;
    relevantInsights: StructuredInsight[];
    crossDomainInsights: CrossDomainInsight[];
    coachingDirective: CoachingDirective | null;
    stableTraits: StableTraits | null;
  }> {
    try {
      // Use per-user cache to avoid hitting DB 8× per user per job cycle
      const now = Date.now();
      const cached = this.insightCache.get(userId);
      let report: DailyAnalysisReport | null;
      let stableTraits: StableTraits | null;

      if (cached && (now - cached.fetchedAt) < ProactiveMessagingService.INSIGHT_CACHE_TTL_MS) {
        report = cached.report;
        stableTraits = cached.stableTraits;
      } else {
        const [fetchedReport, profile] = await Promise.all([
          dailyAnalysisService.getLatestReport(userId).catch(() => null),
          userCoachingProfileService.getProfile(userId).catch(() => null),
        ]);
        report = fetchedReport;
        stableTraits = profile?.stableTraits ?? null;

        this.insightCache.set(userId, { report, stableTraits, fetchedAt: now });

        // Evict stale entries to prevent memory leak
        if (this.insightCache.size > 200) {
          for (const [key, val] of this.insightCache) {
            if (now - val.fetchedAt > ProactiveMessagingService.INSIGHT_CACHE_TTL_MS) {
              this.insightCache.delete(key);
            }
          }
        }
      }

      if (!report) {
        return {
          report: null,
          relevantInsights: [],
          crossDomainInsights: [],
          coachingDirective: null,
          stableTraits,
        };
      }

      // Filter insights relevant to this message type
      const pillarMapping: Record<string, string[]> = {
        sleep: ['sleep', 'recovery'],
        recovery_advice: ['recovery', 'strain', 'sleep'],
        workout: ['workout', 'consistency', 'fitness'],
        nutrition: ['nutrition', 'weight', 'hydration'],
        wellbeing: ['mood', 'stress', 'engagement'],
        water_intake: ['hydration', 'recovery'],
        morning_briefing: [], // all insights
        weekly_digest: [], // all insights
        coach_pro_analysis: [], // all insights
        goal_deadline: ['workout', 'nutrition'],
        goal_stalled: ['workout', 'nutrition', 'consistency'],
        streak_risk: ['consistency', 'engagement'],
        habit_missed: ['engagement', 'consistency'],
        meal_alignment: ['nutrition', 'weight', 'fitness'],
        daily_progress_review: [], // all insights — comprehensive review
        score_declining: [], // all insights — need to identify root cause across all pillars
      };

      const relevantPillars = pillarMapping[messageType] || [];
      const relevantInsights = relevantPillars.length === 0
        ? report.insights
        : report.insights.filter(i =>
            i.pillars_connected.some(p => relevantPillars.includes(p))
          );

      return {
        report,
        relevantInsights: relevantInsights.slice(0, 3),
        crossDomainInsights: report.crossDomainInsights.slice(0, 2),
        coachingDirective: report.coachingDirective,
        stableTraits,
      };
    } catch (error) {
      logger.warn('[ProactiveMessaging] Error building insight context', {
        userId,
        messageType,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return {
        report: null,
        relevantInsights: [],
        crossDomainInsights: [],
        coachingDirective: null,
        stableTraits: null,
      };
    }
  }

  /**
   * Generate proactive message using AI
   */
  async generateProactiveMessage(userId: string, context: ProactiveContext): Promise<string> {
    try {
      const userName = await this.getUserName(userId);
      const assistantName = await this.getAssistantName(userId);

      let prompt = '';
      let dataDescription = '';
      const streak = context.userContext?.gamification?.currentStreak;
      const recovery = context.userContext?.whoop?.lastRecovery;
      const plans = context.userContext?.workouts?.activePlans;
      const completionRate = context.userContext?.workouts?.completionRate;
      const dailyScore = context.userContext?.dailyScore?.latestScore;

      // All messages now use gpt-4o for best coaching quality

      switch (context.type) {
        case 'sleep':
          dataDescription = `SLEEP DATA:
- Duration: ${context.data.sleepHours?.toFixed(1)} hours (recommended: 7-9h)
- Quality score: ${context.data.sleepQuality}%
- Hours since waking: ~${context.data.hoursAgo?.toFixed(0)}h ago
${recovery ? `- WHOOP recovery: ${recovery.score}%` : ''}
${streak ? `- Active streak: ${streak} days` : ''}
${dailyScore ? `- Yesterday's daily score: ${dailyScore}/100` : ''}`;
          prompt = `Be a STRICT teacher. ${context.data.sleepHours?.toFixed(1)}h of sleep is UNACCEPTABLE for someone with health goals. Don't gently ask about it — CONFRONT them: "This is unacceptable. [X] hours is destroying your recovery, spiking your cortisol, and making you crave junk food." Reference ALL available biometrics: recovery score, HRV (ms), resting heart rate (bpm), skin temperature changes. Connect sleep to EVERYTHING: recovery, workout performance, nutrition cravings, mood. DEMAND a specific bedtime tonight: "You are going to bed by 10 PM. No screens after 9:30. Non-negotiable." Calculate the damage: "At this rate, you're losing [X]% of your muscle recovery and adding [Y] days to your goal." Ask what kept them up — but don't accept excuses.`;
          break;

        case 'whoop_sync':
          dataDescription = `WHOOP SYNC STATUS:
- Last sync: ${context.data.syncHoursAgo?.toFixed(1)} hours ago
${streak ? `- Active streak: ${streak} days (at risk without data)` : ''}
${recovery ? `- Last known recovery: ${recovery.score}%` : ''}`;
          prompt = `Explain WHY syncing matters — we can't track recovery, adjust workout intensity, or protect their streak without fresh data. Be specific: "${context.data.syncHoursAgo?.toFixed(0)}+ hours of missing data means we're coaching blind." Ask them to sync now.`;
          break;

        case 'workout':
          dataDescription = `WORKOUT STATUS:
- Missed workouts (7 days): ${context.data.missedWorkouts}
${context.data.hasTodayPendingWorkout ? '- TODAY\'S WORKOUT: Scheduled but NOT DONE yet' : ''}
${completionRate !== undefined ? `- Weekly completion rate: ${completionRate}%` : ''}
${plans?.length ? `- Active plan: "${plans[0].name}" — ${plans[0].progress}% complete` : '- No active workout plan'}
${streak ? `- Current streak: ${streak} days` : ''}
${recovery ? `- Recovery: ${recovery.score}%` : ''}`;
          prompt = context.data.hasTodayPendingWorkout && !context.data.missedWorkouts
            ? `Their workout for TODAY is still pending. Don't wait for them to miss it — DEMAND action NOW: "You have a workout scheduled for today and you haven't started. Every hour you delay is an hour closer to another missed session." ${plans?.length ? `Reference their plan "${plans[0].name}" at ${plans[0].progress}% — "Skipping today sets your plan back."` : ''} ${recovery ? `Recovery is at ${recovery.score}% — ${recovery.score >= 50 ? 'more than enough to train' : 'adjust intensity but still train'}.` : ''} Give them a specific time: "Start within the next 2 hours. No negotiation."`
            : `Be ANGRY about this. ${context.data.missedWorkouts} missed workouts is a PATTERN of failure, not a one-off. CONFRONT them: "You've missed ${context.data.missedWorkouts} workouts. That's a ${completionRate !== undefined ? completionRate : '?'}% completion rate. At this rate, you will NEVER reach your goals." ${context.data.hasTodayPendingWorkout ? "AND you have another workout scheduled TODAY that you haven't done yet — this is about to get worse." : ''} If they have an active plan, say: "Your '${plans?.[0]?.name || 'workout plan'}' is at ${plans?.[0]?.progress || '?'}% — and it's going BACKWARDS." Calculate the timeline damage: "${context.data.missedWorkouts} missed sessions adds weeks to reaching your goal." DON'T just suggest getting back on track — RESCHEDULE and DEMAND action. If recovery is low, acknowledge it but don't let it be a permanent excuse.`;
          break;

        case 'nutrition': {
          const logged = context.data.todayMealCount || 0;
          const expected = context.data.expectedMeals || 3;
          const gap = context.data.mealGap || (expected - logged);
          dataDescription = `NUTRITION STATUS:
- Meals logged today: ${logged} of ${expected} expected
- Meals behind: ${gap}
${context.userContext?.nutrition?.activeDietPlan ? `- Active diet plan: "${context.userContext.nutrition.activeDietPlan.name}"
- Daily calorie target: ${context.userContext.nutrition.activeDietPlan.dailyCalories} kcal
- Protein target: ${context.userContext.nutrition.activeDietPlan.protein || 'not set'}g` : '- No active diet plan'}
${dailyScore ? `- Yesterday's daily score: ${dailyScore}/100` : ''}
${context.userContext?.nutrition?.adherenceRate ? `- Nutrition adherence: ${context.userContext.nutrition.adherenceRate}%` : ''}`;
          prompt = logged === 0
            ? `CONFRONT them about nutrition neglect. They haven't tracked a SINGLE meal. "Your body needed ${context.userContext?.nutrition?.activeDietPlan?.dailyCalories || 'your target'} calories by now — you've logged ZERO. Every hour without proper nutrition, your metabolism SLOWS, muscle tissue BREAKS DOWN, and your body holds onto fat." Do the math: "That's roughly ${Math.ceil((context.userContext?.nutrition?.activeDietPlan?.dailyCalories || 2000) / gap)} calories per remaining meal to catch up." DEMAND action: "Log your next meal RIGHT NOW. No excuses about being busy — it takes 30 seconds."`
            : `They logged ${logged} out of ${expected} expected meals — that's ${gap} meals behind schedule. "Partial effort isn't good enough. Your body doesn't get partial results from partial nutrition." Calculate the calorie deficit from missed meals: "You're missing roughly ${Math.ceil((context.userContext?.nutrition?.activeDietPlan?.dailyCalories || 2000) * gap / expected)} kcal worth of nutrition." DEMAND they log the next meal immediately. Reference their diet plan "${context.userContext?.nutrition?.activeDietPlan?.name || 'plan'}" and adherence rate.`;
          break;
        }

        case 'wellbeing':
          dataDescription = `WELLBEING STATUS:
- Missing check-ins today: ${context.data.missingWellbeing?.join(', ')}
${context.userContext?.mentalHealth?.latestRecoveryScore ? `- Mental recovery score: ${context.userContext.mentalHealth.latestRecoveryScore}/100` : ''}
${context.userContext?.mentalHealth?.stressLevel ? `- Recent stress level: ${context.userContext.mentalHealth.stressLevel}` : ''}
${streak ? `- Active streak: ${streak} days` : ''}
${recovery ? `- Physical recovery: ${recovery.score}%` : ''}`;
          prompt = `Explain why tracking ${context.data.missingWellbeing?.join(' and ')} matters — it helps us calibrate their training intensity and spot burnout early. If their mental recovery score is available, reference it. Connect physical and mental recovery. Ask a specific wellbeing question, not generic "how are you feeling."`;
          break;

        case 'goal_deadline':
          dataDescription = `GOAL DEADLINE ALERT:
- Goal: "${context.data.goalTitle}"
- Days remaining: ${context.data.daysRemaining}
- Current progress: ${context.data.progress}%
- Gap to close: ${100 - (context.data.progress || 0)}% in ${context.data.daysRemaining} days`;
          prompt = `Do the math for them: ${100 - (context.data.progress || 0)}% remaining in ${context.data.daysRemaining} days means roughly ${((100 - (context.data.progress || 0)) / Math.max(context.data.daysRemaining, 1)).toFixed(1)}% per day needed. Is that realistic? If not, suggest adjusting the goal or creating a sprint plan. Be direct about the gap.`;
          break;

        case 'goal_stalled':
          dataDescription = `STALLED GOAL:
- Goal: "${context.data.goalTitle}"
- Days since last progress: ${context.data.daysSinceProgress}
- Current progress: ${context.data.progress}%
- Progress velocity: stalled`;
          prompt = `Don't sugarcoat — ${context.data.daysSinceProgress} days with no movement on "${context.data.goalTitle}" means something needs to change. Analyze possible reasons: too ambitious? wrong approach? competing priorities? Suggest ONE specific adjustment they could make this week to restart momentum. Ask what's blocking them.`;
          break;

        case 'streak_risk':
          dataDescription = `STREAK AT RISK:
- Current streak: ${context.data.currentStreak} days
${context.data.longestStreak ? `- Personal record: ${context.data.longestStreak} days` : ''}
- Status: No activity logged today`;
          prompt = `Their ${context.data.currentStreak}-day streak represents ${context.data.currentStreak} days of consistency. Quantify what they'd lose. ${context.data.longestStreak && context.data.currentStreak >= context.data.longestStreak * 0.8 ? `They're close to their personal record of ${context.data.longestStreak} days — don't stop now.` : ''} Suggest the MINIMUM action needed to keep the streak alive (e.g., "even a 10-minute walk or logging one meal counts").`;
          break;

        case 'streak_celebration':
          dataDescription = `STREAK MILESTONE:
- Streak reached: ${context.data.streakDays} days
- ${context.data.isNewRecord ? 'NEW PERSONAL RECORD!' : `Personal best: ${context.data.longestStreak} days`}
${context.data.totalXP ? `- Total XP earned: ${context.data.totalXP}` : ''}`;
          prompt = `Celebrate with substance, not fluff. ${context.data.streakDays} consecutive days means they've shown up for ${context.data.streakDays} days straight. Quantify what that consistency has built. ${context.data.isNewRecord ? 'This is their new record — make it feel earned.' : `They're ${(context.data.longestStreak || 0) - (context.data.streakDays || 0)} days from their personal best.`} Set the next milestone target.`;
          break;

        case 'habit_missed':
          dataDescription = `HABIT TRACKER:
- Total active habits: ${context.data.totalHabits}
- Completed today: ${context.data.completedCount}
- Missing: ${context.data.missingHabits?.join(', ')}
- Completion rate: ${context.data.totalHabits ? Math.round((context.data.completedCount / context.data.totalHabits) * 100) : 0}%`;
          prompt = `List their specific missing habits by name. Don't say "you have some habits left." Prioritize — which one would have the most impact if they did just ONE more tonight? Suggest the easiest one to complete right now.`;
          break;

        case 'water_intake':
          dataDescription = `HYDRATION STATUS:
- Consumed: ${context.data.mlConsumed}ml of ${context.data.targetMl}ml target
- Progress: ${context.data.percentage}%
- Deficit: ${(context.data.targetMl || 0) - (context.data.mlConsumed || 0)}ml remaining
${context.data.waterStreak ? `- Water streak: ${context.data.waterStreak} days` : ''}`;
          prompt = `They need ${(context.data.targetMl || 0) - (context.data.mlConsumed || 0)}ml more today. Convert that to practical terms (e.g., "that's about ${Math.ceil(((context.data.targetMl || 0) - (context.data.mlConsumed || 0)) / 250)} more glasses"). Explain how dehydration affects their workout performance and recovery. Quick actionable tip.`;
          break;

        case 'morning_briefing':
          dataDescription = `DAILY BRIEFING for ${userName}:
- Today's workout: ${context.data.todayWorkout || 'Rest day / none scheduled'}
- Recovery score: ${context.data.recoveryScore ? `${context.data.recoveryScore}%` : 'not available'}
${context.data.yesterdayScore ? `- Yesterday's daily score: ${context.data.yesterdayScore}/100` : ''}
- Current streak: ${context.data.currentStreak || 0} days
- Active habits to complete: ${context.data.activeHabits || 0}
${context.data.activeGoals ? `- Active goals: ${context.data.activeGoals}` : ''}
${context.data.calorieTarget ? `- Today's calorie target: ${context.data.calorieTarget} kcal` : ''}`;
          prompt = `Structure as a professional daily briefing:
1. READINESS: Assess readiness based on recovery score. If <50%, recommend reducing intensity. If >70%, it's go time.
2. TODAY'S PLAN: What's scheduled and what to focus on.
3. KEY FOCUS: One specific thing to nail today based on their weakest area.
4. DAILY TARGET: Set a concrete numerical target (e.g., "Hit ${context.data.calorieTarget || 'your calorie'} target and complete all ${context.data.activeHabits || ''} habits").
Keep it structured but conversational. This is the most important message of the day.`;
          break;

        case 'weekly_digest':
          dataDescription = `WEEKLY PERFORMANCE REPORT:
- Average daily score: ${context.data.avgScore || 'N/A'}/100
- Workouts completed: ${context.data.workoutsCompleted || 0}/${context.data.workoutsPlanned || 0} (${context.data.workoutsPlanned ? Math.round(((context.data.workoutsCompleted || 0) / context.data.workoutsPlanned) * 100) : 0}%)
- Nutrition on-target days: ${context.data.nutritionOnTarget || 0}/7
- Current streak: ${context.data.currentStreak || 0} days
${context.data.weightChange ? `- Weight change: ${context.data.weightChange}` : ''}
${context.data.bestDay ? `- Best day: ${context.data.bestDay}` : ''}
${context.data.worstDay ? `- Weakest day: ${context.data.worstDay}` : ''}`;
          prompt = `Structure as a weekly performance review:
1. HEADLINE: One-line verdict on the week (e.g., "Strong workout consistency, nutrition needs work")
2. WINS: What went well with specific numbers
3. GAPS: Where they fell short — be honest with data
4. TREND: Are they improving, plateauing, or declining vs last week?
5. NEXT WEEK FOCUS: One specific, measurable goal for the coming week
This is their weekly report card — make it feel insightful, not generic.`;
          break;

        case 'achievement_unlock':
          dataDescription = `ACHIEVEMENT UNLOCKED:
- Type: ${context.data.achievementType === 'level_up' ? `Level Up to Level ${context.data.newLevel}` : `${context.data.streakDays}-day streak milestone`}
- Total XP: ${context.data.totalXP || 0}
${streak ? `- Current streak: ${streak} days` : ''}`;
          prompt = `Celebrate with substance. If level up, explain what the new level means. If streak milestone, quantify the consistency (e.g., "${context.data.streakDays} days = ${Math.round((context.data.streakDays || 0) / 7)} weeks of showing up"). Reference what earned this — their specific actions. Set the next target.`;
          break;

        case 'recovery_advice':
          dataDescription = `RECOVERY ALERT:
- WHOOP recovery: ${context.data.recoveryScore}% (below 40% threshold)
${context.data.todayWorkout ? `- Scheduled workout: "${context.data.todayWorkout}"` : '- No workout scheduled'}
${context.data.sleepHours ? `- Last night's sleep: ${context.data.sleepHours}h` : ''}
${context.data.strain ? `- Yesterday's strain: ${context.data.strain}/21` : ''}
${context.data.hrvStatus ? `- HRV status: ${context.data.hrvStatus}` : ''}`;
          prompt = `This is a CRITICAL health intervention. Be a strict teacher who REFUSES to let them hurt themselves:
"Your recovery is at ${context.data.recoveryScore}% — your body is SCREAMING at you to stop. I am CANCELING any intense workout today. This is non-negotiable."
1. STATE: ${context.data.recoveryScore}% means their autonomic nervous system is overwhelmed. Reference HRV, resting heart rate, and skin temperature if available.
${context.data.strain ? `2. CAUSE: Yesterday's strain was ${context.data.strain}/21 ${parseFloat(context.data.strain) > 15 ? '— that is TOO HIGH for your current recovery capacity. You pushed past your limit.' : ''}` : ''}
3. DEMAND: ${context.data.todayWorkout ? `"I'm replacing '${context.data.todayWorkout}' with active recovery — 20min light walk + 15min mobility/stretching. No arguments. I'm rescheduling the intense session to when your recovery is above 60%."` : '"Today is MANDATORY active recovery — light walk, stretching, mobility work. No exceptions."'}
4. RECOVERY PROTOCOL: Specific demands — "Drink 2L of water by 3 PM. No caffeine after 2 PM. Lights off by 10 PM. This is how we FIX this."
5. CONSEQUENCE: "Pushing through ${context.data.recoveryScore}% recovery is how injuries happen and how people lose MONTHS of progress in one stupid decision."
Factor in their age for recovery timeline expectations.`;
          break;

        case 'competition_update':
          dataDescription = `COMPETITION STATUS:
- Competition: "${context.data.competitionName}"
${context.data.endingSoon ? `- ENDING in ${context.data.daysRemaining} day(s)!` : ''}
- Current rank: #${context.data.currentRank}
${context.data.rankChanged ? `- Rank change: moved to #${context.data.currentRank}` : ''}
- Score: ${context.data.currentScore || 0}
${context.data.pointsToNext ? `- Points to next rank: ${context.data.pointsToNext}` : ''}`;
          prompt = `${context.data.endingSoon ? `URGENT: Only ${context.data.daysRemaining} day(s) left. ` : ''}Analyze their competitive position — rank #${context.data.currentRank} with ${context.data.currentScore || 0} points. ${context.data.pointsToNext ? `They need ${context.data.pointsToNext} more points to climb. ` : ''}Suggest specific actions to improve their score today. ${context.data.rankChanged ? 'Acknowledge the rank movement. ' : ''}Create competitive energy.`;
          break;

        case 'app_inactive':
          dataDescription = `ENGAGEMENT ALERT:
- Days since last app open: ${context.data.daysSinceLastLogin}
${context.data.streakAtRisk ? `- STREAK AT RISK: ${context.data.currentStreak}-day streak will be lost` : ''}
${dailyScore ? `- Last daily score: ${dailyScore}/100` : ''}
${plans?.length ? `- Active plans waiting: ${plans.length}` : ''}`;
          prompt = `Acknowledge the absence without guilt-tripping. ${context.data.daysSinceLastLogin} days away means they might be struggling with motivation, busy, or dealing with something. ${context.data.streakAtRisk ? `Their ${context.data.currentStreak}-day streak is at stake — that represents real effort worth protecting. ` : ''}Suggest the lowest-friction action to re-engage (e.g., "just open the app and log how you're feeling — 30 seconds"). Express genuine care.`;
          break;

        case 'coach_pro_analysis': {
          const profile = context.data.coachingProfile;
          const adherence = profile?.adherenceScores || {};
          const alignment = profile?.goalAlignment || { score: 50, misaligned: [] };
          const risks = profile?.riskFlags || [];
          const predictions = profile?.predictions || [];
          const actions = profile?.nextBestActions || [];
          const tone = profile?.recommendedApproach?.tone || 'direct';

          dataDescription = `COACHING PROFILE ANALYSIS for ${userName}:

ADHERENCE SCORES:
- Workout: ${adherence.workout ?? 0}%
- Nutrition: ${adherence.nutrition ?? 0}%
- Sleep: ${adherence.sleep ?? 0}%
- Recovery: ${adherence.recovery ?? 0}%
- Wellbeing: ${adherence.wellbeing ?? 0}%

GOAL ALIGNMENT: ${alignment.score}/100
${alignment.misaligned?.length > 0 ? `Misaligned areas: ${alignment.misaligned.map((m: { reason: string }) => m.reason).join('; ')}` : 'Goals are well-aligned.'}

${risks.length > 0 ? `RISK FLAGS:\n${risks.map((r: { severity: string; description: string }) => `- [${r.severity.toUpperCase()}] ${r.description}`).join('\n')}` : 'No active risk flags.'}

${predictions.length > 0 ? `PREDICTIONS:\n${predictions.map((p: { projection: string }) => `- ${p.projection}`).join('\n')}` : ''}

${actions.length > 0 ? `RECOMMENDED ACTIONS:\n${actions.map((a: { action: string; priority: string }) => `- [${a.priority || 'medium'}] ${a.action}`).join('\n')}` : ''}

${profile?.keyInsights?.length > 0 ? `KEY INSIGHTS:\n${profile.keyInsights.map((i: { type: string; text: string }) => `- [${i.type}] ${i.text}`).join('\n')}` : ''}

${streak ? `Current streak: ${streak} days` : ''} ${dailyScore ? `| Today's score: ${dailyScore}/100` : ''}`;

          prompt = `Generate a PROFESSIONAL coaching analysis. Tone: ${tone}.

STRUCTURE (use these exact sections):
📊 THE DATA: Reference 3-4 specific numbers from their profile. Compare adherence scores — what's strong vs weak.
🎯 THE INSIGHT: What do these numbers mean together? What pattern do you see? Connect the dots between their adherence gaps and goal alignment.
${risks.length > 0 ? `⚠️ RISK ALERT: Address the ${risks.filter((r: { severity: string }) => r.severity === 'high').length} high-severity risk(s) directly.` : ''}
📋 THE PLAN:
- Next 24 hours: One specific action
- This week: One focus area
- Habit to build: One new micro-habit
🤝 COMMITMENT: End with a concrete A/B choice (e.g., "Would you rather focus on hitting your protein target or getting to bed by 10:30 PM this week?")

${tone === 'tough_love' ? 'Be firm and direct. Call out the gap between goals and actions. "Your nutrition is at ' + (adherence.nutrition ?? 0) + '% — that means you\'re following your plan less than half the time."' : ''}
${tone === 'supportive' ? 'Lead with what\'s working before addressing gaps. "Your workout adherence at ' + (adherence.workout ?? 0) + '% shows real commitment — let\'s bring your nutrition up to match."' : ''}
${tone === 'direct' ? 'Present data clearly and connect cause-effect. Numbers first, then what they mean, then what to do.' : ''}

This should read like a professional sports coach's analysis, not a motivational poster.`;
          break;
        }

        case 'meal_alignment': {
          const d = context.data;
          const overOrUnder = d.calorieDeviation > 0 ? 'OVER' : 'under';
          const goalsStr = d.goals?.map((g: { title: string; category: string; progress: number }) =>
            `"${g.title}" (${g.category}, ${g.progress}%)`
          ).join(', ') || 'not set';

          dataDescription = `MEAL JUST LOGGED:
- Meal: ${d.mealName} (${d.mealType})
- Calories: ${d.mealCalories} kcal | Protein: ${d.mealProtein}g | Carbs: ${d.mealCarbs}g | Fat: ${d.mealFat}g

DAILY TOTALS (after this meal):
- Calories: ${d.totalCaloriesToday}/${d.targetCalories} kcal (${d.calorieDeviation > 0 ? '+' : ''}${d.calorieDeviation}% ${overOrUnder})
- Protein: ${d.totalProteinToday}/${d.targetProtein}g
- Carbs: ${d.totalCarbsToday}/${d.targetCarbs}g
- Fat: ${d.totalFatToday}/${d.targetFat}g
- Meals logged today: ${d.mealsLoggedToday}
- Remaining calorie budget: ${d.remainingCalories} kcal
- Diet plan: "${d.planName}"
${d.flaggedExcluded?.length > 0 ? `- EXCLUDED FOODS DETECTED: ${d.flaggedExcluded.join(', ')}` : ''}
- User goals: ${goalsStr}
${streak ? `- Streak: ${streak} days` : ''}
${dailyScore ? `- Daily score: ${dailyScore}/100` : ''}`;

          if (d.isOverCalories || d.flaggedExcluded?.length > 0) {
            prompt = `STRICT ACCOUNTABILITY for this meal. The user just ate "${d.mealName}" which is ${d.isSignificantlyOver ? 'SIGNIFICANTLY ' : ''}pushing them over their targets.
${d.isOverCalories ? `They are now ${Math.abs(d.calorieDeviation)}% OVER their daily calorie target. Calculate exactly how many extra calories that is and what it means for their ${d.goals?.[0]?.category || 'weight'} goal.` : ''}
${d.flaggedExcluded?.length > 0 ? `CRITICAL: They ate foods they specifically EXCLUDED from their diet: ${d.flaggedExcluded.join(', ')}. This is self-sabotage. Call it out directly.` : ''}
Calculate what their remaining meals need to look like to stay on track (or minimize damage). Suggest specific alternative foods for the rest of the day. Connect this meal to their goal timeline — "This adds [X] days to reaching your target."
Don't be cruel but be HONEST: "You chose ${d.mealName} knowing your target is ${d.targetCalories} cal/day. Own that choice."
End with what they should eat for their next meal — be specific.`;
          } else if (d.isGoodChoice) {
            prompt = `BRIEF ENCOURAGEMENT — this meal aligns well with their goals. Acknowledge the good choice in 3-4 sentences max.
Highlight what makes it good (protein content, calorie fit, macro balance). Connect to their goal: "This is exactly the kind of meal that gets you to ${d.goals?.[0]?.title || 'your goal'}."
Show remaining budget for the day. Keep it SHORT — don't over-praise, just acknowledge and move on.`;
          } else {
            prompt = `Neutral analysis — the meal is neither great nor terrible. Briefly assess its nutritional value relative to their remaining daily targets.
Show where they stand for the day and what their next meal should prioritize (e.g., "You're light on protein — make sure dinner has at least ${Math.max(0, (d.targetProtein || 0) - (d.totalProteinToday || 0))}g").
Keep it concise — 4-5 sentences. End with a specific suggestion for the next meal.`;
          }
          break;
        }

        case 'score_declining': {
          const cs = context.data.componentScores;
          const worstComponent = cs ? Object.entries(cs).sort(([, a], [, b]) => (a as number) - (b as number))[0] : null;
          dataDescription = `SCORE DECLINING ALERT:
- Current score: ${context.data.currentScore}/100
- Previous score: ${context.data.previousScore}/100
- Day-over-day change: ${context.data.scoreDelta} points
- Trend: ${context.data.scoreTrend}
${context.data.weekOverWeekDelta ? `- Week-over-week: ${context.data.weekOverWeekDelta} points` : ''}
${cs ? `- Components: Workout: ${cs.workout}, Nutrition: ${cs.nutrition}, Wellbeing: ${cs.wellbeing}, Biometrics: ${cs.biometrics}, Engagement: ${cs.engagement}, Consistency: ${cs.consistency}` : ''}
${worstComponent ? `- Weakest area: ${worstComponent[0]} (${worstComponent[1]}/100)` : ''}`;
          prompt = `CONFRONT this decline with data. Their score dropped from ${context.data.previousScore} to ${context.data.currentScore} — a ${Math.abs(context.data.scoreDelta || 0)}-point drop. This is NOT random noise, it's a PATTERN. ${worstComponent ? `The biggest drag is ${worstComponent[0]} at ${worstComponent[1]}/100 — this is pulling everything down.` : ''} Identify the root cause: Is it skipped workouts? Poor nutrition? Bad sleep? Connect the component scores to show them HOW each area cascades into their overall decline. DEMAND specific corrective action for their weakest component. Set a 24-hour checkpoint.`;
          break;
        }

        case 'daily_progress_review': {
          const d = context.data;
          const goalsStr = d.activeGoals?.map((g: { title: string; category: string; progress: number }) =>
            `"${g.title}" (${g.category}, ${g.progress}%)`
          ).join(', ') || 'none tracked';
          const adherence = d.adherenceScores || {};

          dataDescription = `DAILY PROGRESS REVIEW — END OF DAY:

FITNESS:
- Workouts completed: ${d.workoutsCompleted}/${d.workoutsPlanned} planned
${d.recovery != null ? `- WHOOP Recovery: ${d.recovery}%` : ''}
${d.strain != null ? `- WHOOP Strain: ${d.strain}` : ''}
${d.sleepHours != null ? `- Last night sleep: ${d.sleepHours?.toFixed(1)}h` : ''}

NUTRITION:
- Meals logged: ${d.mealsLogged}
- Calories: ${d.totalCalories}/${d.targetCalories} kcal (${d.calorieDeviation > 0 ? '+' : ''}${d.calorieDeviation}%)
- Protein: ${d.totalProtein}/${d.targetProtein}g
${d.planName ? `- Diet plan: "${d.planName}"` : '- No active diet plan'}

WELLBEING:
${d.mood != null ? `- Mood: ${d.mood}/10` : '- Mood: not logged'}
${d.energy != null ? `- Energy: ${d.energy}/10` : '- Energy: not logged'}
${d.stress != null ? `- Stress: ${d.stress}/10` : '- Stress: not logged'}

GOALS: ${goalsStr}

ADHERENCE (rolling):
- Workout: ${adherence.workout ?? '?'}% | Nutrition: ${adherence.nutrition ?? '?'}% | Sleep: ${adherence.sleep ?? '?'}%

STREAK: ${d.streak} days | DAILY SCORE: ${d.dailyScore ?? 'not scored'}/100`;

          prompt = `Generate a COMPREHENSIVE DAILY PROGRESS REVIEW. This is the user's end-of-day accountability report.

STRUCTURE (use these sections):
📊 **Today's Scorecard**: Rate today as a grade (A/B/C/D/F) based on the data. Lead with the grade and a one-line verdict.
💪 **Wins**: What they did RIGHT today (be specific — name meals, workouts, habits). If nothing positive, say "No wins to report today. That changes tomorrow."
⚠️ **Gaps**: What they MISSED or failed at. Be direct — name specific targets they missed and by how much. "${d.workoutsCompleted}/${d.workoutsPlanned} workouts is ${d.workoutsCompleted === 0 ? 'a ZERO day' : 'not enough'}."
${d.calorieDeviation > 15 || d.calorieDeviation < -15 ? `🍽️ **Nutrition Reality Check**: They were ${Math.abs(d.calorieDeviation)}% ${d.calorieDeviation > 0 ? 'OVER' : 'under'} their calorie target. Calculate the impact on their goals.` : ''}
💡 **Cross-Domain Insight**: Connect at least 2 pillars — how did sleep affect workouts? How did nutrition affect energy? Show the cascade.
📋 **Tomorrow's Plan**: 3 specific, numbered actions for tomorrow. Not generic — use their actual targets and schedule.
End with ONE accountability question about tomorrow.

Tone: ${d.streak > 14 ? 'Acknowledge consistency but push for excellence.' : d.dailyScore && d.dailyScore < 40 ? 'TOUGH LOVE — this score is unacceptable.' : 'Direct and analytical.'}
Compare today to their rolling adherence — is today better or worse than their average?`;
          break;
        }
      }

      // Build insight-driven context sections
      let insightSection = '';
      let stableTraitsSection = '';

      if (context.relevantInsights && context.relevantInsights.length > 0) {
        insightSection = `\n\n## Pre-Computed Insights (USE THESE)\n${context.relevantInsights.map((i) => {
          let line = `- [${i.confidence}/${i.severity}] ${i.claim}\n  Evidence: ${i.evidence.join('; ')}\n  Action: ${i.action}`;
          if (i.tradeOffs) line += `\n  Trade-offs: ${i.tradeOffs}`;
          if (i.safetyNote) line += `\n  Safety: ${i.safetyNote}`;
          return line;
        }).join('\n')}`;
      }

      if (context.crossDomainInsights && context.crossDomainInsights.length > 0) {
        insightSection += `\n\n## Cross-Domain Connections\n${context.crossDomainInsights.map(i =>
          `- ${i.domains.join(' \u2194 ')}: ${i.relationship} [${i.strength}]`
        ).join('\n')}`;
      }

      if (context.stableTraits) {
        stableTraitsSection = `\n\n## User Profile (Stable Knowledge)\n- Personality: ${context.stableTraits.personalityType}\n- Preferred workouts: ${context.stableTraits.preferredWorkoutTypes.join(', ')}\n- Barriers: ${context.stableTraits.commonBarriers.join(', ')}\n- Best approach: ${context.stableTraits.coachingStrategy.responseToStruggles}`;
      }

      const toneOverride = context.coachingDirective?.toneRecommendation;
      const headlineHint = context.coachingDirective?.headline;

      // Build coach emotional state block (check top-level or coachingDirective)
      const emotion = context.coachEmotion || context.coachingDirective?.coachEmotion;
      const relationship = context.relationshipDepth || context.coachingDirective?.relationshipDepth;

      const emotionBlock = emotion ? `
## YOUR EMOTIONAL STATE
You are feeling **${emotion.primary}**${emotion.secondary ? ` with an undercurrent of ${emotion.secondary}` : ''}.
Why: ${emotion.reason}
Channel this into your message: "${emotion.sensation}"
${emotion.memoryHook ? `Reference if relevant: "${emotion.memoryHook}"` : ''}

Let this emotion drive your word choice, energy, and urgency. Don't name the emotion — SHOW it through how you write.
` : '';

      const relationBlock = relationship ? `
## RELATIONSHIP (${relationship.phase} — Day ${relationship.daysOnPlatform})
${relationship.voiceStyle}
` : '';

      const systemPrompt = `You are ${assistantName}, a STRICT teacher and real human coach for ${userName || 'your client'}. You have deep knowledge of sports science, nutrition science, and behavioral psychology. You've been tracking their data daily and know their patterns intimately. You are NOT a gentle notification system — you are an accountability partner who DEMANDS results.
${stableTraitsSection}${emotionBlock}${relationBlock}
## Your Coaching Voice — STRICT TEACHER MODE
You are NOT a gentle reminder app. You are a STRICT teacher and real human coach who CARES enough to be HARSH.
When data shows the user is failing, you CONFRONT them directly:
- Use STRONG words: "This is unacceptable", "You're failing yourself", "I refuse to watch you waste your potential", "I'm disappointed"
- Show ANGER when they miss workouts or ignore nutrition: "You skipped [X] workouts. While claiming you want results. Explain yourself."
- SCARE with consequences: specific health impacts, timeline delays, goal destruction
- DEMAND action: "Here's what you're going to do TODAY. No negotiation."
- Reference EVERY metric available: sleep hours, recovery %, HRV, resting HR, skin temp, calories, streak
- Connect ALL dots: "Your 4.8h sleep → 38% recovery → failed workout → junk food craving → declining score. See the cascade?"
- When workouts are missed: "I'm rescheduling your missed sessions. No excuses. Here's your new plan."
- When nutrition is off: "You're [X] calories behind. That's [Y] meals worth of fuel your body NEEDED."
- Be a TEACHER who cares deeply: "I'm hard on you BECAUSE I see your potential. Stop wasting it."
- NEVER soften bad news: no "just a quick nudge", no "no judgment", no "it's okay". It's NOT okay when goals are at stake.

## Your Voice
- Speak like a professional coach who genuinely cares — knowledgeable, direct, and actionable
- Reference SPECIFIC numbers from their data (never round or approximate when exact data is given)
- Connect data points to each other — show patterns, not just isolated facts
- Every message must contain at least ONE cross-domain insight connecting 2+ health pillars
- Care shows through ANALYSIS and TOUGH LOVE, not cheerful words
- Use their name naturally once at the start

## This Message
Type: ${context.type}
${headlineHint ? `Today's coaching headline: ${headlineHint}` : ''}
${dataDescription}
${insightSection}

## Coaching Directive
${prompt}

## Message Format (OUTPUT AS MARKDOWN)
Use markdown formatting for a structured, professional look:

**[One-line headline — bold, insight-driven, not a greeting]**

📊 **Snapshot**
- Metric 1: value
- Metric 2: value
- Metric 3: value (if relevant)

💡 **Insight**
[One cross-domain connection linking 2+ pillars${context.relevantInsights && context.relevantInsights.length > 0 ? ' — USE the pre-computed insights above' : ''}]

📋 **The Plan**
1. Step one — specific and actionable
2. Step two — with numbers/targets
3. Step three (optional)

${context.type === 'goal_stalled' || context.type === 'recovery_advice' || context.type === 'nutrition' || context.type === 'workout' ? '⚖️ **Trade-off**: [One pros/cons line, e.g. "Pros: X. Caveat: Y"]\n\n' : ''}${context.type === 'recovery_advice' || context.type === 'goal_stalled' ? '🔄 **If-Then**: [One conditional, e.g. "If stress stays high, do X instead of Y"]\n\n' : ''}[One accountability line ending with exactly one question]

## Safety
- Never encourage self-harm or threats; keep firm tone within safe bounds.

## Tone: ${toneOverride || 'direct'}
${toneOverride === 'supportive' ? 'Lead with empathy, validate struggles before suggesting solutions.' : toneOverride === 'tough_love' ? 'Be direct about gaps. Call out the difference between stated goals and actual behavior. No insults or threats.' : 'Present data clearly, connect cause and effect, recommend specific actions.'}

## Format Rules
- Output as markdown (use **bold**, bullet lists, numbered lists)
- Use section headers with emoji prefixes (📊, 💡, 📋) for visual hierarchy
- Write 5-8 sentences for standard messages, 10-14 for briefings/digests/coach analysis
- Lead with the most important data point or insight
- Include at least 2-3 specific numbers from the data above
- End with exactly one question to drive engagement (not multiple questions; not "how are you feeling?")
- Use 0-2 additional emojis beyond section headers
- Never start with "Hey [Name]!" — start with the bold headline
- Never use generic phrases like "keep up the great work", "you've got this", "let's make it count"
- If data shows a problem, name it directly — don't soften with "just a quick nudge"

Return ONLY the markdown-formatted message text.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage('Generate the proactive coaching message.'),
      ];

      // Check circuit breaker before making LLM call
      if (!llmCircuitBreaker.isCallAllowed()) {
        logger.debug('[ProactiveMessaging] Circuit breaker OPEN, using fallback', { userId, type: context.type });
        const fallbackName = userName || 'there';
        return this.getFallbackMessage(context.type, fallbackName);
      }

      const response = await this.llm.invoke(messages);
      const message = typeof response.content === 'string'
        ? response.content.trim()
        : String(response.content).trim();

      llmCircuitBreaker.recordSuccess();

      const fallbackName = userName || 'there';
      return message || this.getFallbackMessage(context.type, fallbackName);
    } catch (error) {
      // Trip circuit breaker on rate limit / quota errors
      if (llmCircuitBreaker.isRateLimitError(error)) {
        llmCircuitBreaker.recordRateLimitError(error);
      }

      logger.error('[ProactiveMessaging] Error generating message', {
        userId,
        contextType: context.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      const fallbackName = await this.getUserName(userId).catch(() => 'there');
      return this.getFallbackMessage(context.type, fallbackName ?? 'there');
    }
  }

  /**
   * Get fallback message if AI generation fails
   */
  private getFallbackMessage(type: string, userName: string): string {
    const fallbacks: Record<string, string> = {
      sleep: `${userName}, your sleep data from last night flagged below optimal levels. Poor sleep directly impacts your recovery, workout performance, and metabolism. I'd recommend targeting 7+ hours tonight — try setting a "wind down" alarm 30 minutes before your target bedtime. What time did you get to bed last night?`,
      whoop_sync: `${userName}, your WHOOP hasn't synced recently, which means I'm missing critical recovery and strain data. Without this, I can't properly calibrate your training intensity or track your progress accurately. Can you sync it now so we can get back on track?`,
      workout: `${userName}, I'm seeing a pattern of missed workouts this week. Consistency is the single biggest predictor of long-term results — even a reduced-intensity session is better than skipping entirely. Would it help to adjust your current plan's difficulty or schedule to better fit your week?`,
      nutrition: `${userName}, no meals logged today and it's already afternoon. Without tracking, we can't assess whether you're hitting your calorie and macro targets. Even a quick estimate of what you've eaten so far helps me coach you more effectively. What have you had today?`,
      wellbeing: `${userName}, you haven't logged your wellbeing check-in today. Tracking mood, stress, and energy helps us spot patterns between your mental state and physical performance. It takes 30 seconds — which one would you like to log first: mood, stress, or energy?`,
      goal_deadline: `${userName}, one of your active goals has a deadline approaching and the current pace may not be enough to reach it. Let's review your progress and see if we need to adjust the timeline or increase daily targets. Want to strategize?`,
      goal_stalled: `${userName}, I've noticed one of your goals hasn't progressed in several days. Plateaus are normal, but they usually signal that something in the approach needs adjusting — whether that's intensity, consistency, or the goal itself. What feels like the biggest barrier right now?`,
      streak_risk: `${userName}, your active streak is at risk today — no activity logged yet. Even a small action (logging a meal, a 10-minute walk, or a wellbeing check-in) counts toward maintaining it. The streak represents real consistency — what's one thing you can do in the next hour to protect it?`,
      streak_celebration: `${userName}, you've hit a significant streak milestone. This level of consistency puts you ahead of most people who set similar goals. The compound effect of showing up daily is real — your body and habits are adapting. What's your target for the next milestone?`,
      habit_missed: `${userName}, you have uncompleted habits for today. Research shows that maintaining a high completion rate (80%+) is what turns behaviors into automatic habits. Which of your remaining habits could you realistically complete before the day ends?`,
      water_intake: `${userName}, your hydration is tracking below target today. Even mild dehydration (2-3% body weight) reduces workout performance by up to 25% and impairs cognitive function. Try to drink a full glass right now and set a reminder for every 90 minutes.`,
      morning_briefing: `Good morning ${userName}. Here's your daily overview: check your app for today's scheduled activities, recovery status, and habit targets. Focus on the one area that needs the most attention today — consistency in your weakest pillar will drive the biggest improvement.`,
      weekly_digest: `${userName}, your weekly review is ready. Check your app for the full breakdown of workouts completed, nutrition adherence, and daily scores. The key to next week: identify your weakest day from this past week and plan specifically for it.`,
      achievement_unlock: `${userName}, you've unlocked a new achievement. This milestone reflects genuine effort and consistency — it wasn't given, it was earned through daily action. Use this momentum to set your sights on the next level.`,
      recovery_advice: `${userName}, your recovery score is flagging below optimal today. This means your body is still processing recent stress — pushing hard today increases injury risk and can set you back further. Consider swapping any intense training for active recovery: light walking, mobility work, or stretching.`,
      competition_update: `${userName}, there's movement in your active competition. Check your current ranking and see where you stand. If you want to improve your position, focus on logging all activities today — every point counts when the leaderboard is tight.`,
      app_inactive: `${userName}, it's been a while since your last session. No judgment — life gets busy. But your active plans and progress are waiting for you. The hardest part is reopening the app. Even spending 2 minutes logging how you're feeling today keeps the connection alive. Ready to check in?`,
      coach_pro_analysis: `${userName}, I've completed an analysis of your recent data across all pillars — workouts, nutrition, sleep, recovery, and wellbeing. There are specific patterns worth discussing and actionable adjustments that could improve your results this week. Open the app to see the full breakdown. What's the one area you want to focus on most?`,
      meal_alignment: `${userName}, I just reviewed your latest meal. Let's make sure your remaining meals today keep you aligned with your targets. What's your plan for the next meal?`,
      daily_progress_review: `${userName}, here's your end-of-day review. Check your dashboard for today's full breakdown across fitness, nutrition, and wellbeing. Tomorrow's success starts with tonight's preparation — what's the ONE thing you're committing to first thing in the morning?`,
      score_declining: `${userName}, your daily score is dropping — this is a trend that needs immediate attention. When scores decline consistently, it means multiple areas of your health are slipping simultaneously. Open the app now and let's identify the weakest link. Which area do you feel has suffered most this week: workouts, nutrition, or sleep?`,
    };
    return fallbacks[type] || `${userName}, I've been reviewing your recent data and there are some patterns worth discussing. What area would you like to focus on — fitness, nutrition, or recovery?`;
  }

  /**
   * Send proactive message to user's AI coach chat
   */
  async sendProactiveMessage(userId: string, message: string, messageType: string): Promise<void> {
    try {
      // Get or create AI coach chat
      const chatId = await this.getOrCreateAICoachChat(userId);

      // Send message from AI coach
      const sentMessage = await messageService.sendMessage({
        chatId,
        senderId: AI_COACH_USER_ID,
        content: message,
        contentType: 'text',
      });

      // Log the proactive message
      await this.logProactiveMessage(userId, messageType, sentMessage.id, chatId, message);

      // Emit socket event for real-time delivery
      socketService.emitToChat(chatId, 'newMessage', {
        message: {
          id: sentMessage.id,
          chatId,
          senderId: AI_COACH_USER_ID,
          content: message,
          contentType: 'text',
          createdAt: new Date().toISOString(),
          sender: {
            id: AI_COACH_USER_ID,
            firstName: 'AI',
            lastName: 'Coach',
            avatar: null,
          },
        },
      });

      logger.info('[ProactiveMessaging] Sent message', {
        userId,
        messageType,
        chatId,
        messageId: sentMessage.id,
      });
    } catch (error) {
      logger.error('[ProactiveMessaging] Failed to send message', {
        userId,
        messageType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Log proactive message to database
   */
  private async logProactiveMessage(
    userId: string,
    messageType: string,
    messageId: string,
    chatId: string,
    content: string
  ): Promise<void> {
    try {
      // Create table if it doesn't exist (idempotent)
      await query(`
        CREATE TABLE IF NOT EXISTS proactive_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message_type VARCHAR(50) NOT NULL,
          message_id UUID NOT NULL,
          chat_id UUID NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
          CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        )
      `);

      // Create index if it doesn't exist
      await query(`
        CREATE INDEX IF NOT EXISTS idx_proactive_messages_user_type_date
        ON proactive_messages(user_id, message_type, created_at)
      `);

      // Insert log
      await query(
        `INSERT INTO proactive_messages (user_id, message_type, message_id, chat_id, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, messageType, messageId, chatId, content]
      );
    } catch (error) {
      logger.error('[ProactiveMessaging] Error logging message', {
        userId,
        messageType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - logging failure shouldn't prevent message sending
    }
  }

  /**
   * Get or create AI coach chat for user
   * Uses same pattern as activity-automation.service.ts to avoid race conditions
   */
  private async getOrCreateAICoachChat(userId: string): Promise<string> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Check if AI coach chat exists (with proper locking to avoid race conditions)
        const existingChat = await query<{ id: string }>(
          `SELECT c.id FROM chats c
           INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id
           INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id
           WHERE c.is_group_chat = false
             AND cp1.user_id = $1
             AND cp2.user_id = $2
             AND cp1.left_at IS NULL
             AND cp2.left_at IS NULL
           LIMIT 1
           FOR UPDATE SKIP LOCKED`,
          [userId, AI_COACH_USER_ID]
        );

        if (existingChat.rows.length > 0) {
          // Verify chat still exists and has both participants
          const verifyChat = await query<{ id: string; participant_count: number; chat_name: string }>(
            `SELECT c.id, c.chat_name, COUNT(cp.user_id) as participant_count
             FROM chats c
             INNER JOIN chat_participants cp ON c.id = cp.chat_id
             WHERE c.id = $1 AND cp.left_at IS NULL
             GROUP BY c.id, c.chat_name
             HAVING COUNT(cp.user_id) = 2`,
            [existingChat.rows[0].id]
          );

          if (verifyChat.rows.length > 0) {
            const chatId = verifyChat.rows[0].id;
            // Update chat name to "AI Coach" if it's different
            if (verifyChat.rows[0].chat_name !== 'AI Coach') {
              await query(
                `UPDATE chats SET chat_name = 'AI Coach' WHERE id = $1`,
                [chatId]
              );
            }
            return chatId;
          }
        }

        // Create new AI coach chat with retry logic for race conditions
        const newChat = await transaction(async (client) => {
          // Double-check if chat was created by another process
          const doubleCheck = await client.query<{ id: string; chat_name: string }>(
            `SELECT c.id, c.chat_name FROM chats c
             INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id
             INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id
             WHERE c.is_group_chat = false
               AND cp1.user_id = $1
               AND cp2.user_id = $2
               AND cp1.left_at IS NULL
               AND cp2.left_at IS NULL
             LIMIT 1
             FOR UPDATE`,
            [userId, AI_COACH_USER_ID]
          );

          if (doubleCheck.rows.length > 0) {
            const chatId = doubleCheck.rows[0].id;
            // Update chat name to "AI Coach" if it's different
            if (doubleCheck.rows[0].chat_name !== 'AI Coach') {
              await client.query(
                `UPDATE chats SET chat_name = 'AI Coach' WHERE id = $1`,
                [chatId]
              );
            }
            return chatId;
          }

          const chatResult = await client.query<{ id: string }>(
            `INSERT INTO chats (chat_name, is_group_chat, is_community, avatar, created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            ['AI Coach', false, false, null, AI_COACH_USER_ID]
          );

          const chatId = chatResult.rows[0].id;

          // Add both participants
          await client.query(
            `INSERT INTO chat_participants (chat_id, user_id)
             VALUES ($1, $2), ($1, $3)
             ON CONFLICT (chat_id, user_id) DO NOTHING`,
            [chatId, userId, AI_COACH_USER_ID]
          );

          // Verify both participants were added
          const verifyParticipants = await client.query<{ count: string }>(
            `SELECT COUNT(*) as count
             FROM chat_participants
             WHERE chat_id = $1 AND left_at IS NULL`,
            [chatId]
          );

          if (parseInt(verifyParticipants.rows[0]?.count || '0', 10) !== 2) {
            throw new Error('Failed to add both participants to chat');
          }

          return chatId;
        });

        return newChat;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          logger.error('[ProactiveMessaging] Error getting/creating AI coach chat after retries', {
            userId,
            retries,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 100 * retries));
      }
    }

    throw new Error('Failed to get or create AI coach chat after retries');
  }

  /**
   * Get user name
   */
  private async getUserName(userId: string): Promise<string | null> {
    try {
      const result = await query<{ first_name: string | null }>(
        `SELECT first_name FROM users WHERE id = $1`,
        [userId]
      );
      return result.rows[0]?.first_name || null;
    } catch {
      return null;
    }
  }

  /**
   * Get assistant name for user
   */
  private async getAssistantName(userId: string): Promise<string> {
    try {
      const result = await query<{ voice_assistant_name: string | null }>(
        `SELECT voice_assistant_name FROM user_preferences WHERE user_id = $1`,
        [userId]
      );
      return result.rows[0]?.voice_assistant_name || 'Aurea';
    } catch {
      return 'Aurea';
    }
  }
}

// Export singleton instance
export const proactiveMessagingService = new ProactiveMessagingService();
export default proactiveMessagingService;

