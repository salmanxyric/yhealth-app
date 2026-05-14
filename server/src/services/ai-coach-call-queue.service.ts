import { Queue, QueueEvents } from 'bullmq';
import { redisConnection, queueConfig, QueueNames, JobTypes } from '../config/queue.config.js';
import { env } from '../config/env.config.js';
import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { localTimeToUtc } from '../lib/user-timezone.js';

export interface AICoachCallJobData {
  userId: string;
  scheduledTimeHHMM: string;
  scheduledDate: string;
  timezone: string;
  sessionType: 'quick_checkin';
  attempt: number;
}

class AICoachCallQueueService {
  private queue: Queue | null = null;
  private queueEvents: QueueEvents | null = null;
  private isInitialized = false;

  private initialize(): void {
    if (this.isInitialized) return;

    if (!env.redis.enabled) {
      logger.info('[AICoachCallQueue] Redis not configured, queue disabled');
      this.isInitialized = true;
      return;
    }

    try {
      this.queue = new Queue(QueueNames.AI_COACH_CALL, {
        connection: redisConnection,
        defaultJobOptions: {
          ...queueConfig.defaultJobOptions,
          attempts: 2,
          backoff: { type: 'fixed' as const, delay: 5000 },
          removeOnComplete: { age: 86400, count: 5000 },
          removeOnFail: { age: 604800, count: 2000 },
        },
      });

      this.queueEvents = new QueueEvents(QueueNames.AI_COACH_CALL, {
        connection: redisConnection,
      });

      this.queue.on('error', (error) => {
        logger.error('[AICoachCallQueue] Queue error', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
      });

      this.isInitialized = true;
      logger.info('[AICoachCallQueue] Queue initialized');
    } catch (error) {
      logger.warn('[AICoachCallQueue] Failed to initialize (Redis unavailable?)', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      this.isInitialized = true;
    }
  }

  isAvailable(): boolean {
    if (!this.isInitialized) this.initialize();
    return this.queue !== null;
  }

  async scheduleCall(
    userId: string,
    timeHHMM: string,
    timezone: string,
    targetDate: string,
  ): Promise<void> {
    if (!this.isInitialized) this.initialize();
    if (!this.queue) return;

    const targetUtc = localTimeToUtc(timeHHMM, targetDate, timezone);
    const delayMs = targetUtc.getTime() - Date.now();
    if (delayMs <= 0) {
      logger.debug('[AICoachCallQueue] Skipping past time', { userId, timeHHMM, targetDate });
      return;
    }

    const jobId = `ai-call_${userId}_${targetDate}_${timeHHMM.replace(/:/g, '-')}`;
    const jobData: AICoachCallJobData = {
      userId,
      scheduledTimeHHMM: timeHHMM,
      scheduledDate: targetDate,
      timezone,
      sessionType: 'quick_checkin',
      attempt: 1,
    };

    try {
      const existing = await query<{ id: string; bullmq_job_id: string | null }>(
        `SELECT id, bullmq_job_id FROM ai_coach_call_log
         WHERE user_id = $1 AND scheduled_date = $2::DATE
           AND scheduled_time = $3::TIME AND session_type = 'quick_checkin'
           AND status NOT IN ('cancelled')`,
        [userId, targetDate, timeHHMM],
      );

      if (existing.rows[0]?.bullmq_job_id) {
        logger.debug('[AICoachCallQueue] Job already scheduled', { userId, timeHHMM, targetDate });
        return;
      }

      let logId: string;
      if (existing.rows[0]) {
        logId = existing.rows[0].id;
      } else {
        const insertResult = await query<{ id: string }>(
          `INSERT INTO ai_coach_call_log (user_id, scheduled_time, scheduled_date, timezone, status, session_type)
           VALUES ($1, $2::TIME, $3::DATE, $4, 'scheduled', 'quick_checkin')
           RETURNING id`,
          [userId, timeHHMM, targetDate, timezone],
        );
        logId = insertResult.rows[0]!.id;
      }

      const job = await this.queue.add(JobTypes.INITIATE_AI_CALL, jobData, {
        jobId,
        delay: delayMs,
      });

      await query(
        `UPDATE ai_coach_call_log SET bullmq_job_id = $1, updated_at = NOW() WHERE id = $2`,
        [job.id ?? jobId, logId],
      );

      logger.debug('[AICoachCallQueue] Call scheduled', {
        userId,
        timeHHMM,
        targetDate,
        delayMs,
        jobId,
      });
    } catch (error) {
      logger.error('[AICoachCallQueue] Failed to schedule call', {
        userId,
        timeHHMM,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  async cancelUserJobs(userId: string): Promise<void> {
    if (!this.isInitialized) this.initialize();
    if (!this.queue) return;

    try {
      const result = await query<{ bullmq_job_id: string }>(
        `SELECT bullmq_job_id FROM ai_coach_call_log
         WHERE user_id = $1 AND status = 'scheduled' AND bullmq_job_id IS NOT NULL`,
        [userId],
      );

      for (const row of result.rows) {
        try {
          const job = await this.queue.getJob(row.bullmq_job_id);
          if (job) await job.remove();
        } catch {
          // Job may already be processed or removed
        }
      }

      await query(
        `UPDATE ai_coach_call_log SET status = 'cancelled', updated_at = NOW()
         WHERE user_id = $1 AND status = 'scheduled'`,
        [userId],
      );

      logger.debug('[AICoachCallQueue] Cancelled jobs for user', { userId, count: result.rows.length });
    } catch (error) {
      logger.error('[AICoachCallQueue] Failed to cancel jobs', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  async syncUserSchedule(userId: string): Promise<void> {
    await this.cancelUserJobs(userId);

    const prefsResult = await query<{
      preferred_call_times: string[] | null;
      ai_call_frequency: string | null;
      timezone: string;
    }>(
      `SELECT up.preferred_call_times, up.ai_call_frequency,
              COALESCE(u.timezone, 'UTC') AS timezone
       FROM user_preferences up
       JOIN users u ON u.id = up.user_id
       WHERE up.user_id = $1`,
      [userId],
    );

    const row = prefsResult.rows[0];
    if (!row || row.ai_call_frequency === 'off' || !row.preferred_call_times?.length) return;

    const { getUserLocalDateISO } = await import('../lib/user-timezone.js');
    const today = getUserLocalDateISO(row.timezone);

    for (const time of row.preferred_call_times) {
      await this.scheduleCall(userId, time, row.timezone, today);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.queueEvents) await this.queueEvents.close();
      if (this.queue) await this.queue.close();
      logger.info('[AICoachCallQueue] Queue closed');
    } catch (error) {
      logger.error('[AICoachCallQueue] Error closing queue', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }
}

export const aiCoachCallQueueService = new AICoachCallQueueService();
