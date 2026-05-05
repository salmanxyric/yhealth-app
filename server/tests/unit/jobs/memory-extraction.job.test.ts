/**
 * @file Memory Extraction Job Tests
 * Tests for pattern extraction from daily analysis reports, grouping by claim,
 * threshold filtering, evidence limiting, and memory creation/reinforcement.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
const mockLogger = setupLoggerMock();

const mockMemoryEngineService = {
  findOrCreatePattern: jest.fn<any>().mockResolvedValue({ wasReinforced: false }),
};
jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: mockMemoryEngineService,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { memoryExtractionJob } = await import('../../../src/jobs/memory-extraction.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Helpers ─────────────────────────────────────────────────

function buildInsightRow(
  id: string,
  category: string,
  insights: Array<{ claim?: string; category?: string; evidence?: string }>,
  date: string,
) {
  return { id, category, insights, date };
}

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockMemoryEngineService.findOrCreatePattern.mockResolvedValue({ wasReinforced: false });
});

describe('MemoryExtractionJob', () => {
  describe('processNow', () => {
    it('should extract patterns from a user with 3+ matching claims', async () => {
      // Query 1: users with recent reports
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      // Query 2: insights for u1 — 3 rows with same claim
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'fitness', [{ claim: 'Morning workout is effective', category: 'fitness', evidence: 'HR data shows peak' }], '2026-04-28'),
          buildInsightRow('r2', 'fitness', [{ claim: 'Morning workout is effective', category: 'fitness', evidence: 'Recovery improved' }], '2026-04-27'),
          buildInsightRow('r3', 'fitness', [{ claim: 'Morning workout is effective', category: 'fitness', evidence: 'Sleep quality up' }], '2026-04-26'),
        ]),
      );

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledTimes(1);
      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledWith(
        'u1',
        'fitness',
        expect.stringContaining('Morning workout is effective'),
        'Morning workout is effective',
        expect.arrayContaining([
          expect.objectContaining({ source_table: 'daily_analysis_reports', source_id: 'r1' }),
        ]),
        'ai',
      );
    });

    it('should skip patterns with fewer than 3 occurrences', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      // Only 2 rows with same claim
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'nutrition', [{ claim: 'Low carb works' }], '2026-04-28'),
          buildInsightRow('r2', 'nutrition', [{ claim: 'Low carb works' }], '2026-04-27'),
        ]),
      );

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).not.toHaveBeenCalled();
    });

    it('should group claims case-insensitively', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'sleep', [{ claim: 'Morning workout', evidence: 'e1' }], '2026-04-28'),
          buildInsightRow('r2', 'sleep', [{ claim: 'morning workout', evidence: 'e2' }], '2026-04-27'),
          buildInsightRow('r3', 'sleep', [{ claim: 'MORNING WORKOUT', evidence: 'e3' }], '2026-04-26'),
        ]),
      );

      await memoryExtractionJob.processNow();

      // All three should be grouped as the same pattern
      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledTimes(1);
    });

    it('should limit evidence to 10 items per pattern', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      // 15 rows with the same claim — evidence should be capped at 10
      const rows = Array.from({ length: 15 }, (_, i) =>
        buildInsightRow(`r${i}`, 'fitness', [{ claim: 'Consistent pattern', evidence: `ev-${i}` }], `2026-04-${String(15 + i).padStart(2, '0')}`),
      );
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledTimes(1);
      const evidenceArg = mockMemoryEngineService.findOrCreatePattern.mock.calls[0][4];
      expect(evidenceArg).toHaveLength(10);
    });

    it('should count memoriesCreated and memoriesReinforced correctly', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      // Two distinct patterns, each with 3+ occurrences
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'fitness', [{ claim: 'Pattern A' }], '2026-04-28'),
          buildInsightRow('r2', 'fitness', [{ claim: 'Pattern A' }], '2026-04-27'),
          buildInsightRow('r3', 'fitness', [{ claim: 'Pattern A' }], '2026-04-26'),
          buildInsightRow('r4', 'nutrition', [{ claim: 'Pattern B' }], '2026-04-28'),
          buildInsightRow('r5', 'nutrition', [{ claim: 'Pattern B' }], '2026-04-27'),
          buildInsightRow('r6', 'nutrition', [{ claim: 'Pattern B' }], '2026-04-26'),
        ]),
      );
      // First pattern is new, second is reinforced
      mockMemoryEngineService.findOrCreatePattern
        .mockResolvedValueOnce({ wasReinforced: false })
        .mockResolvedValueOnce({ wasReinforced: true });

      await memoryExtractionJob.processNow();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryExtraction] Completed',
        expect.objectContaining({
          usersProcessed: 1,
          memoriesCreated: 1,
          memoriesReinforced: 1,
        }),
      );
    });

    it('should handle a user with no insights', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryExtraction] Completed',
        expect.objectContaining({
          usersProcessed: 1,
          memoriesCreated: 0,
          memoriesReinforced: 0,
        }),
      );
    });

    it('should handle zero users', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryExtraction] Completed',
        expect.objectContaining({
          usersProcessed: 0,
          memoriesCreated: 0,
          memoriesReinforced: 0,
        }),
      );
    });

    it('should log debug and continue when findOrCreatePattern fails', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'fitness', [{ claim: 'Failing pattern' }], '2026-04-28'),
          buildInsightRow('r2', 'fitness', [{ claim: 'Failing pattern' }], '2026-04-27'),
          buildInsightRow('r3', 'fitness', [{ claim: 'Failing pattern' }], '2026-04-26'),
        ]),
      );
      mockMemoryEngineService.findOrCreatePattern.mockRejectedValueOnce(
        new Error('Vector store unavailable'),
      );

      await memoryExtractionJob.processNow();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[MemoryExtraction] Pattern processing failed',
        expect.objectContaining({ userId: 'u1', error: 'Vector store unavailable' }),
      );
      // Job should still complete
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryExtraction] Completed',
        expect.objectContaining({ usersProcessed: 1 }),
      );
    });

    it('should continue with next user when insights query fails for one', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{ user_id: 'u1' }, { user_id: 'u2' }]),
      );
      // u1 insights query fails
      mockQuery.mockRejectedValueOnce(new Error('Timeout on u1'));
      // u2 insights query succeeds with a valid pattern
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'sleep', [{ claim: 'Recoverable' }], '2026-04-28'),
          buildInsightRow('r2', 'sleep', [{ claim: 'Recoverable' }], '2026-04-27'),
          buildInsightRow('r3', 'sleep', [{ claim: 'Recoverable' }], '2026-04-26'),
        ]),
      );

      await memoryExtractionJob.processNow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[MemoryExtraction] Failed for user',
        expect.objectContaining({ userId: 'u1', error: 'Timeout on u1' }),
      );
      // u2 should still be processed
      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledTimes(1);
      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledWith(
        'u2',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Array),
        'ai',
      );
    });

    it('should log error and reset isRunning when user list query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection pool exhausted'));

      await memoryExtractionJob.processNow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[MemoryExtraction] Job failed',
        expect.objectContaining({ error: 'Connection pool exhausted' }),
      );
      expect(memoryExtractionJob.isRunning()).toBe(false);
    });

    it('should prevent concurrent execution via isRunning guard', async () => {
      let resolveInsights!: (val: any) => void;
      const insightsPromise = new Promise((resolve) => {
        resolveInsights = resolve;
      });

      mockQuery
        .mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]))
        .mockReturnValueOnce(insightsPromise as any);

      // Start first run (will block on insights query)
      const firstRun = memoryExtractionJob.processNow();
      // Attempt second run while first is still in progress
      const secondRun = memoryExtractionJob.processNow();

      // Resolve the blocked query
      resolveInsights(pgEmpty());
      await firstRun;
      await secondRun;

      // User list query should only have been called once
      expect(mockQuery).toHaveBeenCalledTimes(2); // user list + insights for u1
    });

    it('should correctly map insight fields to pattern evidence', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('rpt-100', 'recovery', [{ claim: 'Cold showers help', category: 'recovery', evidence: 'HRV improved by 10%' }], '2026-04-28'),
          buildInsightRow('rpt-101', 'recovery', [{ claim: 'Cold showers help', category: 'recovery', evidence: 'Inflammation markers down' }], '2026-04-27'),
          buildInsightRow('rpt-102', 'recovery', [{ claim: 'Cold showers help', category: 'recovery', evidence: 'Subjective energy up' }], '2026-04-26'),
        ]),
      );

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledWith(
        'u1',
        'recovery',
        expect.any(String),
        'Cold showers help',
        expect.arrayContaining([
          { source_table: 'daily_analysis_reports', source_id: 'rpt-100', date: '2026-04-28', summary: 'HRV improved by 10%' },
          { source_table: 'daily_analysis_reports', source_id: 'rpt-101', date: '2026-04-27', summary: 'Inflammation markers down' },
          { source_table: 'daily_analysis_reports', source_id: 'rpt-102', date: '2026-04-26', summary: 'Subjective energy up' },
        ]),
        'ai',
      );
    });

    it('should use claim as summary when evidence is missing', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'fitness', [{ claim: 'No evidence claim' }], '2026-04-28'),
          buildInsightRow('r2', 'fitness', [{ claim: 'No evidence claim' }], '2026-04-27'),
          buildInsightRow('r3', 'fitness', [{ claim: 'No evidence claim' }], '2026-04-26'),
        ]),
      );

      await memoryExtractionJob.processNow();

      const evidenceArg = mockMemoryEngineService.findOrCreatePattern.mock.calls[0][4];
      for (const ev of evidenceArg) {
        expect(ev.summary).toBe('No evidence claim');
      }
    });

    it('should skip insights with no claim', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      // 3 rows but the insights have no claim field — should not create a pattern
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'fitness', [{ evidence: 'orphan evidence' }], '2026-04-28'),
          buildInsightRow('r2', 'fitness', [{ evidence: 'orphan evidence' }], '2026-04-27'),
          buildInsightRow('r3', 'fitness', [{ evidence: 'orphan evidence' }], '2026-04-26'),
        ]),
      );

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).not.toHaveBeenCalled();
    });

    it('should default category to cross_domain when insight has no category', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
      mockQuery.mockResolvedValueOnce(
        pgResult([
          buildInsightRow('r1', 'general', [{ claim: 'Uncategorized pattern' }], '2026-04-28'),
          buildInsightRow('r2', 'general', [{ claim: 'Uncategorized pattern' }], '2026-04-27'),
          buildInsightRow('r3', 'general', [{ claim: 'Uncategorized pattern' }], '2026-04-26'),
        ]),
      );

      await memoryExtractionJob.processNow();

      expect(mockMemoryEngineService.findOrCreatePattern).toHaveBeenCalledWith(
        'u1',
        'cross_domain',
        expect.any(String),
        expect.any(String),
        expect.any(Array),
        'ai',
      );
    });
  });

  describe('lifecycle', () => {
    afterEach(() => memoryExtractionJob.stop());

    it('should register interval on start()', () => {
      expect(() => memoryExtractionJob.start()).not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[MemoryExtraction] Starting memory extraction job (daily)',
      );
    });

    it('should warn and not double-register when start() called twice', () => {
      memoryExtractionJob.start();
      mockLogger.warn.mockClear();

      memoryExtractionJob.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('[MemoryExtraction] Already running');
    });

    it('should clear interval on stop()', () => {
      memoryExtractionJob.start();
      memoryExtractionJob.stop();

      expect(mockLogger.info).toHaveBeenCalledWith('[MemoryExtraction] Stopped');
    });

    it('should handle stop() when not started (no-op)', () => {
      expect(() => memoryExtractionJob.stop()).not.toThrow();
    });
  });
});
