/**
 * Embedding Worker — Unit Tests
 *
 * Tests the processEmbeddingJob processor that handles wellbeing delegation,
 * delete operations, rag_message backfill, content-hash dedup, and general
 * embedding creation across all source types.
 *
 * Uses the top-level unstable_mockModule + await import pattern.
 * The Worker constructor is mocked to capture the processor callback.
 */

import { jest } from '@jest/globals';

// ============================================================================
// MOCKS
// ============================================================================

let capturedProcessor: any;
let capturedWorkerInstance: any;
const capturedOnCalls: Array<[string, any]> = [];

const MockWorker = jest.fn<any>().mockImplementation((_name: string, processor: any) => {
  capturedProcessor = processor;
  const instance = {
    on: jest.fn<any>().mockImplementation((event: string, handler: any) => {
      capturedOnCalls.push([event, handler]);
      return instance;
    }),
    close: jest.fn(),
  };
  capturedWorkerInstance = instance;
  return instance;
});

jest.unstable_mockModule('bullmq', () => ({
  Worker: MockWorker,
  UnrecoverableError: class UnrecoverableError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UnrecoverableError';
    }
  },
}));

const mockQuery = jest.fn<any>();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

const mockStoreEmbedding = jest.fn<any>().mockResolvedValue('emb-id-1');
const mockStoreUserHealthProfile = jest.fn<any>().mockResolvedValue('profile-id-1');
const mockUpdateMessageEmbedding = jest.fn<any>().mockResolvedValue(undefined);
const mockEmbedText = jest.fn<any>().mockResolvedValue([0.1, 0.2, 0.3]);

let EmbeddingAuthErrorClass: any;

jest.unstable_mockModule('../../../src/services/vector-embedding.service.js', () => {
  class EmbeddingAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'EmbeddingAuthError';
    }
  }
  EmbeddingAuthErrorClass = EmbeddingAuthError;
  return {
    vectorEmbeddingService: {
      storeEmbedding: mockStoreEmbedding,
      storeUserHealthProfile: mockStoreUserHealthProfile,
      updateMessageEmbedding: mockUpdateMessageEmbedding,
      embedText: mockEmbedText,
    },
    EmbeddingAuthError,
  };
});

const mockProcessEmbedding = jest.fn<any>().mockResolvedValue(undefined);
jest.unstable_mockModule('../../../src/services/wellbeing-embedding.service.js', () => ({
  wellbeingEmbeddingService: {
    processEmbedding: mockProcessEmbedding,
  },
}));

jest.unstable_mockModule('../../../src/config/queue.config.js', () => ({
  redisConnection: { host: 'localhost', port: 6379 },
  QueueNames: { EMBEDDING_SYNC: 'embedding-sync' },
}));

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// ============================================================================
// MODULE IMPORT (triggers Worker constructor, captures processor)
// ============================================================================

await import('../../../src/workers/embedding-worker.js');

// ============================================================================
// HELPERS
// ============================================================================

function makeJob(data: {
  userId: string;
  sourceType: string;
  sourceId: string;
  operation: string;
  wellbeingType?: string;
  priority?: number;
}): any {
  return {
    id: 'job-1',
    data,
  };
}

function dbResult(rows: Record<string, unknown>[] = []) {
  return { rows, rowCount: rows.length, command: '', oid: 0, fields: [] };
}

/** SHA-256 hex hash matching the worker's createHash('sha256').update(content).digest('hex') */
async function sha256(content: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(content).digest('hex');
}

// ============================================================================
// TESTS
// ============================================================================

describe('Embedding Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures the processor from the Worker constructor', () => {
    // MockWorker was called at module-load time (before clearMocks runs),
    // so we verify via the captured processor reference instead of call history.
    expect(capturedProcessor).toBeDefined();
    expect(typeof capturedProcessor).toBe('function');
  });

  // --------------------------------------------------------------------------
  // Wellbeing delegation
  // --------------------------------------------------------------------------

  describe('wellbeing sourceType', () => {
    it('delegates to wellbeingEmbeddingService.processEmbedding with provided wellbeingType', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'wellbeing',
        sourceId: 'entry-1',
        operation: 'create',
        wellbeingType: 'mood',
      });

      await capturedProcessor(job);

      expect(mockProcessEmbedding).toHaveBeenCalledWith('u-1', 'mood', 'entry-1', 'create');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('falls back to determineWellbeingType when wellbeingType is missing', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'wellbeing',
        sourceId: 'entry-1',
        operation: 'create',
      });

      // determineWellbeingType queries 6 tables sequentially; first returns empty, second returns a row
      mockQuery
        .mockResolvedValueOnce(dbResult([]))          // mood_logs — miss
        .mockResolvedValueOnce(dbResult([{ id: 'entry-1' }])); // stress_logs — hit

      await capturedProcessor(job);

      expect(mockProcessEmbedding).toHaveBeenCalledWith('u-1', 'stress', 'entry-1', 'create');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('throws UnrecoverableError when wellbeingType cannot be determined from any table', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'wellbeing',
        sourceId: 'entry-unknown',
        operation: 'create',
      });

      // All 6 table checks return empty
      for (let i = 0; i < 6; i++) {
        mockQuery.mockResolvedValueOnce(dbResult([]));
      }

      await expect(capturedProcessor(job)).rejects.toThrow(
        /Could not determine wellbeing type/
      );

      expect(mockProcessEmbedding).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Delete operation
  // --------------------------------------------------------------------------

  describe('delete operation', () => {
    it('deletes from vector_embeddings for general source types', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-1',
        operation: 'delete',
      });

      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM vector_embeddings'),
        ['user_goal', 'goal-1', 'u-1'],
      );
    });

    it('deletes from user_health_embeddings for user_preferences', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_preferences',
        sourceId: 'pref-1',
        operation: 'delete',
      });

      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_health_embeddings'),
        ['u-1', 'preferences'],
      );
    });

    it('deletes from user_health_embeddings for user_profile', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_profile',
        sourceId: 'profile-1',
        operation: 'delete',
      });

      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_health_embeddings'),
        ['u-1', 'profile'],
      );
    });
  });

  // --------------------------------------------------------------------------
  // rag_message processing
  // --------------------------------------------------------------------------

  describe('rag_message sourceType', () => {
    it('fetches message content and calls updateMessageEmbedding', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'rag_message',
        sourceId: 'msg-1',
        operation: 'create',
      });

      mockQuery.mockResolvedValueOnce(
        dbResult([{ content: 'This is a sufficiently long message for embedding processing' }]),
      );

      await capturedProcessor(job);

      expect(mockUpdateMessageEmbedding).toHaveBeenCalledWith(
        'msg-1',
        'This is a sufficiently long message for embedding processing',
      );
    });

    it('skips embedding for short messages (< 20 chars)', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'rag_message',
        sourceId: 'msg-2',
        operation: 'create',
      });

      mockQuery.mockResolvedValueOnce(dbResult([{ content: 'ok thanks' }]));

      await capturedProcessor(job);

      expect(mockUpdateMessageEmbedding).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[EmbeddingWorker] Skipping embedding for short message',
        expect.objectContaining({ sourceId: 'msg-2' }),
      );
    });

    it('skips when rag_message is not found', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'rag_message',
        sourceId: 'msg-gone',
        operation: 'create',
      });

      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockUpdateMessageEmbedding).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[EmbeddingWorker] rag_message not found, skipping',
        expect.objectContaining({ sourceId: 'msg-gone' }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // General embedding (user_goal, user_plan, etc.)
  // --------------------------------------------------------------------------

  describe('general embedding flow', () => {
    it('fetches user_goal content and calls storeEmbedding with contentType goal', async () => {
      const goalRow = {
        title: 'Run 5k',
        description: 'Complete a 5k run',
        category: 'fitness',
        pillar: 'physical',
        target_value: 5,
        target_unit: 'km',
        motivation: 'Stay healthy',
        start_date: '2026-01-01',
        target_date: '2026-06-01',
        duration_weeks: 22,
        status: 'active',
        confidence_level: 8,
      };

      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-1',
        operation: 'create',
      });

      // fetchRecordContent query
      mockQuery.mockResolvedValueOnce(dbResult([goalRow]));
      // content_hash check — no existing row
      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockStoreEmbedding).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: 'user_goal',
          sourceId: 'goal-1',
          userId: 'u-1',
          contentType: 'goal',
          contentHash: expect.any(String),
        }),
      );
    });

    it('skips when record is not found (likely deleted)', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-gone',
        operation: 'update',
      });

      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockStoreEmbedding).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[EmbeddingWorker] Record not found, skipping (likely deleted)',
        expect.objectContaining({ sourceType: 'user_goal', sourceId: 'goal-gone' }),
      );
    });

    it('stores user_preferences in user_health_embeddings via storeUserHealthProfile', async () => {
      const prefsRow = {
        coaching_style: 'supportive',
        coaching_intensity: 'moderate',
        check_in_frequency: 'daily',
        preferred_check_in_time: '09:00',
        focus_areas: ['fitness', 'nutrition'],
        weight_unit: 'kg',
        language: 'en',
        notification_channels: { push: true },
        timezone: 'America/New_York',
      };

      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_preferences',
        sourceId: 'pref-1',
        operation: 'create',
      });

      // fetchRecordContent query
      mockQuery.mockResolvedValueOnce(dbResult([prefsRow]));
      // content_hash check — no existing row
      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockStoreUserHealthProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          section: 'preferences',
        }),
      );
      expect(mockStoreEmbedding).not.toHaveBeenCalled();
    });

    it('stores user_profile in user_health_embeddings with section profile', async () => {
      const profileRow = {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        date_of_birth: '1990-01-15',
        gender: 'female',
        height: 165,
        height_unit: 'cm',
        weight: 60,
        weight_unit: 'kg',
        activity_level: 'moderate',
        health_conditions: [],
        medications: [],
        allergies: [],
        coaching_style: 'direct',
        focus_areas: ['sleep'],
      };

      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_profile',
        sourceId: 'u-1',
        operation: 'update',
      });

      // user_profile fetches user+preferences join
      mockQuery.mockResolvedValueOnce(dbResult([profileRow]));
      // user_profile also fetches active goals
      mockQuery.mockResolvedValueOnce(dbResult([{ title: 'Run 5k', category: 'fitness' }]));
      // content_hash check — no existing row
      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockStoreUserHealthProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          section: 'profile',
        }),
      );
      expect(mockStoreEmbedding).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Content-hash dedup
  // --------------------------------------------------------------------------

  describe('content-hash deduplication', () => {
    const goalRow = {
      title: 'Run 5k',
      description: 'Complete a 5k run',
      category: 'fitness',
      pillar: 'physical',
      target_value: 5,
      target_unit: 'km',
      motivation: 'Stay healthy',
      start_date: '2026-01-01',
      target_date: '2026-06-01',
      duration_weeks: 22,
      status: 'active',
      confidence_level: 8,
    };

    function buildExpectedContent(row: typeof goalRow): string {
      return `
Goal: ${row.title}
Description: ${row.description}
Category: ${row.category}
Pillar: ${row.pillar}
Target: ${row.target_value} ${row.target_unit}
Motivation: ${row.motivation}
Timeline: ${row.start_date} to ${row.target_date} (${row.duration_weeks} weeks)
Status: ${row.status}
Confidence: ${row.confidence_level}/10
      `.trim();
    }

    it('skips storeEmbedding when content hash matches existing embedding', async () => {
      const content = buildExpectedContent(goalRow);
      const hash = await sha256(content);

      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-1',
        operation: 'update',
      });

      // fetchRecordContent
      mockQuery.mockResolvedValueOnce(dbResult([goalRow]));
      // content_hash check — matching hash
      mockQuery.mockResolvedValueOnce(dbResult([{ content_hash: hash }]));

      await capturedProcessor(job);

      expect(mockStoreEmbedding).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[EmbeddingWorker] Content unchanged, skipping embedding',
        expect.objectContaining({ sourceType: 'user_goal', sourceId: 'goal-1' }),
      );
    });

    it('proceeds with storeEmbedding when content hash differs', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-1',
        operation: 'update',
      });

      // fetchRecordContent
      mockQuery.mockResolvedValueOnce(dbResult([goalRow]));
      // content_hash check — stale hash
      mockQuery.mockResolvedValueOnce(dbResult([{ content_hash: 'stale-hash-value' }]));

      await capturedProcessor(job);

      expect(mockStoreEmbedding).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: 'user_goal',
          sourceId: 'goal-1',
          contentHash: expect.any(String),
        }),
      );
    });

    it('proceeds when no existing embedding row exists (first-time create)', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-new',
        operation: 'create',
      });

      // fetchRecordContent
      mockQuery.mockResolvedValueOnce(dbResult([goalRow]));
      // content_hash check — no rows
      mockQuery.mockResolvedValueOnce(dbResult([]));

      await capturedProcessor(job);

      expect(mockStoreEmbedding).toHaveBeenCalledWith(
        expect.objectContaining({ sourceId: 'goal-new' }),
      );
    });
  });

  // --------------------------------------------------------------------------
  // EmbeddingAuthError wrapping
  // --------------------------------------------------------------------------

  describe('EmbeddingAuthError handling', () => {
    it('wraps EmbeddingAuthError in UnrecoverableError', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-1',
        operation: 'create',
      });

      const goalRow = {
        title: 'X',
        description: 'Y',
        category: 'c',
        pillar: 'p',
        target_value: 1,
        target_unit: 'u',
        motivation: 'm',
        start_date: 's',
        target_date: 't',
        duration_weeks: 1,
        status: 'active',
        confidence_level: 5,
      };

      // fetchRecordContent
      mockQuery.mockResolvedValueOnce(dbResult([goalRow]));
      // content_hash check — no match
      mockQuery.mockResolvedValueOnce(dbResult([]));
      // storeEmbedding throws EmbeddingAuthError
      mockStoreEmbedding.mockRejectedValueOnce(
        new EmbeddingAuthErrorClass('API key expired'),
      );

      const error = await capturedProcessor(job).catch((e: any) => e);

      expect(error).toBeDefined();
      expect(error.name).toBe('UnrecoverableError');
      expect(error.message).toBe('API key expired');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[EmbeddingWorker] Skipping job due to auth error (unrecoverable)',
        expect.objectContaining({ jobId: 'job-1' }),
      );
    });

    it('re-throws non-auth errors without wrapping', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'user_goal',
        sourceId: 'goal-1',
        operation: 'create',
      });

      const goalRow = {
        title: 'X',
        description: 'Y',
        category: 'c',
        pillar: 'p',
        target_value: 1,
        target_unit: 'u',
        motivation: 'm',
        start_date: 's',
        target_date: 't',
        duration_weeks: 1,
        status: 'active',
        confidence_level: 5,
      };

      // fetchRecordContent
      mockQuery.mockResolvedValueOnce(dbResult([goalRow]));
      // content_hash check — no match
      mockQuery.mockResolvedValueOnce(dbResult([]));
      // storeEmbedding throws generic error
      mockStoreEmbedding.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(capturedProcessor(job)).rejects.toThrow('Network timeout');
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Unknown source type
  // --------------------------------------------------------------------------

  describe('unknown source type', () => {
    it('throws an error for unrecognized sourceType in fetchRecordContent', async () => {
      const job = makeJob({
        userId: 'u-1',
        sourceType: 'unknown_type',
        sourceId: 'x-1',
        operation: 'create',
      });

      await expect(capturedProcessor(job)).rejects.toThrow('Unknown source type: unknown_type');
    });
  });

  // --------------------------------------------------------------------------
  // Worker event listeners
  // --------------------------------------------------------------------------

  describe('worker event listeners', () => {
    it('registers completed, failed, error, and ready listeners', () => {
      // clearMocks wipes jest.fn() call history before each test, so we use
      // capturedOnCalls which was populated at module-load time.
      const registeredEvents = capturedOnCalls.map(([event]) => event);
      expect(registeredEvents).toContain('completed');
      expect(registeredEvents).toContain('failed');
      expect(registeredEvents).toContain('error');
      expect(registeredEvents).toContain('ready');
    });
  });
});
