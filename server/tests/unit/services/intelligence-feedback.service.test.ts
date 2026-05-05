/**
 * Intelligence Feedback Service Unit Tests
 *
 * Tests for submitFeedback and getUserFeedbackHistory.
 * Covers all feedback actions: verify, reject, correct, dismiss, pin, expand.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';
import { pgResult, pgEmpty } from '../../helpers/factories.js';

// ============================================
// MOCKS (must precede dynamic imports)
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();

const mockProcessUserFeedback = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: {
    processUserFeedback: mockProcessUserFeedback,
  },
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { intelligenceFeedbackService } = await import(
  '../../../src/services/intelligence-feedback.service.js'
);

// ============================================
// HELPERS
// ============================================

const USER_ID = 'user-uuid-001';
const MEMORY_ID = 'mem-uuid-001';

function buildFeedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fb-001',
    user_id: USER_ID,
    target_type: 'memory',
    target_id: MEMORY_ID,
    action: 'verify',
    correction_data: null,
    comment: null,
    confidence_delta: 0.15,
    memories_affected: [MEMORY_ID],
    created_at: new Date('2026-04-30T10:00:00Z'),
    ...overrides,
  };
}

function buildMemoryResult(overrides: Record<string, unknown> = {}) {
  return {
    memory: {
      id: MEMORY_ID,
      title: 'Prefers morning workouts',
      memoryType: 'preference',
      confidence: 0.9,
      ...overrides,
    },
    counterMemoryId: undefined,
  };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('intelligenceFeedbackService', () => {
  // ──────────────────────────────────────────
  // submitFeedback
  // ──────────────────────────────────────────
  describe('submitFeedback', () => {
    it('verify action delegates to memoryEngine and records positive confidenceDelta', async () => {
      mockProcessUserFeedback.mockResolvedValueOnce(buildMemoryResult());
      mockQuery.mockResolvedValueOnce(pgResult([buildFeedbackRow()]));

      const result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'memory',
        targetId: MEMORY_ID,
        action: 'verify',
      });

      expect(mockProcessUserFeedback).toHaveBeenCalledWith(MEMORY_ID, USER_ID, 'verify');
      expect(result.action).toBe('verify');
      // The DB INSERT should contain confidenceDelta of 0.15
      const [, params] = mockQuery.mock.calls[0];
      expect(params[6]).toBe(0.15); // confidence_delta
    });

    it('reject action with comment delegates to memoryEngine with rejection data', async () => {
      mockProcessUserFeedback.mockResolvedValueOnce(buildMemoryResult());
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({ action: 'reject', comment: 'Incorrect', confidence_delta: null }),
      ]));

      const result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'memory',
        targetId: MEMORY_ID,
        action: 'reject',
        comment: 'Incorrect',
      });

      expect(mockProcessUserFeedback).toHaveBeenCalledWith(
        MEMORY_ID, USER_ID, 'reject', undefined, 'Incorrect'
      );
      expect(result.action).toBe('reject');
    });

    it('correct action with correctionData creates counter-memory path', async () => {
      const memResult = { ...buildMemoryResult(), counterMemoryId: 'counter-mem-001' };
      mockProcessUserFeedback.mockResolvedValueOnce(memResult);
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({
          action: 'correct',
          correction_data: { title: 'Corrected title' },
          memories_affected: [MEMORY_ID, 'counter-mem-001'],
        }),
      ]));

      const result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'memory',
        targetId: MEMORY_ID,
        action: 'correct',
        correctionData: { title: 'Corrected title' },
      });

      expect(mockProcessUserFeedback).toHaveBeenCalledWith(
        MEMORY_ID, USER_ID, 'correct',
        { title: 'Corrected title' },
        undefined
      );
      expect(result.memoriesAffected).toContain('counter-mem-001');
    });

    it('dismiss action delegates to memoryEngine with negative confidenceDelta', async () => {
      mockProcessUserFeedback.mockResolvedValueOnce(buildMemoryResult());
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({ action: 'dismiss', confidence_delta: -0.1 }),
      ]));

      const _result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'memory',
        targetId: MEMORY_ID,
        action: 'dismiss',
      });

      expect(mockProcessUserFeedback).toHaveBeenCalledWith(MEMORY_ID, USER_ID, 'dismiss');
      // DB should receive -0.1 confidenceDelta
      const [, params] = mockQuery.mock.calls[0];
      expect(params[6]).toBe(-0.1);
    });

    it('pin action on artifact persists feedback without calling memoryEngine', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({
          target_type: 'artifact',
          target_id: 'art-001',
          action: 'pin',
          confidence_delta: null,
          memories_affected: [],
        }),
      ]));

      const result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'artifact',
        targetId: 'art-001',
        action: 'pin',
      });

      expect(mockProcessUserFeedback).not.toHaveBeenCalled();
      expect(result.action).toBe('pin');
    });

    it('expand action on artifact persists feedback without calling memoryEngine', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({
          target_type: 'artifact',
          target_id: 'art-002',
          action: 'expand',
          confidence_delta: null,
          memories_affected: [],
        }),
      ]));

      const result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'artifact',
        targetId: 'art-002',
        action: 'expand',
      });

      expect(mockProcessUserFeedback).not.toHaveBeenCalled();
      expect(result.action).toBe('expand');
    });

    it('stores comment in feedback record', async () => {
      mockProcessUserFeedback.mockResolvedValueOnce(buildMemoryResult());
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({ comment: 'This is very accurate' }),
      ]));

      await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'memory',
        targetId: MEMORY_ID,
        action: 'verify',
        comment: 'This is very accurate',
      });

      const [, params] = mockQuery.mock.calls[0];
      expect(params[5]).toBe('This is very accurate'); // comment param
    });

    it('propagates memoryEngine failure', async () => {
      mockProcessUserFeedback.mockRejectedValueOnce(new Error('Memory engine crashed'));

      await expect(
        intelligenceFeedbackService.submitFeedback(USER_ID, {
          targetType: 'memory',
          targetId: MEMORY_ID,
          action: 'verify',
        })
      ).rejects.toThrow('Memory engine crashed');
    });

    it('propagates DB insert failure', async () => {
      mockProcessUserFeedback.mockResolvedValueOnce(buildMemoryResult());
      mockQuery.mockRejectedValueOnce(new Error('DB write failed'));

      await expect(
        intelligenceFeedbackService.submitFeedback(USER_ID, {
          targetType: 'memory',
          targetId: MEMORY_ID,
          action: 'verify',
        })
      ).rejects.toThrow('DB write failed');
    });

    it('returns correct feedback record with all fields populated', async () => {
      mockProcessUserFeedback.mockResolvedValueOnce(buildMemoryResult());
      const row = buildFeedbackRow({
        id: 'fb-777',
        action: 'verify',
        comment: 'Great insight',
        confidence_delta: 0.15,
        memories_affected: [MEMORY_ID],
      });
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'memory',
        targetId: MEMORY_ID,
        action: 'verify',
        comment: 'Great insight',
      });

      expect(result.id).toBe('fb-777');
      expect(result.userId).toBe(USER_ID);
      expect(result.targetType).toBe('memory');
      expect(result.targetId).toBe(MEMORY_ID);
      expect(result.action).toBe('verify');
      expect(result.comment).toBe('Great insight');
      expect(result.confidenceDelta).toBe(0.15);
      expect(result.memoriesAffected).toEqual([MEMORY_ID]);
      expect(result.createdAt).toBeDefined();
    });

    it('handles non-memory targetType by skipping memoryEngine call', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({
          target_type: 'plan',
          target_id: 'plan-001',
          action: 'verify',
          confidence_delta: null,
          memories_affected: [],
        }),
      ]));

      const result = await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'plan',
        targetId: 'plan-001',
        action: 'verify',
      });

      expect(mockProcessUserFeedback).not.toHaveBeenCalled();
      expect(result.targetType).toBe('plan');
    });

    it('tracks memoriesAffected array including counterMemoryId', async () => {
      const memResult = { ...buildMemoryResult(), counterMemoryId: 'counter-42' };
      mockProcessUserFeedback.mockResolvedValueOnce(memResult);
      mockQuery.mockResolvedValueOnce(pgResult([
        buildFeedbackRow({
          action: 'correct',
          memories_affected: [MEMORY_ID, 'counter-42'],
        }),
      ]));

      await intelligenceFeedbackService.submitFeedback(USER_ID, {
        targetType: 'memory',
        targetId: MEMORY_ID,
        action: 'correct',
        correctionData: { title: 'Fixed' },
      });

      // Verify the memoriesAffected array was sent to DB
      const [, params] = mockQuery.mock.calls[0];
      expect(params[7]).toEqual([MEMORY_ID, 'counter-42']); // memories_affected param
    });
  });

  // ──────────────────────────────────────────
  // getUserFeedbackHistory
  // ──────────────────────────────────────────
  describe('getUserFeedbackHistory', () => {
    it('returns ordered list of feedback entries', async () => {
      const rows = [
        buildFeedbackRow({ id: 'fb-3', created_at: new Date('2026-04-30T12:00:00Z') }),
        buildFeedbackRow({ id: 'fb-2', created_at: new Date('2026-04-30T11:00:00Z') }),
        buildFeedbackRow({ id: 'fb-1', created_at: new Date('2026-04-30T10:00:00Z') }),
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const result = await intelligenceFeedbackService.getUserFeedbackHistory(USER_ID);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('fb-3');
      expect(result[2].id).toBe('fb-1');
    });

    it('respects limit parameter', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([buildFeedbackRow()]));

      await intelligenceFeedbackService.getUserFeedbackHistory(USER_ID, 10);

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('LIMIT $2');
      expect(params[1]).toBe(10);
    });

    it('defaults to limit of 50 when not specified', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await intelligenceFeedbackService.getUserFeedbackHistory(USER_ID);

      const [, params] = mockQuery.mock.calls[0];
      expect(params[1]).toBe(50);
    });

    it('returns empty array when user has no feedback history', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const result = await intelligenceFeedbackService.getUserFeedbackHistory(USER_ID);

      expect(result).toEqual([]);
    });
  });
});
