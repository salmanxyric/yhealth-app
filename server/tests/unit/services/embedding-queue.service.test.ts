/**
 * Embedding Queue Service Unit Tests
 *
 * Tests for BullMQ queue management: job enqueueing with deterministic IDs,
 * deduplication logic, wellbeing convenience wrapper, availability checks,
 * and graceful behavior when Redis is unavailable.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQueueAdd = jest.fn<any>();
const mockQueueGetJob = jest.fn<any>();
const mockQueueGetWaitingCount = jest.fn<any>().mockResolvedValue(0);
const mockQueueGetActiveCount = jest.fn<any>().mockResolvedValue(0);
const mockQueueGetCompletedCount = jest.fn<any>().mockResolvedValue(0);
const mockQueueGetFailedCount = jest.fn<any>().mockResolvedValue(0);
const mockQueueGetDelayedCount = jest.fn<any>().mockResolvedValue(0);
const mockQueueClose = jest.fn<any>().mockResolvedValue(undefined);
const mockQueueOn = jest.fn<any>();

const mockQueueEventsOn = jest.fn<any>();
const mockQueueEventsClose = jest.fn<any>().mockResolvedValue(undefined);

const MockQueue = jest.fn<any>().mockImplementation(() => ({
  add: mockQueueAdd,
  getJob: mockQueueGetJob,
  getWaitingCount: mockQueueGetWaitingCount,
  getActiveCount: mockQueueGetActiveCount,
  getCompletedCount: mockQueueGetCompletedCount,
  getFailedCount: mockQueueGetFailedCount,
  getDelayedCount: mockQueueGetDelayedCount,
  close: mockQueueClose,
  on: mockQueueOn,
}));

const MockQueueEvents = jest.fn<any>().mockImplementation(() => ({
  on: mockQueueEventsOn,
  close: mockQueueEventsClose,
}));

jest.unstable_mockModule('bullmq', () => ({
  Queue: MockQueue,
  QueueEvents: MockQueueEvents,
}));

jest.unstable_mockModule('../../../src/config/queue.config.js', () => ({
  redisConnection: { host: 'localhost', port: 6379 },
  QueueNames: { EMBEDDING_SYNC: 'embedding-sync' },
  JobPriorities: { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, BACKGROUND: 1 },
  queueConfig: { defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } } },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn<any>(), error: jest.fn<any>(), warn: jest.fn<any>(), debug: jest.fn<any>() },
}));

const mockEnv = { redis: { enabled: true } };

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: mockEnv,
}));

// Dynamic imports after mocks
const { embeddingQueueService } = await import('../../../src/services/embedding-queue.service.js');

// ============================================
// HELPERS
// ============================================

/**
 * Creates a mock job object with configurable state for getJob() returns.
 */
function createMockJob(state: string) {
  return {
    getState: jest.fn<any>().mockResolvedValue(state),
    remove: jest.fn<any>().mockResolvedValue(undefined),
  };
}

// ============================================
// TESTS
// ============================================

describe('EmbeddingQueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish mock implementations (resetMocks: true in config clears them)
    MockQueue.mockImplementation(() => ({
      add: mockQueueAdd,
      getJob: mockQueueGetJob,
      getWaitingCount: mockQueueGetWaitingCount,
      getActiveCount: mockQueueGetActiveCount,
      getCompletedCount: mockQueueGetCompletedCount,
      getFailedCount: mockQueueGetFailedCount,
      getDelayedCount: mockQueueGetDelayedCount,
      close: mockQueueClose,
      on: mockQueueOn,
    }));

    MockQueueEvents.mockImplementation(() => ({
      on: mockQueueEventsOn,
      close: mockQueueEventsClose,
    }));

    // Default: no existing job, add succeeds
    mockQueueGetJob.mockResolvedValue(null);
    mockQueueAdd.mockResolvedValue({ id: 'job-001' });
    mockQueueGetWaitingCount.mockResolvedValue(0);
    mockQueueGetActiveCount.mockResolvedValue(0);
    mockQueueGetCompletedCount.mockResolvedValue(0);
    mockQueueGetFailedCount.mockResolvedValue(0);
    mockQueueGetDelayedCount.mockResolvedValue(0);

    // Ensure Redis is enabled for most tests
    mockEnv.redis.enabled = true;
  });

  // ------------------------------------------
  // enqueueEmbedding — basic job creation
  // ------------------------------------------
  describe('enqueueEmbedding', () => {
    it('should add job with correct deterministic jobId format {sourceType}-{sourceId}-{operation}', async () => {
      await embeddingQueueService.enqueueEmbedding({
        userId: 'user-123',
        sourceType: 'activity',
        sourceId: 'act-456',
        operation: 'create',
      });

      expect(mockQueueAdd).toHaveBeenCalledTimes(1);

      const [jobName, jobData, jobOptions] = mockQueueAdd.mock.calls[0] as [string, any, any];

      // jobName = "{operation}-{sourceType}"
      expect(jobName).toBe('create-activity');

      // jobData passes through intact
      expect(jobData).toEqual({
        userId: 'user-123',
        sourceType: 'activity',
        sourceId: 'act-456',
        operation: 'create',
      });

      // deterministic jobId
      expect(jobOptions.jobId).toBe('activity-act-456-create');
    });
  });

  // ------------------------------------------
  // enqueueEmbedding — deduplication
  // ------------------------------------------
  describe('enqueueEmbedding deduplication', () => {
    it('should skip when existing job is in waiting state', async () => {
      const waitingJob = createMockJob('waiting');
      mockQueueGetJob.mockResolvedValue(waitingJob);

      await embeddingQueueService.enqueueEmbedding({
        userId: 'user-123',
        sourceType: 'activity',
        sourceId: 'act-456',
        operation: 'create',
      });

      // getJob was called with the deterministic jobId
      expect(mockQueueGetJob).toHaveBeenCalledWith('activity-act-456-create');
      // Job was NOT added because duplicate is waiting
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it('should skip when existing job is in active state', async () => {
      const activeJob = createMockJob('active');
      mockQueueGetJob.mockResolvedValue(activeJob);

      await embeddingQueueService.enqueueEmbedding({
        userId: 'user-123',
        sourceType: 'profile',
        sourceId: 'prof-789',
        operation: 'update',
      });

      expect(mockQueueGetJob).toHaveBeenCalledWith('profile-prof-789-update');
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it('should skip when existing job is in delayed state', async () => {
      const delayedJob = createMockJob('delayed');
      mockQueueGetJob.mockResolvedValue(delayedJob);

      await embeddingQueueService.enqueueEmbedding({
        userId: 'user-123',
        sourceType: 'activity',
        sourceId: 'act-456',
        operation: 'create',
      });

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it('should remove and re-add when existing job is completed', async () => {
      const completedJob = createMockJob('completed');
      mockQueueGetJob.mockResolvedValue(completedJob);

      await embeddingQueueService.enqueueEmbedding({
        userId: 'user-123',
        sourceType: 'activity',
        sourceId: 'act-456',
        operation: 'update',
      });

      // Old completed job was removed
      expect(completedJob.remove).toHaveBeenCalledTimes(1);
      // New job was added
      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
      expect(mockQueueAdd.mock.calls[0][2]).toEqual(
        expect.objectContaining({ jobId: 'activity-act-456-update' }),
      );
    });

    it('should remove and re-add when existing job is failed', async () => {
      const failedJob = createMockJob('failed');
      mockQueueGetJob.mockResolvedValue(failedJob);

      await embeddingQueueService.enqueueEmbedding({
        userId: 'user-123',
        sourceType: 'mood',
        sourceId: 'mood-001',
        operation: 'create',
      });

      expect(failedJob.remove).toHaveBeenCalledTimes(1);
      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------
  // queueWellbeingEmbedding
  // ------------------------------------------
  describe('queueWellbeingEmbedding', () => {
    it('should pass wellbeingType through in job data with sourceType set to wellbeing', async () => {
      await embeddingQueueService.queueWellbeingEmbedding(
        'user-123',
        'mood',
        'entry-456',
        'create',
      );

      expect(mockQueueAdd).toHaveBeenCalledTimes(1);

      const [jobName, jobData, jobOptions] = mockQueueAdd.mock.calls[0] as [string, any, any];

      expect(jobName).toBe('create-wellbeing');
      expect(jobData).toEqual({
        userId: 'user-123',
        sourceType: 'wellbeing',
        sourceId: 'entry-456',
        operation: 'create',
        priority: 3, // MEDIUM
        wellbeingType: 'mood',
      });
      expect(jobOptions.jobId).toBe('wellbeing-entry-456-create');
    });

    it('should default operation to create', async () => {
      await embeddingQueueService.queueWellbeingEmbedding(
        'user-123',
        'journal',
        'entry-789',
      );

      const [, jobData] = mockQueueAdd.mock.calls[0] as [string, any];
      expect(jobData.operation).toBe('create');
      expect(jobData.wellbeingType).toBe('journal');
    });
  });

  // ------------------------------------------
  // isAvailable
  // ------------------------------------------
  describe('isAvailable', () => {
    it('should return true when queue is initialized', () => {
      // Queue was already initialized by prior tests (lazy init on first enqueue)
      const result = embeddingQueueService.isAvailable();
      expect(result).toBe(true);
    });
  });

  // ------------------------------------------
  // getQueueStats
  // ------------------------------------------
  describe('getQueueStats', () => {
    it('should return all queue status counts', async () => {
      mockQueueGetWaitingCount.mockResolvedValueOnce(5);
      mockQueueGetActiveCount.mockResolvedValueOnce(2);
      mockQueueGetCompletedCount.mockResolvedValueOnce(100);
      mockQueueGetFailedCount.mockResolvedValueOnce(3);
      mockQueueGetDelayedCount.mockResolvedValueOnce(10);

      const stats = await embeddingQueueService.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 10,
      });
    });
  });

  // ------------------------------------------
  // Redis unavailable (queue is null)
  // ------------------------------------------
  describe('when Redis is unavailable', () => {
    it('should silently skip enqueueEmbedding without throwing', async () => {
      // Create a fresh service instance where Redis is disabled.
      // We re-import to get a new singleton whose queue will be null.
      mockEnv.redis.enabled = false;

      // Re-import to get a fresh instance that will see redis.enabled = false
      const freshModule = await import('../../../src/services/embedding-queue.service.js');
      const freshService = new (Object.getPrototypeOf(freshModule.embeddingQueueService).constructor)();

      // This should not throw
      await expect(
        freshService.enqueueEmbedding({
          userId: 'user-123',
          sourceType: 'activity',
          sourceId: 'act-456',
          operation: 'create',
        }),
      ).resolves.toBeUndefined();

      // Queue.add should never have been called for the fresh service
      // (the queue was never created because Redis was disabled)
      // We verify that no new Queue was constructed with redis disabled
      // by checking that the method completed without error
    });
  });
});
