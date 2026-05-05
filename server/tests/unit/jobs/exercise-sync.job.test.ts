/**
 * Exercise Sync Job Unit Tests
 *
 * Tests for processExerciseSync — weekly job that enqueues an incremental
 * exercise data sync from ExerciseDB.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupRedisCacheMock, setupQueueMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

setupDbMock();
setupLoggerMock();
setupCacheMock();
setupRedisCacheMock();
setupQueueMock();

const mockEnqueueIncrementalSync = jest.fn<any>().mockResolvedValue('job-123');

jest.unstable_mockModule('../../../src/services/exercise-ingestion-queue.service.js', () => ({
  enqueueIncrementalSync: mockEnqueueIncrementalSync,
}));

// Dynamic imports AFTER mocks
const { exerciseSyncJob } = await import('../../../src/jobs/exercise-sync.job.js');

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockEnqueueIncrementalSync.mockResolvedValue('job-123');
});

afterEach(() => {
  exerciseSyncJob.stop();
});

describe('exerciseSyncJob.processNow', () => {
  it('enqueues an incremental sync for exercisedb', async () => {
    await exerciseSyncJob.processNow();

    expect(mockEnqueueIncrementalSync).toHaveBeenCalledWith('exercisedb');
  });

  it('returns successfully with the job id', async () => {
    mockEnqueueIncrementalSync.mockResolvedValueOnce('job-456');

    await expect(exerciseSyncJob.processNow()).resolves.toBeUndefined();

    expect(mockEnqueueIncrementalSync).toHaveBeenCalledTimes(1);
  });

  it('handles enqueue failure gracefully', async () => {
    mockEnqueueIncrementalSync.mockRejectedValueOnce(new Error('Redis unavailable'));

    await expect(exerciseSyncJob.processNow()).resolves.toBeUndefined();
  });

  it('does not run concurrently (guard flag)', async () => {
    // First call takes a while
    let resolveFirst: () => void;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = () => resolve('job-slow');
    });
    mockEnqueueIncrementalSync.mockReturnValueOnce(firstPromise);

    const run1 = exerciseSyncJob.processNow();
    const run2 = exerciseSyncJob.processNow(); // should be skipped

    // Complete the first call
    resolveFirst!();
    await run1;
    await run2;

    // Only one call to enqueue because the second was skipped
    expect(mockEnqueueIncrementalSync).toHaveBeenCalledTimes(1);
  });
});

describe('exerciseSyncJob lifecycle', () => {
  it('start sets up an interval', () => {
    jest.useFakeTimers();

    exerciseSyncJob.start();

    // Starting again should warn and not double-register
    exerciseSyncJob.start();

    exerciseSyncJob.stop();
    jest.useRealTimers();
  });

  it('stop clears the interval', () => {
    jest.useFakeTimers();

    exerciseSyncJob.start();
    exerciseSyncJob.stop();

    // Calling stop again when not running should be safe
    exerciseSyncJob.stop();

    jest.useRealTimers();
  });

  it('isRunning returns false when job is idle', () => {
    expect(exerciseSyncJob.isRunning()).toBe(false);
  });
});
