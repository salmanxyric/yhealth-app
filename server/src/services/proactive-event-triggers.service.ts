/**
 * @file Event-Driven Proactive Triggers
 *
 * Fires immediate proactive check-ins when real-time events occur
 * (workout completed, WHOOP synced, behavioral drift detected).
 *
 * Unlike the scheduled proactive-messaging job (runs every 3h),
 * these triggers respond within seconds of the triggering event.
 */

import { logger } from './logger.service.js';
import { proactiveMessagingService, type ProactiveMessageType } from './proactive-messaging.service.js';
import { comprehensiveUserContextService } from './comprehensive-user-context.service.js';
import { query } from '../database/pg.js';

export interface CheckInAction {
  label: string;
  value: string;
  style: 'primary' | 'secondary' | 'muted';
}

export interface CheckInMetadata {
  checkInType: string;
  triggerEvent: string;
  actions: CheckInAction[];
  expiresAt?: string;
}

const CHECK_IN_CONFIGS: Record<string, {
  messageType: ProactiveMessageType;
  actions: CheckInAction[];
  cooldownMinutes: number;
}> = {
  post_workout: {
    messageType: 'recovery_advice',
    actions: [
      { label: 'How I feel', value: 'respond_feeling', style: 'primary' },
      { label: 'Later', value: 'snooze', style: 'secondary' },
      { label: 'Dismiss', value: 'dismiss', style: 'muted' },
    ],
    cooldownMinutes: 120,
  },
  whoop_morning_readiness: {
    messageType: 'sleep',
    actions: [
      { label: 'Plan my day', value: 'plan_day', style: 'primary' },
      { label: 'Just info', value: 'dismiss', style: 'secondary' },
    ],
    cooldownMinutes: 720,
  },
  behavioral_drift: {
    messageType: 'plan_non_adherence',
    actions: [
      { label: 'Adjust plan', value: 'adjust_plan', style: 'primary' },
      { label: 'I\'m aware', value: 'acknowledge', style: 'secondary' },
      { label: 'Dismiss', value: 'dismiss', style: 'muted' },
    ],
    cooldownMinutes: 1440,
  },
  streak_at_risk: {
    messageType: 'streak_risk',
    actions: [
      { label: 'Do it now', value: 'respond_action', style: 'primary' },
      { label: 'Remind later', value: 'snooze', style: 'secondary' },
    ],
    cooldownMinutes: 360,
  },
  positive_momentum: {
    messageType: 'positive_momentum',
    actions: [
      { label: 'Keep going!', value: 'acknowledge', style: 'primary' },
      { label: 'Set next goal', value: 'respond_goal', style: 'secondary' },
    ],
    cooldownMinutes: 720,
  },
};

class ProactiveEventTriggerService {

  async onWorkoutCompleted(userId: string, workoutData: {
    workoutId: string;
    type: string;
    durationMinutes: number;
    caloriesBurned?: number;
  }): Promise<void> {
    await this.triggerCheckIn(userId, 'post_workout', {
      workoutType: workoutData.type,
      duration: workoutData.durationMinutes,
      calories: workoutData.caloriesBurned,
    });
  }

  async onWhoopDataSynced(userId: string, whoopData: {
    recoveryScore: number;
    sleepScore: number;
    strain: number;
  }): Promise<void> {
    const hour = new Date().getHours();
    if (hour >= 5 && hour <= 10) {
      await this.triggerCheckIn(userId, 'whoop_morning_readiness', whoopData);
    }
  }

  async onBehavioralDriftDetected(userId: string, driftData: {
    domain: string;
    adherence7d: number;
    adherence30d: number;
    delta: number;
  }): Promise<void> {
    if (driftData.delta < -15) {
      await this.triggerCheckIn(userId, 'behavioral_drift', driftData);
    }
  }

  async onStreakAtRisk(userId: string, streakData: {
    streakType: string;
    currentStreak: number;
    hoursRemaining: number;
  }): Promise<void> {
    if (streakData.hoursRemaining <= 4) {
      await this.triggerCheckIn(userId, 'streak_at_risk', streakData);
    }
  }

  async onPositiveMomentum(userId: string, momentumData: {
    metric: string;
    improvementPercent: number;
    streakDays: number;
  }): Promise<void> {
    await this.triggerCheckIn(userId, 'positive_momentum', momentumData);
  }

  async handleCheckInResponse(userId: string, checkInId: string, actionValue: string): Promise<{
    handled: boolean;
    followUp?: string;
  }> {
    try {
      const result = await query<{ id: string; check_in_type: string; trigger_data: any }>(
        `UPDATE proactive_check_ins
         SET status = $3, responded_at = NOW()
         WHERE id = $1 AND user_id = $2 AND status = 'pending'
         RETURNING id, check_in_type, trigger_data`,
        [checkInId, userId, actionValue === 'snooze' ? 'snoozed' : actionValue === 'dismiss' ? 'dismissed' : 'responded'],
      );

      if (result.rows.length === 0) {
        return { handled: false };
      }

      if (actionValue === 'snooze') {
        await query(
          `UPDATE proactive_check_ins SET snooze_until = NOW() + INTERVAL '2 hours' WHERE id = $1`,
          [checkInId],
        );
        return { handled: true, followUp: 'I\'ll check back in 2 hours.' };
      }

      return { handled: true };
    } catch (error) {
      logger.error('[ProactiveEventTriggers] Failed to handle check-in response', {
        userId, checkInId, actionValue,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return { handled: false };
    }
  }

  private async triggerCheckIn(
    userId: string,
    triggerType: string,
    triggerData: Record<string, any>,
  ): Promise<void> {
    const config = CHECK_IN_CONFIGS[triggerType];
    if (!config) {
      logger.warn('[ProactiveEventTriggers] Unknown trigger type', { triggerType });
      return;
    }

    try {
      const recent = await query<{ id: string }>(
        `SELECT id FROM proactive_check_ins
         WHERE user_id = $1 AND check_in_type = $2
         AND created_at >= NOW() - INTERVAL '1 minute' * $3
         AND status != 'dismissed'
         LIMIT 1`,
        [userId, triggerType, config.cooldownMinutes],
      );
      if (recent.rows.length > 0) {
        logger.debug('[ProactiveEventTriggers] Skipping — cooldown active', { userId, triggerType });
        return;
      }

      const checkInResult = await query<{ id: string }>(
        `INSERT INTO proactive_check_ins (user_id, check_in_type, trigger_data, actions, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id`,
        [userId, triggerType, JSON.stringify(triggerData), JSON.stringify(config.actions)],
      );
      const checkInId = checkInResult.rows[0].id;

      const cooldown = await proactiveMessagingService.getMessageCooldownState(userId);
      if (cooldown.dailyCount >= 8) {
        logger.debug('[ProactiveEventTriggers] Daily limit reached', { userId });
        return;
      }

      let context;
      try {
        context = await comprehensiveUserContextService.getComprehensiveContext(userId);
      } catch {
        context = {};
      }

      const checkInMetadata: CheckInMetadata = {
        checkInType: triggerType,
        triggerEvent: config.messageType,
        actions: config.actions,
        expiresAt: new Date(Date.now() + config.cooldownMinutes * 60 * 1000).toISOString(),
      };

      const metadataComment = `<!--CHECKIN:${JSON.stringify({ id: checkInId, ...checkInMetadata })}-->`;

      const proactiveContext = {
        type: config.messageType,
        data: { ...triggerData, checkInId, isEventTriggered: true },
        userContext: context,
      };

      const message = await (proactiveMessagingService as any).generateProactiveMessage(userId, proactiveContext);
      const enrichedMessage = `${message}\n\n${metadataComment}`;

      await proactiveMessagingService.sendProactiveMessage(
        userId,
        enrichedMessage,
        config.messageType,
        cooldown,
      );

      logger.info('[ProactiveEventTriggers] Check-in sent', {
        userId: userId.slice(0, 8),
        triggerType,
        checkInId: checkInId.slice(0, 8),
      });
    } catch (error) {
      logger.error('[ProactiveEventTriggers] Failed to trigger check-in', {
        userId, triggerType,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }
}

export const proactiveEventTriggerService = new ProactiveEventTriggerService();
