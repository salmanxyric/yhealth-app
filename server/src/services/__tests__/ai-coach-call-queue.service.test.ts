import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures these are available when vi.mock factories run (which are hoisted)
const { mockQueueAdd, mockQueueClose, mockGetJob } = vi.hoisted(() => ({
  mockQueueAdd: vi.fn().mockResolvedValue({ id: 'job-123' }),
  mockQueueClose: vi.fn().mockResolvedValue(undefined),
  mockGetJob: vi.fn(),
}));

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
vi.mock('../../lib/user-timezone.js', () => ({
  localTimeToUtc: vi.fn().mockReturnValue(new Date(Date.now() + 3600000)), // 1 hour in future
  getUserLocalDateISO: vi.fn().mockReturnValue('2027-12-25'),
}));
vi.mock('bullmq', () => ({
  // Must use regular function (not arrow) so `new Queue(...)` works as a constructor
  Queue: vi.fn().mockImplementation(function () {
    return {
      add: mockQueueAdd,
      close: mockQueueClose,
      getJob: mockGetJob,
      on: vi.fn(),
    };
  }),
  QueueEvents: vi.fn().mockImplementation(function () {
    return {
      on: vi.fn(),
      close: vi.fn(),
    };
  }),
}));

import { aiCoachCallQueueService } from '../ai-coach-call-queue.service.js';
import { query } from '../../config/database.config.js';
import { localTimeToUtc } from '../../lib/user-timezone.js';

const mockQuery = vi.mocked(query);
const mockLocalTimeToUtc = vi.mocked(localTimeToUtc);

describe('AICoachCallQueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore defaults cleared by clearAllMocks
    mockLocalTimeToUtc.mockReturnValue(new Date(Date.now() + 3600000));
    mockQueueAdd.mockResolvedValue({ id: 'job-123' });
    mockQueueClose.mockResolvedValue(undefined);
  });

  describe('scheduleCall', () => {
    it('adds a delayed job with correct jobId and delay', async () => {
      // Mock: no existing log row
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0, command: '', oid: 0, fields: [],
      } as any);
      // Mock: INSERT returns new log row
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'log-1' }],
        rowCount: 1, command: '', oid: 0, fields: [],
      } as any);
      // Mock: UPDATE bullmq_job_id
      mockQuery.mockResolvedValueOnce({
        rows: [], rowCount: 1, command: '', oid: 0, fields: [],
      } as any);

      await aiCoachCallQueueService.scheduleCall(
        'user-abc',
        '21:00',
        'UTC',
        '2027-12-25'
      );

      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
      const [jobType, jobData, opts] = mockQueueAdd.mock.calls[0]!;
      expect(jobType).toBe('initiate-ai-call');
      expect(jobData.userId).toBe('user-abc');
      expect(jobData.scheduledTimeHHMM).toBe('21:00');
      expect(jobData.timezone).toBe('UTC');
      expect(opts.jobId).toBe('ai-call:user-abc:2027-12-25:21:00');
      expect(opts.delay).toBeGreaterThan(0);
    });

    it('skips scheduling if time is in the past', async () => {
      // Override to return a past date for this test
      mockLocalTimeToUtc.mockReturnValueOnce(new Date('2020-01-01T01:00:00Z'));

      await aiCoachCallQueueService.scheduleCall(
        'user-abc',
        '01:00',
        'UTC',
        '2020-01-01'
      );

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });
  });

  describe('cancelUserJobs', () => {
    it('removes BullMQ jobs using stored job IDs from DB', async () => {
      const mockRemove = vi.fn().mockResolvedValue(undefined);
      mockGetJob.mockResolvedValue({ remove: mockRemove });

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { bullmq_job_id: 'ai-call:user-abc:2026-05-14:09:00' },
            { bullmq_job_id: 'ai-call:user-abc:2026-05-14:21:00' },
          ],
          rowCount: 2, command: '', oid: 0, fields: [],
        } as any)
        .mockResolvedValueOnce({
          rows: [], rowCount: 2, command: '', oid: 0, fields: [],
        } as any);

      await aiCoachCallQueueService.cancelUserJobs('user-abc');

      expect(mockGetJob).toHaveBeenCalledTimes(2);
      expect(mockRemove).toHaveBeenCalledTimes(2);
    });
  });
});
