# AI Coach Scheduled Calling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add BullMQ-based scheduled voice calls from the AI coach to users at their preferred times, with missed-call follow-up, adaptive learning, and full communication-preference gating.

**Architecture:** BullMQ delayed jobs fire at exact user-local times. The worker validates consent/preference gates, then calls `chatCallService.initiateAICoachCall()` which emits the same `chat:call:incoming` socket event used by peer calls. `finishCall()` durably updates `ai_coach_call_log` when a call ends. A daily reconciler ensures no jobs are lost after Redis flushes or deploys.

**Tech Stack:** BullMQ + Redis (existing), PostgreSQL (existing), Socket.IO (existing), Node.js `Intl`-based timezone utilities (existing `user-timezone.ts`)

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `server/src/database/migrations/20260513_ai_coach_call_log.sql` | Call log table + indexes + unique constraint for dedup |
| `server/src/services/ai-coach-call-queue.service.ts` | BullMQ queue management — schedule, cancel, sync jobs |
| `server/src/workers/ai-coach-call.worker.ts` | BullMQ worker — processes scheduled call jobs with gate checks |
| `server/src/jobs/ai-coach-call-reconciler.job.ts` | Daily safety net — ensures jobs exist for all users |

### Modified Files

| File | Change |
|------|--------|
| `server/src/config/queue.config.ts` | Add `AI_COACH_CALL` queue name + `INITIATE_AI_CALL` job type |
| `server/src/services/communication-preferences.service.ts` | Add `recordMiss()` and `recordAnswer()` helpers |
| `server/src/services/chat-call.service.ts` | Add `initiateAICoachCall()` + AI coach outcome handling in `finishCall()` |
| `server/src/services/voice-schedule.service.ts` | Sync BullMQ jobs on `updateScheduleSettings()` |
| `server/src/index.ts` | Start worker + reconciler, register graceful shutdown |

---

## Task 1: Database Migration

**Files:**
- Create: `server/src/database/migrations/20260513_ai_coach_call_log.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- AI Coach call log for scheduling, outcome tracking, and adaptive learning.
-- Safe additive migration: creates table and indexes only.

CREATE TABLE IF NOT EXISTS ai_coach_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_call_id UUID,
  bullmq_job_id VARCHAR(128),
  scheduled_time TIME NOT NULL,
  scheduled_date DATE NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
  skip_reason VARCHAR(128),
  session_type VARCHAR(48) DEFAULT 'quick_checkin',
  pre_call_context TEXT,
  followup_message_id UUID,
  call_duration_seconds INTEGER,
  initiated_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_call_log_user_date
  ON ai_coach_call_log (user_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_coach_call_log_status
  ON ai_coach_call_log (status)
  WHERE status IN ('scheduled', 'initiated');

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_coach_call_log_user_date_time
  ON ai_coach_call_log (user_id, scheduled_date, scheduled_time, session_type)
  WHERE status NOT IN ('cancelled');
```

- [ ] **Step 2: Register the migration in auto-migrate**

Open `server/src/database/auto-migrate.ts` and add the new migration file to the migration list, following the existing pattern for `20260512002000_push_tokens_user_communication_preferences.sql`.

- [ ] **Step 3: Run the migration locally**

Run: `cd server && npm run db:migrate`
Expected: Table `ai_coach_call_log` created with all columns and indexes.

- [ ] **Step 4: Verify the table exists**

Run: `cd server && npx tsx -e "import { query } from './src/config/database.config.js'; const r = await query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_coach_call_log' ORDER BY ordinal_position\"); console.log(r.rows); process.exit(0);"`
Expected: List of all columns matching the migration.

- [ ] **Step 5: Commit**

```bash
git add server/src/database/migrations/20260513_ai_coach_call_log.sql server/src/database/auto-migrate.ts
git commit -m "feat(ai-coach-call): add ai_coach_call_log migration"
```

---

## Task 2: Queue Config Additions

**Files:**
- Modify: `server/src/config/queue.config.ts`

- [ ] **Step 1: Add the queue name and job type**

In `queue.config.ts`, add to the `QueueNames` object:

```typescript
export const QueueNames = {
  EMBEDDING_SYNC: 'embedding-sync',
  EMBEDDING_MIGRATION: 'embedding-migration',
  ACTIVITY_EVENT_PROCESSING: 'activity-event-processing',
  EXERCISE_INGESTION: 'exercise-ingestion',
  EMAIL: 'email-delivery',
  STREAK_EVENTS: 'streak-events',
  AI_COACH_CALL: 'ai-coach-call',
} as const;
```

Add to the `JobTypes` object:

```typescript
  // AI Coach scheduled calling
  INITIATE_AI_CALL: 'initiate-ai-call',
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/config/queue.config.ts
git commit -m "feat(ai-coach-call): add AI_COACH_CALL queue name and job type"
```

---

## Task 3: Communication Preferences — `recordMiss` and `recordAnswer`

**Files:**
- Modify: `server/src/services/communication-preferences.service.ts`
- Create: `server/src/services/__tests__/communication-preferences.service.test.ts`

- [ ] **Step 1: Write failing tests for recordMiss and recordAnswer**

Create `server/src/services/__tests__/communication-preferences.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('../../config/database.config.js', () => ({
  query: vi.fn(),
}));
vi.mock('../logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { communicationPreferencesService } from '../communication-preferences.service.js';
import { query } from '../../config/database.config.js';

const mockQuery = vi.mocked(query);

describe('CommunicationPreferencesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordMiss', () => {
    it('increments miss count for the given hour', async () => {
      // getForUser returns existing prefs with some miss data
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: { '9': 1 },
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      // upsert calls getForUser again (existing prefs)
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: { '9': 1 },
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      // upsert INSERT/UPDATE
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] } as any);
      // upsert final getForUser
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: { '9': 2 },
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);

      await communicationPreferencesService.recordMiss('u1', 9);

      // The upsert call (3rd query) should contain incremented count
      const upsertCall = mockQuery.mock.calls[2];
      expect(upsertCall).toBeDefined();
      const jsonArg = upsertCall![upsertCall!.length - 1] as unknown[];
      const missJson = jsonArg[jsonArg.length - 1] as string;
      const parsed = JSON.parse(missJson);
      expect(parsed['9']).toBe(2);
    });

    it('initializes miss count for a new hour', async () => {
      // getForUser returns prefs with empty miss data
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: {},
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: {},
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: { '21': 1 },
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);

      await communicationPreferencesService.recordMiss('u1', 21);

      const upsertCall = mockQuery.mock.calls[2];
      expect(upsertCall).toBeDefined();
      const jsonArg = upsertCall![upsertCall!.length - 1] as unknown[];
      const missJson = jsonArg[jsonArg.length - 1] as string;
      const parsed = JSON.parse(missJson);
      expect(parsed['21']).toBe(1);
    });
  });

  describe('recordAnswer', () => {
    it('resets miss count for the given hour to zero', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: { '9': 3 },
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: { '9': 3 },
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'u1',
          checkin_push_enabled: true,
          quiet_hours_start: null,
          quiet_hours_end: null,
          workdays_only: false,
          max_checkins_per_day: 1,
          missed_followup_hours: 24,
          push_achievements: true,
          push_streaks: true,
          push_nudges: true,
          email_digest: true,
          email_urgent_only: false,
          checkin_miss_count_by_hour: { '9': 0 },
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);

      await communicationPreferencesService.recordAnswer('u1', 9);

      const upsertCall = mockQuery.mock.calls[2];
      expect(upsertCall).toBeDefined();
      const jsonArg = upsertCall![upsertCall!.length - 1] as unknown[];
      const missJson = jsonArg[jsonArg.length - 1] as string;
      const parsed = JSON.parse(missJson);
      expect(parsed['9']).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd server && npx vitest run src/services/__tests__/communication-preferences.service.test.ts`
Expected: FAIL — `recordMiss` and `recordAnswer` are not defined on the service.

- [ ] **Step 3: Implement recordMiss and recordAnswer**

Add these methods to the `CommunicationPreferencesService` class in `server/src/services/communication-preferences.service.ts`, just before the `allowsPushCategory` method:

```typescript
  async recordMiss(userId: string, hour: number): Promise<void> {
    const prefs = await this.getForUser(userId);
    const counts = { ...(prefs.checkin_miss_count_by_hour || {}) };
    counts[String(hour)] = (counts[String(hour)] || 0) + 1;
    await this.upsert(userId, { checkin_miss_count_by_hour: counts });
  }

  async recordAnswer(userId: string, hour: number): Promise<void> {
    const prefs = await this.getForUser(userId);
    const counts = { ...(prefs.checkin_miss_count_by_hour || {}) };
    counts[String(hour)] = 0;
    await this.upsert(userId, { checkin_miss_count_by_hour: counts });
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && npx vitest run src/services/__tests__/communication-preferences.service.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/communication-preferences.service.ts server/src/services/__tests__/communication-preferences.service.test.ts
git commit -m "feat(ai-coach-call): add recordMiss and recordAnswer to communication preferences"
```

---

## Task 4: AI Coach Call Queue Service

**Files:**
- Create: `server/src/services/ai-coach-call-queue.service.ts`
- Create: `server/src/services/__tests__/ai-coach-call-queue.service.test.ts`

- [ ] **Step 1: Write failing test for scheduleCall**

Create `server/src/services/__tests__/ai-coach-call-queue.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/queue.config.js', () => ({
  redisConnection: { host: 'localhost', port: 6379 },
  queueConfig: { defaultJobOptions: {} },
  QueueNames: { AI_COACH_CALL: 'ai-coach-call' },
  JobTypes: { INITIATE_AI_CALL: 'initiate-ai-call' },
}));
vi.mock('../../config/env.config.js', () => ({
  env: { redis: { enabled: true, url: '', host: 'localhost', port: 6379 } },
}));
vi.mock('../logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../config/database.config.js', () => ({
  query: vi.fn(),
}));

const mockQueueAdd = vi.fn().mockResolvedValue({ id: 'job-123' });
const mockQueueClose = vi.fn().mockResolvedValue(undefined);
const mockGetJob = vi.fn();
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: mockQueueClose,
    getJob: mockGetJob,
    on: vi.fn(),
  })),
  QueueEvents: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

import { aiCoachCallQueueService } from '../ai-coach-call-queue.service.js';
import { query } from '../../config/database.config.js';

const mockQuery = vi.mocked(query);

describe('AICoachCallQueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduleCall', () => {
    it('adds a delayed job with correct jobId and delay', async () => {
      // Mock: no existing log row (INSERT succeeds)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'log-1', bullmq_job_id: null }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      // Mock: UPDATE bullmq_job_id
      mockQuery.mockResolvedValueOnce({
        rows: [], rowCount: 1, command: '', oid: 0, fields: [],
      } as any);

      await aiCoachCallQueueService.scheduleCall(
        'user-abc',
        '21:00',
        'Asia/Karachi',
        '2026-12-25'
      );

      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
      const [jobType, jobData, opts] = mockQueueAdd.mock.calls[0]!;
      expect(jobType).toBe('initiate-ai-call');
      expect(jobData.userId).toBe('user-abc');
      expect(jobData.scheduledTimeHHMM).toBe('21:00');
      expect(jobData.timezone).toBe('Asia/Karachi');
      expect(opts.jobId).toBe('ai-call:user-abc:2026-12-25:21:00');
      expect(opts.delay).toBeGreaterThan(0);
    });

    it('skips scheduling if time is in the past', async () => {
      await aiCoachCallQueueService.scheduleCall(
        'user-abc',
        '01:00',
        'UTC',
        '2020-01-01' // far in the past
      );

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });
  });

  describe('cancelUserJobs', () => {
    it('removes BullMQ jobs using stored job IDs from DB', async () => {
      const mockRemove = vi.fn().mockResolvedValue(undefined);
      mockGetJob.mockResolvedValue({ remove: mockRemove });

      mockQuery
        // SELECT bullmq_job_id from log
        .mockResolvedValueOnce({
          rows: [
            { bullmq_job_id: 'ai-call:user-abc:2026-05-14:09:00' },
            { bullmq_job_id: 'ai-call:user-abc:2026-05-14:21:00' },
          ],
          rowCount: 2, command: '', oid: 0, fields: [],
        } as any)
        // UPDATE status = cancelled
        .mockResolvedValueOnce({
          rows: [], rowCount: 2, command: '', oid: 0, fields: [],
        } as any);

      await aiCoachCallQueueService.cancelUserJobs('user-abc');

      expect(mockGetJob).toHaveBeenCalledTimes(2);
      expect(mockRemove).toHaveBeenCalledTimes(2);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/services/__tests__/ai-coach-call-queue.service.test.ts`
Expected: FAIL — module `ai-coach-call-queue.service.js` does not exist.

- [ ] **Step 3: Implement the queue service**

Create `server/src/services/ai-coach-call-queue.service.ts`:

```typescript
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

    const jobId = `ai-call:${userId}:${targetDate}:${timeHHMM}`;
    const jobData: AICoachCallJobData = {
      userId,
      scheduledTimeHHMM: timeHHMM,
      scheduledDate: targetDate,
      timezone,
      sessionType: 'quick_checkin',
      attempt: 1,
    };

    try {
      // DB is source of truth for dedup — check existing before insert
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/services/__tests__/ai-coach-call-queue.service.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/ai-coach-call-queue.service.ts server/src/services/__tests__/ai-coach-call-queue.service.test.ts
git commit -m "feat(ai-coach-call): add AI coach call queue service"
```

---

## Task 5: Chat Call Service Extension

**Files:**
- Modify: `server/src/services/chat-call.service.ts`

- [ ] **Step 1: Add the `initiateAICoachCall` method**

Add these imports at the top of `chat-call.service.ts`:

```typescript
import { communicationPreferencesService } from './communication-preferences.service.js';
import { pushNotificationService } from './push-notification.service.js';
```

Add the following method to the `ChatCallService` class, after the `emitPendingIncomingCalls` method:

```typescript
  async initiateAICoachCall(
    targetUserId: string,
    context: { preCallContext: string; sessionType: string },
  ): Promise<ChatCallSession> {
    const chatId = await this.findOrCreateAICoachChat(targetUserId);

    const aiCoachProfile = await query<{ first_name: string; last_name: string; avatar: string | null }>(
      `SELECT first_name, last_name, avatar FROM users WHERE id = $1`,
      [AI_COACH_USER_ID],
    );
    const aiProfile = aiCoachProfile.rows[0];
    const aiName = aiProfile ? displayName(aiProfile) : 'AI Coach';

    const targetProfile = await query<{ first_name: string; last_name: string; avatar: string | null }>(
      `SELECT first_name, last_name, avatar FROM users WHERE id = $1`,
      [targetUserId],
    );
    const targetUser = targetProfile.rows[0];
    const targetName = targetUser ? displayName(targetUser) : 'User';

    const call: ChatCallSession = {
      id: randomUUID(),
      chatId,
      chatName: aiName,
      callType: 'voice',
      isGroupCall: false,
      initiatorId: AI_COACH_USER_ID,
      initiatorName: aiName,
      initiatorAvatar: aiProfile?.avatar ?? null,
      participantProfiles: new Map([
        [AI_COACH_USER_ID, { name: aiName, avatar: aiProfile?.avatar ?? null }],
        [targetUserId, { name: targetName, avatar: targetUser?.avatar ?? null }],
      ]),
      participantIds: [AI_COACH_USER_ID, targetUserId],
      invitedUserIds: [targetUserId],
      acceptedUserIds: new Set([AI_COACH_USER_ID]),
      declinedUserIds: new Set(),
      status: 'ringing',
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      mediaState: new Map([
        [AI_COACH_USER_ID, { audioEnabled: true, videoEnabled: false }],
      ]),
    };

    call.timeout = setTimeout(() => {
      this.timeoutCall(call.id).catch((error) => {
        logger.error('[ChatCall] AI coach call timeout failed', {
          callId: call.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, CALL_TIMEOUT_MS);

    this.calls.set(call.id, call);

    if (socketService.isUserConnected(targetUserId)) {
      socketService.emitToUser(targetUserId, EVENTS.INCOMING, this.toPayload(call, targetUserId));
    } else {
      await notificationEngine.send({
        userId: targetUserId,
        type: 'chat_call',
        title: `${aiName} is calling`,
        message: 'Your coach wants to check in. Tap to answer.',
        icon: 'phone',
        actionUrl: `/chat?chatId=${chatId}`,
        actionLabel: 'Answer',
        category: 'coaching',
        priority: 'high',
        relatedEntityType: 'chat_call',
        relatedEntityId: call.id,
        metadata: { callId: call.id, chatId, callType: 'voice' },
        expiresAt: new Date(Date.now() + CALL_TIMEOUT_MS).toISOString(),
      });
    }

    await this.persistCallStart(call);

    logger.info('[ChatCall] AI coach call initiated', {
      callId: call.id,
      chatId,
      targetUserId,
      sessionType: context.sessionType,
    });

    return call;
  }

  private async findOrCreateAICoachChat(userId: string): Promise<string> {
    const result = await query<{ id: string }>(
      `SELECT c.id FROM chats c
       JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = $1
       JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = $2
       WHERE c.is_group_chat = false AND cp1.left_at IS NULL AND cp2.left_at IS NULL
       LIMIT 1`,
      [AI_COACH_USER_ID, userId],
    );
    if (result.rows[0]) return result.rows[0].id;

    const chat = await chatService.createOrGetChat({
      userId: AI_COACH_USER_ID,
      otherUserId: userId,
      isGroupChat: false,
    });
    return chat.id;
  }
```

- [ ] **Step 2: Add AI coach outcome handling in `finishCall`**

Modify the `finishCall` method. After the existing `this.calls.delete(call.id)` line and before the `logger.info` line, add:

```typescript
    // Durable AI coach call outcome tracking
    if (call.initiatorId === AI_COACH_USER_ID) {
      this.handleAICoachCallOutcome(call, status).catch((err) => {
        logger.error('[ChatCall] AI coach outcome handling failed', {
          callId: call.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
```

Then add the private method to the class:

```typescript
  private async handleAICoachCallOutcome(
    call: ChatCallSession,
    status: ChatCallStatus,
  ): Promise<void> {
    const targetUserId = call.participantIds.find((id) => id !== AI_COACH_USER_ID);
    if (!targetUserId) return;

    try {
      if (status === 'ended' && call.startedAt) {
        // Call was answered and completed
        await query(
          `UPDATE ai_coach_call_log
           SET status = 'answered', answered_at = $1, ended_at = $2,
               call_duration_seconds = $3, chat_call_id = $4, updated_at = NOW()
           WHERE id = (
             SELECT id FROM ai_coach_call_log
             WHERE chat_call_id = $4 OR
                   (user_id = $5 AND status = 'initiated' AND scheduled_date = CURRENT_DATE)
             LIMIT 1
           )`,
          [
            call.startedAt,
            call.endedAt || new Date(),
            this.durationSeconds(call),
            call.id,
            targetUserId,
          ],
        );

        const hour = call.createdAt.getUTCHours();
        await communicationPreferencesService.recordAnswer(targetUserId, hour);

      } else if (status === 'missed' || status === 'declined' || status === 'cancelled') {
        await query(
          `UPDATE ai_coach_call_log
           SET status = $1, chat_call_id = $2, ended_at = NOW(), updated_at = NOW()
           WHERE id = (
             SELECT id FROM ai_coach_call_log
             WHERE chat_call_id = $2 OR
                   (user_id = $3 AND status = 'initiated' AND scheduled_date = CURRENT_DATE)
             LIMIT 1
           )`,
          [
            status === 'cancelled' ? 'missed' : status,
            call.id,
            targetUserId,
          ],
        );

        const hour = call.createdAt.getUTCHours();
        await communicationPreferencesService.recordMiss(targetUserId, hour);

        // Send follow-up chat message
        await this.sendMissedCallFollowUp(targetUserId, call);
      }
    } catch (error) {
      logger.error('[ChatCall] Failed to update ai_coach_call_log', {
        callId: call.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async sendMissedCallFollowUp(
    userId: string,
    call: ChatCallSession,
  ): Promise<void> {
    try {
      const chatId = call.chatId;
      const hour = call.createdAt.getUTCHours();
      const timeStr = call.createdAt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const prefs = await communicationPreferencesService.getForUser(userId);
      const missCount = prefs.checkin_miss_count_by_hour?.[String(hour)] || 0;

      let content: string;
      if (missCount >= 3) {
        content = `Hey! I tried calling at ${timeStr} but couldn't reach you. I've noticed this time doesn't seem to work well — would you like to pick a different time for our check-ins?`;
      } else if (missCount === 2) {
        content = `I tried to call at ${timeStr} — no worries if you were busy! Is this still a good time for check-ins, or should we try a different slot?`;
      } else {
        content = `Hey, I tried reaching you at ${timeStr} for a quick check-in! Whenever you're free, I'm here. How's your day going?`;
      }

      const message = await messageService.sendMessage({
        chatId,
        senderId: AI_COACH_USER_ID,
        content,
        contentType: 'text',
      });

      await query(
        `UPDATE ai_coach_call_log SET followup_message_id = $1, updated_at = NOW()
         WHERE chat_call_id = $2`,
        [message.id, call.id],
      );

      await pushNotificationService.deliverForUser(userId, {
        title: 'Missed check-in',
        body: 'Your coach tried to call. Tap to chat.',
        type: 'missed_checkin',
        category: 'coaching',
        actionUrl: `/chat?chatId=${chatId}`,
      });
    } catch (error) {
      logger.error('[ChatCall] Failed to send missed call follow-up', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors. Fix any import issues if needed.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/chat-call.service.ts
git commit -m "feat(ai-coach-call): add initiateAICoachCall and outcome handling"
```

---

## Task 6: AI Coach Call Worker

**Files:**
- Create: `server/src/workers/ai-coach-call.worker.ts`
- Create: `server/src/workers/__tests__/ai-coach-call.worker.test.ts`

- [ ] **Step 1: Write failing test for the worker**

Create `server/src/workers/__tests__/ai-coach-call.worker.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/queue.config.js', () => ({
  redisConnection: { host: 'localhost', port: 6379 },
  QueueNames: { AI_COACH_CALL: 'ai-coach-call' },
  JobTypes: { INITIATE_AI_CALL: 'initiate-ai-call' },
}));
vi.mock('../../config/database.config.js', () => ({
  query: vi.fn(),
}));
vi.mock('../../services/logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../services/communication-preferences.service.js', () => ({
  communicationPreferencesService: {
    getForUser: vi.fn(),
  },
}));
vi.mock('../../services/voice-schedule.service.js', () => ({
  voiceScheduleService: {
    getPreferences: vi.fn(),
  },
}));
vi.mock('../../services/chat-call.service.js', () => ({
  chatCallService: {
    initiateAICoachCall: vi.fn(),
  },
  default: {
    initiateAICoachCall: vi.fn(),
  },
}));
vi.mock('../../services/push-notification.service.js', () => ({
  pushNotificationService: {
    deliverForUser: vi.fn(),
  },
}));
vi.mock('../../services/socket.service.js', () => ({
  socketService: {
    isUserConnected: vi.fn(),
  },
}));
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

import { processAICoachCallJob } from '../ai-coach-call.worker.js';
import { query } from '../../config/database.config.js';
import { communicationPreferencesService } from '../../services/communication-preferences.service.js';
import { voiceScheduleService } from '../../services/voice-schedule.service.js';
import { chatCallService } from '../../services/chat-call.service.js';
import { socketService } from '../../services/socket.service.js';

const mockQuery = vi.mocked(query);

describe('processAICoachCallJob', () => {
  const baseJob = {
    id: 'job-1',
    data: {
      userId: 'user-1',
      scheduledTimeHHMM: '21:00',
      scheduledDate: '2026-05-13',
      timezone: 'UTC',
      sessionType: 'quick_checkin' as const,
      attempt: 1,
    },
    attemptsMade: 0,
    log: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: user is active, has subscription
    mockQuery
      .mockResolvedValueOnce({ // users check
        rows: [{ id: 'user-1', is_active: true, timezone: 'UTC' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any)
      .mockResolvedValueOnce({ // daily cap check
        rows: [{ c: '0' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any)
      .mockResolvedValueOnce({ // update log to initiated
        rows: [], rowCount: 1, command: '', oid: 0, fields: [],
      } as any);

    vi.mocked(voiceScheduleService.getPreferences).mockResolvedValue({
      voiceId: 'alloy',
      speechPace: 1.0,
      voicePreviewPlayed: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      dndDays: [],
      aiCallFrequency: 'moderate',
      preferredCallTimes: ['21:00'],
    });

    vi.mocked(communicationPreferencesService.getForUser).mockResolvedValue({
      user_id: 'user-1',
      checkin_push_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      workdays_only: false,
      max_checkins_per_day: 3,
      missed_followup_hours: 24,
      push_achievements: true,
      push_streaks: true,
      push_nudges: true,
      email_digest: true,
      email_urgent_only: false,
      checkin_miss_count_by_hour: {},
    });

    vi.mocked(socketService.isUserConnected).mockReturnValue(true);
    vi.mocked(chatCallService.initiateAICoachCall).mockResolvedValue({
      id: 'call-1',
    } as any);
  });

  it('initiates a call when all gates pass', async () => {
    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ sessionType: 'quick_checkin' }),
    );
  });

  it('skips when ai_call_frequency is off', async () => {
    vi.mocked(voiceScheduleService.getPreferences).mockResolvedValue({
      voiceId: 'alloy',
      speechPace: 1.0,
      voicePreviewPlayed: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      dndDays: [],
      aiCallFrequency: 'off',
      preferredCallTimes: [],
    });

    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when user is offline and logs skipped_offline', async () => {
    vi.mocked(socketService.isUserConnected).mockReturnValue(false);

    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).not.toHaveBeenCalled();
  });

  it('skips when miss threshold exceeded for this hour', async () => {
    vi.mocked(communicationPreferencesService.getForUser).mockResolvedValue({
      user_id: 'user-1',
      checkin_push_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
      workdays_only: false,
      max_checkins_per_day: 3,
      missed_followup_hours: 24,
      push_achievements: true,
      push_streaks: true,
      push_nudges: true,
      email_digest: true,
      email_urgent_only: false,
      checkin_miss_count_by_hour: { '21': 3 },
    });

    await processAICoachCallJob(baseJob as any);
    expect(chatCallService.initiateAICoachCall).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run src/workers/__tests__/ai-coach-call.worker.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the worker**

Create `server/src/workers/ai-coach-call.worker.ts`:

```typescript
import { Worker, Job } from 'bullmq';
import { redisConnection, QueueNames, JobTypes } from '../config/queue.config.js';
import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { communicationPreferencesService } from '../services/communication-preferences.service.js';
import { voiceScheduleService } from '../services/voice-schedule.service.js';
import { chatCallService } from '../services/chat-call.service.js';
import { pushNotificationService } from '../services/push-notification.service.js';
import { socketService } from '../services/socket.service.js';
import { getUserLocalHour } from '../lib/user-timezone.js';
import type { AICoachCallJobData } from '../services/ai-coach-call-queue.service.js';

const CHECKIN_MISS_SKIP_THRESHOLD = process.env.CHECKIN_MISS_SKIP_THRESHOLD
  ? parseInt(process.env.CHECKIN_MISS_SKIP_THRESHOLD, 10)
  : 3;

const AI_COACH_CALL_BULLMQ_ENABLED = process.env.AI_COACH_CALL_BULLMQ_ENABLED !== 'false';

interface SkipResult {
  skip: true;
  reason: string;
  status: 'skipped' | 'skipped_offline';
}
interface PassResult {
  skip: false;
}
type GateResult = SkipResult | PassResult;

async function runGateChecks(job: Job<AICoachCallJobData>): Promise<GateResult> {
  const { userId, scheduledTimeHHMM, timezone } = job.data;

  if (!AI_COACH_CALL_BULLMQ_ENABLED) {
    return { skip: true, reason: 'feature_flag_disabled', status: 'skipped' };
  }

  // Gate 1: Account active
  const userResult = await query<{ id: string; is_active: boolean }>(
    `SELECT id, is_active FROM users WHERE id = $1`,
    [userId],
  );
  if (!userResult.rows[0]?.is_active) {
    return { skip: true, reason: 'account_inactive', status: 'skipped' };
  }

  // Gate 2: AI calls enabled
  const schedPrefs = await voiceScheduleService.getPreferences(userId);
  if (schedPrefs.aiCallFrequency === 'off') {
    return { skip: true, reason: 'ai_calls_disabled', status: 'skipped' };
  }

  // Gate 3: Check-in push consent
  const commPrefs = await communicationPreferencesService.getForUser(userId);
  if (!commPrefs.checkin_push_enabled) {
    return { skip: true, reason: 'checkin_push_disabled', status: 'skipped' };
  }

  // Gate 4: DND day
  const now = new Date();
  const dayOfWeek = parseInt(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'narrow' })
      .formatToParts(now)
      .find((p) => p.type === 'weekday')?.value || '0',
    10,
  );
  const dayIndex = new Date().toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short' });
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDay = dayMap[dayIndex] ?? now.getDay();
  if (schedPrefs.dndDays.includes(currentDay)) {
    return { skip: true, reason: 'dnd_day', status: 'skipped' };
  }

  // Gate 5: Quiet hours
  if (schedPrefs.quietHoursEnabled) {
    const localHour = getUserLocalHour(timezone);
    const qStart = parseInt(schedPrefs.quietHoursStart.split(':')[0]!, 10);
    const qEnd = parseInt(schedPrefs.quietHoursEnd.split(':')[0]!, 10);
    const inQuiet = qStart < qEnd
      ? localHour >= qStart && localHour < qEnd
      : localHour >= qStart || localHour < qEnd;
    if (inQuiet) {
      return { skip: true, reason: 'quiet_hours', status: 'skipped' };
    }
  }

  // Gate 6: Miss threshold
  const hour = parseInt(scheduledTimeHHMM.split(':')[0]!, 10);
  const missByHour = commPrefs.checkin_miss_count_by_hour || {};
  const missCount = Number(missByHour[String(hour)] ?? 0);
  if (missCount >= CHECKIN_MISS_SKIP_THRESHOLD) {
    return { skip: true, reason: 'miss_threshold', status: 'skipped' };
  }

  // Gate 7: Daily cap
  const capResult = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM ai_coach_call_log
     WHERE user_id = $1 AND scheduled_date = $2::DATE
       AND status IN ('initiated', 'answered')`,
    [userId, job.data.scheduledDate],
  );
  if (parseInt(capResult.rows[0]?.c || '0', 10) >= commPrefs.max_checkins_per_day) {
    return { skip: true, reason: 'daily_cap', status: 'skipped' };
  }

  // Gate 8: User online
  if (!socketService.isUserConnected(userId)) {
    return { skip: true, reason: 'offline', status: 'skipped_offline' };
  }

  return { skip: false };
}

export async function processAICoachCallJob(job: Job<AICoachCallJobData>): Promise<void> {
  const { userId, scheduledTimeHHMM, scheduledDate, timezone, sessionType } = job.data;

  logger.info('[AICoachCallWorker] Processing job', {
    jobId: job.id,
    userId,
    scheduledTimeHHMM,
    scheduledDate,
  });

  const gateResult = await runGateChecks(job);
  if (gateResult.skip) {
    logger.info('[AICoachCallWorker] Skipped', {
      userId,
      reason: gateResult.reason,
      status: gateResult.status,
    });
    await query(
      `UPDATE ai_coach_call_log
       SET status = $1, skip_reason = $2, updated_at = NOW()
       WHERE user_id = $3 AND scheduled_date = $4::DATE
         AND scheduled_time = $5::TIME AND status = 'scheduled'`,
      [gateResult.status, gateResult.reason, userId, scheduledDate, scheduledTimeHHMM],
    );
    return;
  }

  // Update log to initiated
  await query(
    `UPDATE ai_coach_call_log
     SET status = 'initiated', initiated_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND scheduled_date = $2::DATE
       AND scheduled_time = $3::TIME AND status = 'scheduled'`,
    [userId, scheduledDate, scheduledTimeHHMM],
  );

  try {
    const call = await chatCallService.initiateAICoachCall(userId, {
      preCallContext: `Scheduled ${sessionType} check-in at ${scheduledTimeHHMM} ${timezone}`,
      sessionType,
    });

    // Link the chat_call_id to the log
    await query(
      `UPDATE ai_coach_call_log SET chat_call_id = $1, updated_at = NOW()
       WHERE user_id = $2 AND scheduled_date = $3::DATE
         AND scheduled_time = $4::TIME AND status = 'initiated'`,
      [call.id, userId, scheduledDate, scheduledTimeHHMM],
    );

    logger.info('[AICoachCallWorker] Call initiated', {
      userId,
      callId: call.id,
      scheduledTimeHHMM,
    });
  } catch (error) {
    logger.error('[AICoachCallWorker] Failed to initiate call', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    await query(
      `UPDATE ai_coach_call_log
       SET status = 'skipped', skip_reason = $1, updated_at = NOW()
       WHERE user_id = $2 AND scheduled_date = $3::DATE
         AND scheduled_time = $4::TIME AND status = 'initiated'`,
      [`error: ${(error as Error).message?.substring(0, 100)}`, userId, scheduledDate, scheduledTimeHHMM],
    );

    throw error;
  }
}

// ── Worker instance ──

let aiCoachCallWorker: Worker | null = null;

export function startAICoachCallWorker(): Worker {
  if (aiCoachCallWorker) return aiCoachCallWorker;

  aiCoachCallWorker = new Worker(QueueNames.AI_COACH_CALL, processAICoachCallJob, {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 10000,
    },
  });

  aiCoachCallWorker.on('completed', (job) => {
    logger.debug('[AICoachCallWorker] Job completed', { jobId: job.id });
  });

  aiCoachCallWorker.on('failed', (job, err) => {
    logger.error('[AICoachCallWorker] Job failed', {
      jobId: job?.id,
      error: err.message,
    });
  });

  aiCoachCallWorker.on('error', (err) => {
    logger.error('[AICoachCallWorker] Worker error', { error: err.message });
  });

  aiCoachCallWorker.on('ready', () => {
    logger.info('[AICoachCallWorker] Ready and waiting for jobs');
  });

  logger.info('[AICoachCallWorker] Started', {
    concurrency: 10,
    rateLimit: '50 calls/10s',
  });

  return aiCoachCallWorker;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run src/workers/__tests__/ai-coach-call.worker.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/workers/ai-coach-call.worker.ts server/src/workers/__tests__/ai-coach-call.worker.test.ts
git commit -m "feat(ai-coach-call): add BullMQ worker with gate checks"
```

---

## Task 7: AI Coach Call Reconciler Job

**Files:**
- Create: `server/src/jobs/ai-coach-call-reconciler.job.ts`

- [ ] **Step 1: Implement the reconciler**

Create `server/src/jobs/ai-coach-call-reconciler.job.ts`:

```typescript
import { query } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { aiCoachCallQueueService } from '../services/ai-coach-call-queue.service.js';
import { getUserLocalDateISO } from '../lib/user-timezone.js';

const BATCH = 200;
const RECONCILER_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STUCK_INITIATED_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

let intervalId: NodeJS.Timeout | null = null;
let isRunning = false;

async function reconcile(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  const start = Date.now();
  let usersProcessed = 0;
  let jobsScheduled = 0;
  let stuckRecovered = 0;

  try {
    // 1. Recover stuck "initiated" rows (server crashed mid-call)
    const stuckThreshold = new Date(Date.now() - STUCK_INITIATED_THRESHOLD_MS).toISOString();
    const stuckResult = await query(
      `UPDATE ai_coach_call_log
       SET status = 'missed', skip_reason = 'stuck_initiated_recovered', updated_at = NOW()
       WHERE status = 'initiated' AND initiated_at < $1`,
      [stuckThreshold],
    );
    stuckRecovered = stuckResult.rowCount || 0;
    if (stuckRecovered > 0) {
      logger.info('[AICoachReconciler] Recovered stuck initiated rows', { count: stuckRecovered });
    }

    // 2. Schedule today's jobs for all eligible users
    if (!aiCoachCallQueueService.isAvailable()) {
      logger.info('[AICoachReconciler] Queue not available, skipping job scheduling');
      return;
    }

    let cursor = '00000000-0000-0000-0000-000000000000';

    while (true) {
      const users = await query<{
        user_id: string;
        timezone: string;
        preferred_call_times: string[];
        ai_call_frequency: string;
        dnd_days: number[];
      }>(
        `SELECT up.user_id,
                COALESCE(u.timezone, 'UTC') AS timezone,
                up.preferred_call_times,
                up.ai_call_frequency,
                COALESCE(up.dnd_days, '{}') AS dnd_days
         FROM user_preferences up
         JOIN users u ON u.id = up.user_id AND u.is_active = true
         WHERE up.user_id > $1::uuid
           AND up.ai_call_frequency != 'off'
           AND up.preferred_call_times IS NOT NULL
           AND array_length(up.preferred_call_times, 1) > 0
         ORDER BY up.user_id ASC
         LIMIT $2`,
        [cursor, BATCH],
      );

      if (users.rows.length === 0) break;

      for (const row of users.rows) {
        usersProcessed++;
        cursor = row.user_id;

        try {
          const today = getUserLocalDateISO(row.timezone);

          // Check DND day
          const dayStr = new Date().toLocaleDateString('en-US', {
            timeZone: row.timezone,
            weekday: 'short',
          });
          const dayMap: Record<string, number> = {
            Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
          };
          if (row.dnd_days.includes(dayMap[dayStr] ?? -1)) continue;

          for (const time of row.preferred_call_times) {
            await aiCoachCallQueueService.scheduleCall(
              row.user_id,
              time,
              row.timezone,
              today,
            );
            jobsScheduled++;
          }
        } catch (error) {
          logger.debug('[AICoachReconciler] Skip user', {
            userId: row.user_id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (users.rows.length < BATCH) break;
    }

    logger.info('[AICoachReconciler] Cycle complete', {
      usersProcessed,
      jobsScheduled,
      stuckRecovered,
      ms: Date.now() - start,
    });
  } catch (error) {
    logger.error('[AICoachReconciler] Fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    isRunning = false;
  }
}

function start(): void {
  if (intervalId) return;
  // Run first reconciliation immediately, then every 24h
  reconcile().catch(() => {});
  intervalId = setInterval(() => {
    reconcile().catch(() => {});
  }, RECONCILER_INTERVAL_MS);
  logger.info('[AICoachReconciler] Started', { intervalMs: RECONCILER_INTERVAL_MS });
}

function stop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  logger.info('[AICoachReconciler] Stopped');
}

export const aiCoachCallReconcilerJob = { start, stop };
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/jobs/ai-coach-call-reconciler.job.ts
git commit -m "feat(ai-coach-call): add daily reconciler job"
```

---

## Task 8: Voice Schedule Service — BullMQ Sync on Preference Update

**Files:**
- Modify: `server/src/services/voice-schedule.service.ts`

- [ ] **Step 1: Add the import for aiCoachCallQueueService**

Add at the top of `voice-schedule.service.ts`:

```typescript
import { aiCoachCallQueueService } from './ai-coach-call-queue.service.js';
```

- [ ] **Step 2: Add BullMQ sync after preference update**

In the `updateScheduleSettings` method, after the `UPDATE user_preferences` query succeeds and before the `// Return updated settings` comment, add:

```typescript
      // Sync BullMQ jobs when call-related preferences change
      if (
        settings.preferredCallTimes !== undefined ||
        settings.aiCallFrequency !== undefined ||
        settings.dndDays !== undefined ||
        settings.quietHoursEnabled !== undefined
      ) {
        try {
          await aiCoachCallQueueService.syncUserSchedule(userId);
        } catch (syncError) {
          logger.warn('[VoiceSchedule] BullMQ sync failed (non-blocking)', {
            userId,
            error: syncError instanceof Error ? syncError.message : 'Unknown',
          });
        }
      }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/voice-schedule.service.ts
git commit -m "feat(ai-coach-call): sync BullMQ jobs on preference update"
```

---

## Task 9: Index.ts — Startup and Graceful Shutdown

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: Add imports**

Add these imports at the top of `index.ts`, after the existing job imports:

```typescript
import { aiCoachCallReconcilerJob } from "./jobs/ai-coach-call-reconciler.job.js";
```

Add to the lazy worker variables section (around line 57–59):

```typescript
let aiCoachCallWorker: { close: () => Promise<void> } | null = null;
let aiCoachCallQueueServiceRef: { close: () => Promise<void> } | null = null;
```

- [ ] **Step 2: Start worker in the Redis block**

In the `if (env.redis.enabled)` block in `startServer()`, after the email worker startup (around line 270), add:

```typescript
      // Start AI coach call worker
      try {
        const { startAICoachCallWorker } = await import("./workers/ai-coach-call.worker.js");
        const { aiCoachCallQueueService } = await import("./services/ai-coach-call-queue.service.js");
        aiCoachCallWorker = startAICoachCallWorker();
        aiCoachCallQueueServiceRef = aiCoachCallQueueService;
        logger.info("AI coach call worker started (Redis available)");
      } catch (err) {
        logger.warn("Failed to start AI coach call worker", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
```

- [ ] **Step 3: Start reconciler in the staggered jobs section**

In the staggered heavy jobs section, add after the last existing staggered job (wiki lint at 1800s):

```typescript
        setTimeout(() => {
          aiCoachCallReconcilerJob.start();
          logger.info("AI coach call reconciler job started (staggered 1860s)");
        }, 1860_000);
```

- [ ] **Step 4: Add graceful shutdown**

In the `gracefulShutdown` function, add after the email worker close block (around line 178):

```typescript
    // Close AI coach call worker and queue (if started)
    if (aiCoachCallWorker) await aiCoachCallWorker.close();
    if (aiCoachCallQueueServiceRef) await aiCoachCallQueueServiceRef.close();
    logger.info("AI coach call worker and queue closed");

    aiCoachCallReconcilerJob.stop();
    logger.info("AI coach call reconciler stopped");
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/index.ts
git commit -m "feat(ai-coach-call): register worker, reconciler, and shutdown in index.ts"
```

---

## Summary

| Task | What | Key files |
|------|------|-----------|
| 1 | Database migration | `20260513_ai_coach_call_log.sql` |
| 2 | Queue config | `queue.config.ts` |
| 3 | Miss/answer tracking | `communication-preferences.service.ts` |
| 4 | Queue service | `ai-coach-call-queue.service.ts` |
| 5 | Chat call extension | `chat-call.service.ts` |
| 6 | BullMQ worker | `ai-coach-call.worker.ts` |
| 7 | Reconciler job | `ai-coach-call-reconciler.job.ts` |
| 8 | Preference sync | `voice-schedule.service.ts` |
| 9 | Startup/shutdown | `index.ts` |

**Dependencies:** Tasks 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 (sequential — each builds on prior).
