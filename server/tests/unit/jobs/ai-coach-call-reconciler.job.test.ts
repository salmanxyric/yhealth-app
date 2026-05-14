/**
 * AI Coach Call Reconciler — Unit Tests
 *
 * Tests stuck-initiated recovery and batch scheduling.
 * Uses beforeEach re-import pattern for resetMocks compatibility.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockScheduleCall = jest.fn<any>();
const mockIsAvailable = jest.fn<any>();

let aiCoachCallReconcilerJob: any;

beforeEach(async () => {
  jest.restoreAllMocks();

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../../src/services/ai-coach-call-queue.service.js', () => ({
    aiCoachCallQueueService: {
      isAvailable: (...args: unknown[]) => mockIsAvailable(...args),
      scheduleCall: (...args: unknown[]) => mockScheduleCall(...args),
    },
  }));

  jest.unstable_mockModule('../../../src/lib/user-timezone.js', () => ({
    getUserLocalDateISO: () => '2026-05-13',
  }));

  jest.resetModules();
  mockQuery.mockReset();
  mockScheduleCall.mockReset();
  mockIsAvailable.mockReset();

  mockIsAvailable.mockReturnValue(true);
  mockScheduleCall.mockResolvedValue(undefined);

  const mod = await import('../../../src/jobs/ai-coach-call-reconciler.job.js');
  aiCoachCallReconcilerJob = mod.aiCoachCallReconcilerJob;
});

describe('AI Coach Call Reconciler', () => {
  it('recovers stuck initiated rows and schedules jobs for eligible users', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 2, command: '', oid: 0, fields: [],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        { user_id: 'user-a', timezone: 'UTC', preferred_call_times: ['09:00', '18:00'], ai_call_frequency: 'moderate', dnd_days: [] },
        { user_id: 'user-b', timezone: 'UTC', preferred_call_times: ['12:00'], ai_call_frequency: 'moderate', dnd_days: [] },
      ],
      rowCount: 2, command: '', oid: 0, fields: [],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 0, command: '', oid: 0, fields: [],
    });

    aiCoachCallReconcilerJob.start();
    await new Promise((r) => setTimeout(r, 200));

    expect(mockScheduleCall).toHaveBeenCalledTimes(3);
    expect(mockScheduleCall).toHaveBeenCalledWith('user-a', '09:00', 'UTC', '2026-05-13');
    expect(mockScheduleCall).toHaveBeenCalledWith('user-a', '18:00', 'UTC', '2026-05-13');
    expect(mockScheduleCall).toHaveBeenCalledWith('user-b', '12:00', 'UTC', '2026-05-13');

    aiCoachCallReconcilerJob.stop();
  });

  it('skips scheduling when queue is not available', async () => {
    mockIsAvailable.mockReturnValue(false);

    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 0, command: '', oid: 0, fields: [],
    });

    aiCoachCallReconcilerJob.start();
    await new Promise((r) => setTimeout(r, 200));

    expect(mockScheduleCall).not.toHaveBeenCalled();

    aiCoachCallReconcilerJob.stop();
  });

  it('handles per-user errors without stopping the batch', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 0, command: '', oid: 0, fields: [],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        { user_id: 'user-bad', timezone: 'UTC', preferred_call_times: ['09:00'], ai_call_frequency: 'moderate', dnd_days: [] },
        { user_id: 'user-good', timezone: 'UTC', preferred_call_times: ['10:00'], ai_call_frequency: 'moderate', dnd_days: [] },
      ],
      rowCount: 2, command: '', oid: 0, fields: [],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [], rowCount: 0, command: '', oid: 0, fields: [],
    });

    mockScheduleCall
      .mockRejectedValueOnce(new Error('Redis down'))
      .mockResolvedValueOnce(undefined);

    aiCoachCallReconcilerJob.start();
    await new Promise((r) => setTimeout(r, 200));

    expect(mockScheduleCall).toHaveBeenCalledTimes(2);
    expect(mockScheduleCall).toHaveBeenCalledWith('user-good', '10:00', 'UTC', '2026-05-13');

    aiCoachCallReconcilerJob.stop();
  });
});
