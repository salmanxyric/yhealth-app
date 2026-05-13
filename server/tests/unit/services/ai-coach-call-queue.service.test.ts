/**
 * AI Coach Call Queue Service — Unit Tests
 *
 * Tests scheduling, deduplication, cancellation, and sync flows.
 *
 * Note: This project uses resetMocks: true globally, so mock implementations
 * set in beforeAll are stripped before each test. We use beforeEach to
 * re-import a fresh singleton for each test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockJobAdd = jest.fn<any>();
const mockGetJob = jest.fn<any>();

let aiCoachCallQueueService: any;

beforeEach(async () => {
  jest.restoreAllMocks();

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
    env: { redis: { enabled: true } },
  }));

  jest.unstable_mockModule('../../../src/config/queue.config.js', () => ({
    redisConnection: {},
    queueConfig: { defaultJobOptions: {} },
    QueueNames: { AI_COACH_CALL: 'ai-coach-call' },
    JobTypes: { INITIATE_AI_CALL: 'initiate-ai-call' },
  }));

  jest.unstable_mockModule('../../../src/lib/user-timezone.js', () => ({
    localTimeToUtc: () => new Date(Date.now() + 3600_000),
    getUserLocalDateISO: () => '2026-05-13',
  }));

  jest.unstable_mockModule('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
      add: (...args: unknown[]) => mockJobAdd(...args),
      getJob: (...args: unknown[]) => mockGetJob(...args),
      close: jest.fn<any>().mockResolvedValue(undefined),
      on: jest.fn(),
    })),
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn<any>().mockResolvedValue(undefined),
    })),
  }));

  jest.resetModules();
  mockQuery.mockReset();
  mockJobAdd.mockReset();
  mockGetJob.mockReset();

  const mod = await import('../../../src/services/ai-coach-call-queue.service.js');
  aiCoachCallQueueService = mod.aiCoachCallQueueService;
});

describe('AICoachCallQueueService', () => {
  describe('scheduleCall', () => {
    it('creates a DB log row and BullMQ job with correct jobId', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'log-1' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      mockJobAdd.mockResolvedValue({ id: 'ai-call:user-1:2026-05-13:09:00' });

      await aiCoachCallQueueService.scheduleCall('user-1', '09:00', 'UTC', '2026-05-13');

      expect(mockJobAdd).toHaveBeenCalledWith(
        'initiate-ai-call',
        expect.objectContaining({
          userId: 'user-1',
          scheduledTimeHHMM: '09:00',
          scheduledDate: '2026-05-13',
        }),
        expect.objectContaining({
          jobId: 'ai-call:user-1:2026-05-13:09:00',
        }),
      );
    });

    it('skips scheduling when job already exists (dedup)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'log-1', bullmq_job_id: 'existing-job-id' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      });

      await aiCoachCallQueueService.scheduleCall('user-1', '09:00', 'UTC', '2026-05-13');

      expect(mockJobAdd).not.toHaveBeenCalled();
    });
  });

  describe('cancelUserJobs', () => {
    it('removes BullMQ jobs and updates DB status to cancelled', async () => {
      // Force initialize
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'x', bullmq_job_id: null }], rowCount: 1, command: '', oid: 0, fields: [] });
      mockJobAdd.mockResolvedValue({ id: 'init' });
      // Trigger initialize by calling a method
      await aiCoachCallQueueService.cancelUserJobs('init-user').catch(() => {});
      mockQuery.mockReset();
      mockJobAdd.mockReset();
      mockGetJob.mockReset();

      mockQuery.mockResolvedValueOnce({
        rows: [{ bullmq_job_id: 'job-a' }, { bullmq_job_id: 'job-b' }],
        rowCount: 2, command: '', oid: 0, fields: [],
      });

      const mockRemove = jest.fn<any>().mockResolvedValue(undefined);
      mockGetJob.mockResolvedValue({ remove: mockRemove });

      mockQuery.mockResolvedValueOnce({
        rows: [], rowCount: 2, command: '', oid: 0, fields: [],
      });

      await aiCoachCallQueueService.cancelUserJobs('user-1');

      expect(mockGetJob).toHaveBeenCalledTimes(2);
      expect(mockRemove).toHaveBeenCalledTimes(2);
    });
  });

  describe('syncUserSchedule', () => {
    it('cancels existing jobs then reschedules from preferences', async () => {
      mockJobAdd.mockResolvedValue({ id: 'mock-job-id' });

      // cancelUserJobs: SELECT + UPDATE
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });

      // SELECT preferences
      mockQuery.mockResolvedValueOnce({
        rows: [{ preferred_call_times: ['09:00', '18:00'], ai_call_frequency: 'moderate', timezone: 'UTC' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      });

      // scheduleCall for 09:00
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'log-1' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      // scheduleCall for 18:00
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'log-2' }], rowCount: 1, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      await aiCoachCallQueueService.syncUserSchedule('user-1');

      expect(mockJobAdd).toHaveBeenCalledTimes(2);
    });

    it('does not schedule when frequency is off', async () => {
      // cancelUserJobs: SELECT + UPDATE
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });

      mockQuery.mockResolvedValueOnce({
        rows: [{ preferred_call_times: ['09:00'], ai_call_frequency: 'off', timezone: 'UTC' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      });

      await aiCoachCallQueueService.syncUserSchedule('user-1');

      expect(mockJobAdd).not.toHaveBeenCalled();
    });
  });
});
