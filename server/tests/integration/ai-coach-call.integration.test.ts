/**
 * AI Coach Scheduled Calling — Integration Tests
 *
 * Tests the full pipeline: schedule → worker gate checks → call initiation.
 * Mocks BullMQ/Redis and external services, wires real service interactions.
 *
 * Note: This project uses resetMocks: true globally, so mock implementations
 * set in beforeAll are stripped before each test. We use beforeEach to
 * re-import fresh singletons for each test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockJobAdd = jest.fn<any>();
const mockGetJob = jest.fn<any>();
const mockGetPreferences = jest.fn<any>();
const mockGetForUser = jest.fn<any>();
const mockIsUserConnected = jest.fn<any>();
const mockInitiateAICoachCall = jest.fn<any>();
const mockLocalTimeToUtc = jest.fn<any>();
const mockGetUserLocalHour = jest.fn<any>();

const scheduledJobs: Array<{ name: string; data: any; opts: any }> = [];

let aiCoachCallQueueService: any;
let processAICoachCallJob: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  scheduledJobs.length = 0;

  jest.unstable_mockModule('../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../src/config/env.config.js', () => ({
    env: { redis: { enabled: true } },
  }));

  jest.unstable_mockModule('../../src/config/queue.config.js', () => ({
    redisConnection: {},
    queueConfig: { defaultJobOptions: {} },
    QueueNames: { AI_COACH_CALL: 'ai-coach-call' },
    JobTypes: { INITIATE_AI_CALL: 'initiate-ai-call' },
  }));

  jest.unstable_mockModule('../../src/lib/user-timezone.js', () => ({
    localTimeToUtc: (...args: unknown[]) => mockLocalTimeToUtc(...args),
    getUserLocalDateISO: () => '2026-05-13',
    getUserLocalHour: (...args: unknown[]) => mockGetUserLocalHour(...args),
  }));

  jest.unstable_mockModule('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
      add: (...args: unknown[]) => {
        const [name, data, opts] = args;
        scheduledJobs.push({ name, data, opts });
        return mockJobAdd(name, data, opts);
      },
      getJob: (...args: unknown[]) => mockGetJob(...args),
      close: jest.fn<any>().mockResolvedValue(undefined),
      on: jest.fn(),
    })),
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn<any>().mockResolvedValue(undefined),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      close: jest.fn<any>().mockResolvedValue(undefined),
    })),
  }));

  jest.unstable_mockModule('../../src/services/voice-schedule.service.js', () => ({
    voiceScheduleService: {
      getPreferences: (...args: unknown[]) => mockGetPreferences(...args),
    },
  }));

  jest.unstable_mockModule('../../src/services/communication-preferences.service.js', () => ({
    communicationPreferencesService: {
      getForUser: (...args: unknown[]) => mockGetForUser(...args),
    },
  }));

  jest.unstable_mockModule('../../src/services/socket.service.js', () => ({
    socketService: {
      isUserConnected: (...args: unknown[]) => mockIsUserConnected(...args),
    },
  }));

  jest.unstable_mockModule('../../src/services/chat-call.service.js', () => ({
    chatCallService: {
      initiateAICoachCall: (...args: unknown[]) => mockInitiateAICoachCall(...args),
    },
  }));

  process.env['AI_COACH_CALL_BULLMQ_ENABLED'] = 'true';

  jest.resetModules();
  mockQuery.mockReset();
  mockJobAdd.mockReset();
  mockGetJob.mockReset();
  mockGetPreferences.mockReset();
  mockGetForUser.mockReset();
  mockIsUserConnected.mockReset();
  mockInitiateAICoachCall.mockReset();
  mockLocalTimeToUtc.mockReset();
  mockGetUserLocalHour.mockReset();

  mockLocalTimeToUtc.mockReturnValue(new Date(Date.now() + 3600_000));
  mockGetUserLocalHour.mockReturnValue(9);

  const queueMod = await import('../../src/services/ai-coach-call-queue.service.js');
  aiCoachCallQueueService = queueMod.aiCoachCallQueueService;

  const workerMod = await import('../../src/workers/ai-coach-call.worker.js');
  processAICoachCallJob = workerMod.processAICoachCallJob;
});

function defaultVoicePrefs(overrides: Record<string, unknown> = {}) {
  return {
    voiceId: 'alloy', speechPace: 1.0, voicePreviewPlayed: false,
    quietHoursEnabled: false, quietHoursStart: '22:00', quietHoursEnd: '07:00',
    dndDays: [], aiCallFrequency: 'moderate', preferredCallTimes: ['09:00'],
    ...overrides,
  };
}

function defaultCommPrefs(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'user-1', checkin_push_enabled: true,
    max_checkins_per_day: 3, checkin_miss_count_by_hour: {},
    ...overrides,
  };
}

function makeWorkerJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    data: {
      userId: 'user-1', scheduledTimeHHMM: '09:00', scheduledDate: '2026-05-13',
      timezone: 'Asia/Karachi', sessionType: 'quick_checkin', attempt: 1,
      ...overrides,
    },
    attemptsMade: 0, log: jest.fn(),
  } as any;
}

describe('AI Coach Scheduled Calling — Integration', () => {
  describe('Schedule → Worker Pipeline', () => {
    it('schedules a job via queue service then processes it via worker', async () => {
      // Schedule phase
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'log-1' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      mockJobAdd.mockResolvedValue({ id: 'ai-call:user-1:2026-05-13:09:00' });

      await aiCoachCallQueueService.scheduleCall('user-1', '09:00', 'Asia/Karachi', '2026-05-13');

      expect(scheduledJobs).toHaveLength(1);
      expect(scheduledJobs[0]!.opts.jobId).toBe('ai-call:user-1:2026-05-13:09:00');

      // Worker phase
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'user-1', is_active: true }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ c: '0' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      mockGetPreferences.mockResolvedValue(defaultVoicePrefs());
      mockGetForUser.mockResolvedValue(defaultCommPrefs());
      mockIsUserConnected.mockReturnValue(true);
      mockInitiateAICoachCall.mockResolvedValue({ id: 'call-1' });

      await processAICoachCallJob(makeWorkerJob());

      expect(mockInitiateAICoachCall).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ sessionType: 'quick_checkin' }),
      );
    });
  });

  describe('Gate Check Integration', () => {
    it('offline user is skipped with skipped_offline status', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'user-1', is_active: true }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ c: '0' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      mockGetPreferences.mockResolvedValue(defaultVoicePrefs());
      mockGetForUser.mockResolvedValue(defaultCommPrefs());
      mockIsUserConnected.mockReturnValue(false);

      await processAICoachCallJob(makeWorkerJob());

      expect(mockInitiateAICoachCall).not.toHaveBeenCalled();
      const updateCall = mockQuery.mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('SET status')
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]).toContain('skipped_offline');
    });
  });

  describe('Deduplication', () => {
    it('does not create duplicate BullMQ jobs for the same user+date+time', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'log-1' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      mockJobAdd.mockResolvedValue({ id: 'ai-call:user-1:2026-05-13:09:00' });

      await aiCoachCallQueueService.scheduleCall('user-1', '09:00', 'UTC', '2026-05-13');
      expect(scheduledJobs).toHaveLength(1);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'log-1', bullmq_job_id: 'ai-call:user-1:2026-05-13:09:00' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      });

      await aiCoachCallQueueService.scheduleCall('user-1', '09:00', 'UTC', '2026-05-13');
      expect(scheduledJobs).toHaveLength(1);
    });
  });

  describe('Cancel → Reschedule Flow', () => {
    it('syncUserSchedule cancels old jobs and creates new ones', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ bullmq_job_id: 'old-job-1' }], rowCount: 1, command: '', oid: 0, fields: [],
      });
      const mockRemove = jest.fn<any>().mockResolvedValue(undefined);
      mockGetJob.mockResolvedValue({ remove: mockRemove });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      mockQuery.mockResolvedValueOnce({
        rows: [{
          preferred_call_times: ['08:00', '20:00'],
          ai_call_frequency: 'proactive',
          timezone: 'Asia/Karachi',
        }],
        rowCount: 1, command: '', oid: 0, fields: [],
      });

      // scheduleCall for 08:00
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'log-1' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      // scheduleCall for 20:00
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'log-2' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      mockJobAdd.mockResolvedValue({ id: 'mock-job-id' });

      await aiCoachCallQueueService.syncUserSchedule('user-1');

      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(scheduledJobs).toHaveLength(2);
      expect(scheduledJobs[0]!.opts.jobId).toBe('ai-call:user-1:2026-05-13:08:00');
      expect(scheduledJobs[1]!.opts.jobId).toBe('ai-call:user-1:2026-05-13:20:00');
    });
  });
});
