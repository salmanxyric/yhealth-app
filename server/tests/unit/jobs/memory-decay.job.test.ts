/**
 * @file Memory Decay Job Tests
 * Tests for daily memory confidence decay, archival, and expiry processing.
 * Verifies per-user decay application, error resilience, concurrency guard, and lifecycle.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
const mockLogger = setupLoggerMock();

const mockMemoryEngineService = {
  applyDecay: jest.fn<any>().mockResolvedValue({ decayed: 0, archived: 0 }),
};
jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: mockMemoryEngineService,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { memoryDecayJob } = await import('../../../src/jobs/memory-decay.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockMemoryEngineService.applyDecay.mockResolvedValue({ decayed: 0, archived: 0 });
});

describe('MemoryDecayJob', () => {
  describe('processNow', () => {
    it('should call applyDecay for every user with active memories', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }]),
      );
      mockMemoryEngineService.applyDecay
        .mockResolvedValueOnce({ decayed: 1, archived: 0 })
        .mockResolvedValueOnce({ decayed: 0, archived: 1 })
        .mockResolvedValueOnce({ decayed: 2, archived: 1 });

      await memoryDecayJob.processNow();

      expect(mockMemoryEngineService.applyDecay).toHaveBeenCalledTimes(3);
      expect(mockMemoryEngineService.applyDecay).toHaveBeenCalledWith('u1');
      expect(mockMemoryEngineService.applyDecay).toHaveBeenCalledWith('u2');
      expect(mockMemoryEngineService.applyDecay).toHaveBeenCalledWith('u3');
    });

    it('should sum decayed and archived counts across all users', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{ user_id: 'u1' }, { user_id: 'u2' }]),
      );
      mockMemoryEngineService.applyDecay
        .mockResolvedValueOnce({ decayed: 3, archived: 1 })
        .mockResolvedValueOnce({ decayed: 2, archived: 4 });

      await memoryDecayJob.processNow();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryDecay] Completed',
        expect.objectContaining({
          usersProcessed: 2,
          totalDecayed: 5,
          totalArchived: 5,
        }),
      );
    });

    it('should handle zero users gracefully', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await memoryDecayJob.processNow();

      expect(mockMemoryEngineService.applyDecay).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryDecay] Completed',
        expect.objectContaining({
          usersProcessed: 0,
          totalDecayed: 0,
          totalArchived: 0,
        }),
      );
    });

    it('should handle a single user with multiple memories decayed', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockMemoryEngineService.applyDecay.mockResolvedValueOnce({ decayed: 12, archived: 3 });

      await memoryDecayJob.processNow();

      expect(mockMemoryEngineService.applyDecay).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryDecay] Completed',
        expect.objectContaining({
          usersProcessed: 1,
          totalDecayed: 12,
          totalArchived: 3,
        }),
      );
    });

    it('should continue processing other users when applyDecay fails for one', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }]),
      );
      mockMemoryEngineService.applyDecay
        .mockResolvedValueOnce({ decayed: 1, archived: 0 })
        .mockRejectedValueOnce(new Error('Decay engine crash'))
        .mockResolvedValueOnce({ decayed: 2, archived: 1 });

      await memoryDecayJob.processNow();

      expect(mockMemoryEngineService.applyDecay).toHaveBeenCalledTimes(3);
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[MemoryDecay] Failed for user',
        expect.objectContaining({ userId: 'u2', error: 'Decay engine crash' }),
      );
      // Totals should only include successful users
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryDecay] Completed',
        expect.objectContaining({
          usersProcessed: 3,
          totalDecayed: 3,
          totalArchived: 1,
        }),
      );
    });

    it('should prevent concurrent execution via isRunning guard', async () => {
      // Create a long-running applyDecay that we can control
      let resolveDecay!: (val: { decayed: number; archived: number }) => void;
      const decayPromise = new Promise<{ decayed: number; archived: number }>((resolve) => {
        resolveDecay = resolve;
      });

      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockMemoryEngineService.applyDecay.mockReturnValueOnce(decayPromise);

      // Start first run (will block on applyDecay)
      const firstRun = memoryDecayJob.processNow();

      // Attempt second run while first is in progress
      const secondRun = memoryDecayJob.processNow();

      // Resolve the first run
      resolveDecay({ decayed: 1, archived: 0 });
      await firstRun;
      await secondRun;

      // applyDecay should only have been called once (second run was rejected by guard)
      expect(mockMemoryEngineService.applyDecay).toHaveBeenCalledTimes(1);
    });

    it('should reset isRunning after DB query failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      await memoryDecayJob.processNow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[MemoryDecay] Job failed',
        expect.objectContaining({ error: 'Connection refused' }),
      );
      expect(memoryDecayJob.isRunning()).toBe(false);
    });

    it('should reset isRunning after successful completion', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockMemoryEngineService.applyDecay.mockResolvedValueOnce({ decayed: 0, archived: 0 });

      await memoryDecayJob.processNow();

      expect(memoryDecayJob.isRunning()).toBe(false);
    });

    it('should reset isRunning even when all users fail', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{ user_id: 'u1' }, { user_id: 'u2' }]),
      );
      mockMemoryEngineService.applyDecay
        .mockRejectedValueOnce(new Error('fail-1'))
        .mockRejectedValueOnce(new Error('fail-2'));

      await memoryDecayJob.processNow();

      expect(memoryDecayJob.isRunning()).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryDecay] Completed',
        expect.objectContaining({ totalDecayed: 0, totalArchived: 0 }),
      );
    });
  });

  describe('lifecycle', () => {
    afterEach(() => memoryDecayJob.stop());

    it('should register interval on start()', () => {
      expect(() => memoryDecayJob.start()).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryDecay] Starting memory decay job (daily)',
      );
    });

    it('should warn and not double-register when start() called twice', () => {
      memoryDecayJob.start();
      mockLogger.info.mockClear();
      mockLogger.warn.mockClear();

      memoryDecayJob.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('[MemoryDecay] Already running');
      // Should NOT have logged the starting message again
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        '[MemoryDecay] Starting memory decay job (daily)',
      );
    });

    it('should clear interval on stop()', () => {
      memoryDecayJob.start();
      memoryDecayJob.stop();

      expect(mockLogger.info).toHaveBeenCalledWith('[MemoryDecay] Stopped');
    });

    it('should handle stop() when not started (no-op)', () => {
      // Should not throw when stopping without having started
      expect(() => memoryDecayJob.stop()).not.toThrow();
    });
  });
});
