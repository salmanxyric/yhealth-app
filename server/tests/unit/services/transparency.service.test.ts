/**
 * Transparency Service Unit Tests
 *
 * Tests for prepareContext, recordUsage, getMessageTransparency,
 * getConversationTransparency, and submitHelpfulness.
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

const mockGetMemoriesForContext = jest.fn<any>();
const mockFormatMemoriesForPrompt = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: {
    getMemoriesForContext: mockGetMemoriesForContext,
    formatMemoriesForPrompt: mockFormatMemoriesForPrompt,
  },
}));

const mockGetProfileSummary = jest.fn<any>();
const mockGetProfile = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/core-profile-kernel.service.js', () => ({
  coreProfileKernelService: {
    getProfileSummary: mockGetProfileSummary,
    getProfile: mockGetProfile,
  },
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { transparencyService } = await import(
  '../../../src/services/transparency.service.js'
);

// ============================================
// HELPERS
// ============================================

const USER_ID = 'user-uuid-001';
const CONV_ID = 'conv-uuid-001';
const MSG_ID = 'msg-uuid-001';

function buildMemory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mem-1',
    title: 'Prefers morning workouts',
    memoryType: 'preference',
    confidence: 0.85,
    ...overrides,
  };
}

function buildProfileEntry(overrides: Record<string, unknown> = {}) {
  return {
    section: 'biometrics',
    key: 'weight_kg',
    value: 78,
    unit: 'kg',
    confidence: 0.9,
    ...overrides,
  };
}

function buildEmptyProfile() {
  return {
    biometrics: [],
    targets: [],
    constraints: [],
    preferences: [],
    medical: [],
    lifestyle: [],
    missingFields: [],
  };
}

function buildSessionContextRow(overrides: Record<string, unknown> = {}) {
  return {
    conversation_id: CONV_ID,
    message_id: MSG_ID,
    memories_used: [{ memoryId: 'mem-1', title: 'Test', memoryType: 'preference', confidence: 0.8, relevanceScore: 0.8 }],
    core_profile_used: [{ section: 'biometrics', key: 'weight_kg', value: 78, unit: 'kg' }],
    overall_confidence: 0.8,
    was_helpful: null,
    correction: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('transparencyService', () => {
  // ──────────────────────────────────────────
  // prepareContext
  // ──────────────────────────────────────────
  describe('prepareContext', () => {
    it('returns assembled context with memories and profile data', async () => {
      const memories = [buildMemory(), buildMemory({ id: 'mem-2', title: 'Sleeps 7h', confidence: 0.7 })];
      const profile = {
        ...buildEmptyProfile(),
        biometrics: [buildProfileEntry()],
        targets: [buildProfileEntry({ section: 'targets', key: 'daily_calories', value: 2200, unit: 'kcal', confidence: 0.6 })],
      };

      mockGetMemoriesForContext.mockResolvedValueOnce(memories);
      mockGetProfileSummary.mockResolvedValueOnce('Weight: 78kg, Calories: 2200kcal');
      mockGetProfile.mockResolvedValueOnce(profile);
      mockFormatMemoriesForPrompt.mockReturnValueOnce('[Memory: Prefers morning workouts] [Memory: Sleeps 7h]');

      const result = await transparencyService.prepareContext(USER_ID, 'How is my sleep?', CONV_ID);

      expect(result.memoriesForPrompt).toBe('[Memory: Prefers morning workouts] [Memory: Sleeps 7h]');
      expect(result.coreProfileForPrompt).toBe('Weight: 78kg, Calories: 2200kcal');
      expect(result.memoriesUsed).toHaveLength(2);
      expect(result.coreProfileUsed).toHaveLength(2);
      expect(result.overallConfidence).toBeGreaterThan(0);
    });

    it('returns empty memoriesForPrompt and overallConfidence 0 when no memories exist', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([]);
      mockGetProfileSummary.mockResolvedValueOnce('Weight: 78kg');
      mockGetProfile.mockResolvedValueOnce({
        ...buildEmptyProfile(),
        biometrics: [buildProfileEntry()],
      });
      mockFormatMemoriesForPrompt.mockReturnValueOnce('');

      const result = await transparencyService.prepareContext(USER_ID, 'Tell me about myself', CONV_ID);

      expect(result.memoriesUsed).toHaveLength(0);
      expect(result.overallConfidence).toBe(0);
      expect(result.memoriesForPrompt).toBe('');
    });

    it('returns profile data but no memories when only profile exists', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([]);
      mockGetProfileSummary.mockResolvedValueOnce('Weight: 78kg');
      mockGetProfile.mockResolvedValueOnce({
        ...buildEmptyProfile(),
        biometrics: [buildProfileEntry()],
      });
      mockFormatMemoriesForPrompt.mockReturnValueOnce('');

      const result = await transparencyService.prepareContext(USER_ID, 'What is my weight?', CONV_ID);

      expect(result.memoriesUsed).toHaveLength(0);
      expect(result.coreProfileUsed).toHaveLength(1);
      expect(result.coreProfileUsed[0].key).toBe('weight_kg');
      expect(result.overallConfidence).toBe(0);
    });

    it('maps memoriesUsed correctly with memoryId, title, type, confidence', async () => {
      const mem = buildMemory({ id: 'mem-42', title: 'Runs 5K daily', memoryType: 'pattern', confidence: 0.92 });
      mockGetMemoriesForContext.mockResolvedValueOnce([mem]);
      mockGetProfileSummary.mockResolvedValueOnce('');
      mockGetProfile.mockResolvedValueOnce(buildEmptyProfile());
      mockFormatMemoriesForPrompt.mockReturnValueOnce('formatted');

      const result = await transparencyService.prepareContext(USER_ID, 'test', CONV_ID);

      expect(result.memoriesUsed[0]).toEqual({
        memoryId: 'mem-42',
        title: 'Runs 5K daily',
        memoryType: 'pattern',
        confidence: 0.92,
        relevanceScore: 0.92,
      });
    });

    it('maps coreProfileUsed from profile sections, filtering by confidence >= 0.3', async () => {
      const profile = {
        ...buildEmptyProfile(),
        biometrics: [
          buildProfileEntry({ confidence: 0.9 }),
          buildProfileEntry({ key: 'height_cm', value: 180, unit: 'cm', confidence: 0.2 }),
        ],
        preferences: [
          buildProfileEntry({ section: 'preferences', key: 'coaching_style', value: 'motivational', unit: null, confidence: 0.5 }),
        ],
      };

      mockGetMemoriesForContext.mockResolvedValueOnce([]);
      mockGetProfileSummary.mockResolvedValueOnce('summary');
      mockGetProfile.mockResolvedValueOnce(profile);
      mockFormatMemoriesForPrompt.mockReturnValueOnce('');

      const result = await transparencyService.prepareContext(USER_ID, 'test', CONV_ID);

      // height_cm has confidence 0.2 -> should be filtered out
      expect(result.coreProfileUsed).toHaveLength(2);
      expect(result.coreProfileUsed.map((p: { key: string }) => p.key)).toContain('weight_kg');
      expect(result.coreProfileUsed.map((p: { key: string }) => p.key)).toContain('coaching_style');
      expect(result.coreProfileUsed.map((p: { key: string }) => p.key)).not.toContain('height_cm');
    });

    it('calculates overallConfidence as average of memory confidences', async () => {
      const memories = [
        buildMemory({ id: 'a', confidence: 0.8 }),
        buildMemory({ id: 'b', confidence: 0.6 }),
        buildMemory({ id: 'c', confidence: 1.0 }),
      ];
      mockGetMemoriesForContext.mockResolvedValueOnce(memories);
      mockGetProfileSummary.mockResolvedValueOnce('');
      mockGetProfile.mockResolvedValueOnce(buildEmptyProfile());
      mockFormatMemoriesForPrompt.mockReturnValueOnce('formatted');

      const result = await transparencyService.prepareContext(USER_ID, 'test', CONV_ID);

      // Average: (0.8 + 0.6 + 1.0) / 3 = 0.8, rounded
      expect(result.overallConfidence).toBe(0.8);
    });

    it('handles service failure gracefully by propagating the error', async () => {
      mockGetMemoriesForContext.mockRejectedValueOnce(new Error('Memory engine down'));
      mockGetProfileSummary.mockResolvedValueOnce('');
      mockGetProfile.mockResolvedValueOnce(buildEmptyProfile());

      await expect(
        transparencyService.prepareContext(USER_ID, 'test', CONV_ID)
      ).rejects.toThrow('Memory engine down');
    });

    it('omits unit from coreProfileUsed when entry has no unit', async () => {
      const profile = {
        ...buildEmptyProfile(),
        preferences: [
          buildProfileEntry({ section: 'preferences', key: 'coaching_style', value: 'tough', unit: null, confidence: 0.8 }),
        ],
      };

      mockGetMemoriesForContext.mockResolvedValueOnce([]);
      mockGetProfileSummary.mockResolvedValueOnce('');
      mockGetProfile.mockResolvedValueOnce(profile);
      mockFormatMemoriesForPrompt.mockReturnValueOnce('');

      const result = await transparencyService.prepareContext(USER_ID, 'test', CONV_ID);

      expect(result.coreProfileUsed[0].unit).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────
  // recordUsage
  // ──────────────────────────────────────────
  describe('recordUsage', () => {
    it('inserts a new session context record', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await transparencyService.recordUsage(USER_ID, CONV_ID, MSG_ID, {
        memoriesUsed: [{ memoryId: 'mem-1', title: 'Test', memoryType: 'preference' as const, confidence: 0.8, relevanceScore: 0.8 }],
        coreProfileUsed: [],
        overallConfidence: 0.8,
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO intelligence_session_context');
      expect(params[0]).toBe(USER_ID);
      expect(params[1]).toBe(CONV_ID);
      expect(params[2]).toBe(MSG_ID);
      expect(params[5]).toBe(0.8);
    });

    it('upserts existing record on conflict', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await transparencyService.recordUsage(USER_ID, CONV_ID, MSG_ID, {
        memoriesUsed: [],
        coreProfileUsed: [],
        overallConfidence: 0.5,
      });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('ON CONFLICT');
      expect(sql).toContain('DO UPDATE SET');
    });

    it('propagates DB failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        transparencyService.recordUsage(USER_ID, CONV_ID, MSG_ID, {
          memoriesUsed: [],
          coreProfileUsed: [],
          overallConfidence: 0,
        })
      ).rejects.toThrow('Connection refused');
    });
  });

  // ──────────────────────────────────────────
  // getMessageTransparency
  // ──────────────────────────────────────────
  describe('getMessageTransparency', () => {
    it('returns TransparencyData when record exists', async () => {
      const row = buildSessionContextRow();
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const result = await transparencyService.getMessageTransparency(USER_ID, MSG_ID);

      expect(result).not.toBeNull();
      expect(result!.conversationId).toBe(CONV_ID);
      expect(result!.messageId).toBe(MSG_ID);
      expect(result!.memoriesUsed).toHaveLength(1);
      expect(result!.overallConfidence).toBe(0.8);
    });

    it('returns null when no record exists', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const result = await transparencyService.getMessageTransparency(USER_ID, 'msg-nonexistent');

      expect(result).toBeNull();
    });

    it('queries with correct user_id and message_id', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await transparencyService.getMessageTransparency('uid-99', 'mid-77');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND message_id = $2'),
        ['uid-99', 'mid-77']
      );
    });
  });

  // ──────────────────────────────────────────
  // getConversationTransparency
  // ──────────────────────────────────────────
  describe('getConversationTransparency', () => {
    it('returns array of TransparencyData entries for the conversation', async () => {
      const rows = [
        buildSessionContextRow({ message_id: 'msg-1' }),
        buildSessionContextRow({ message_id: 'msg-2', overall_confidence: 0.6 }),
        buildSessionContextRow({ message_id: 'msg-3', overall_confidence: 0.9 }),
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const result = await transparencyService.getConversationTransparency(USER_ID, CONV_ID);

      expect(result).toHaveLength(3);
      expect(result[0].messageId).toBe('msg-1');
      expect(result[1].messageId).toBe('msg-2');
    });

    it('returns empty array for conversation with no intelligence context', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const result = await transparencyService.getConversationTransparency(USER_ID, 'conv-empty');

      expect(result).toEqual([]);
    });

    it('queries with ORDER BY created_at ASC', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await transparencyService.getConversationTransparency(USER_ID, CONV_ID);

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('ORDER BY created_at ASC');
    });
  });

  // ──────────────────────────────────────────
  // submitHelpfulness
  // ──────────────────────────────────────────
  describe('submitHelpfulness', () => {
    it('updates was_helpful flag on the session context', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await transparencyService.submitHelpfulness(USER_ID, MSG_ID, true);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('UPDATE intelligence_session_context');
      expect(sql).toContain('SET was_helpful = $3');
      expect(params[2]).toBe(true);
    });

    it('updates with correction text when provided', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await transparencyService.submitHelpfulness(USER_ID, MSG_ID, false, 'That advice was wrong about my diet');

      const [, params] = mockQuery.mock.calls[0];
      expect(params[2]).toBe(false);
      expect(params[3]).toBe('That advice was wrong about my diet');
    });

    it('stores null correction when none provided', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await transparencyService.submitHelpfulness(USER_ID, MSG_ID, true);

      const [, params] = mockQuery.mock.calls[0];
      expect(params[3]).toBeNull();
    });

    it('does not throw when message does not exist (UPDATE affects 0 rows)', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        transparencyService.submitHelpfulness(USER_ID, 'msg-nonexistent', false)
      ).resolves.toBeUndefined();
    });
  });
});
