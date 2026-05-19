/**
 * VectorEmbeddingService.storeEmbedding() Unit Tests
 *
 * Tests the upsert logic, parameter passing, default values,
 * content hash handling, and return value.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    gemini: { apiKey: '' },
    openai: { apiKey: 'test-key', model: 'text-embedding-3-small' },
    redis: { enabled: false },
  },
}));

jest.unstable_mockModule('../../../src/services/redis-cache.service.js', () => ({
  redisCacheService: {
    get: jest.fn<any>().mockResolvedValue(null),
    set: jest.fn<any>().mockResolvedValue(undefined),
  },
}));

const { vectorEmbeddingService } = await import('../../../src/services/vector-embedding.service.js');

// Spy on embedText so it never calls external APIs
const FAKE_EMBEDDING = [0.1, 0.2, 0.3];
jest.spyOn(vectorEmbeddingService as any, 'embedText').mockResolvedValue(FAKE_EMBEDDING);

// ============================================
// TESTS
// ============================================

describe('VectorEmbeddingService.storeEmbedding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply embedText spy after clearAllMocks resets it
    jest.spyOn(vectorEmbeddingService as any, 'embedText').mockResolvedValue(FAKE_EMBEDDING);
  });

  const RETURNED_ID = 'emb-uuid-001';

  function mockQueryReturningId(id = RETURNED_ID) {
    mockQuery.mockResolvedValue({ rows: [{ id }] });
  }

  it('should execute an upsert with ON CONFLICT (source_type, source_id) DO UPDATE', async () => {
    mockQueryReturningId();

    await vectorEmbeddingService.storeEmbedding({
      sourceType: 'conversation',
      sourceId: 'conv-123',
      content: 'Hello world',
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql: string = mockQuery.mock.calls[0][0];
    expect(sql).toContain('INSERT INTO vector_embeddings');
    expect(sql).toContain('ON CONFLICT (source_type, source_id)');
    expect(sql).toContain('DO UPDATE SET');
    expect(sql).toContain('RETURNING id');
  });

  it('should pass all params in the correct positional order', async () => {
    mockQueryReturningId();

    await vectorEmbeddingService.storeEmbedding({
      sourceType: 'workout',
      sourceId: 'w-456',
      userId: 'user-99',
      content: 'Bench press 3x10',
      contentType: 'activity',
      metadata: { muscleGroup: 'chest' },
      contentHash: 'abc123hash',
    });

    const params: unknown[] = mockQuery.mock.calls[0][1];
    expect(params[0]).toBe('workout');                           // sourceType
    expect(params[1]).toBe('w-456');                             // sourceId
    expect(params[2]).toBe('user-99');                           // userId
    expect(params[3]).toBe('Bench press 3x10');                  // content
    expect(params[4]).toBe('activity');                          // contentType
    expect(params[5]).toBe(`[${FAKE_EMBEDDING.join(',')}]`);     // embedding string
    expect(params[6]).toBe(JSON.stringify({ muscleGroup: 'chest' })); // metadata JSON
    expect(params[7]).toBe('abc123hash');                        // contentHash
  });

  it('should default contentType to "message", metadata to {}, and nullable fields to null', async () => {
    mockQueryReturningId();

    await vectorEmbeddingService.storeEmbedding({
      sourceType: 'note',
      sourceId: 'n-1',
      content: 'Some note',
    });

    const params: unknown[] = mockQuery.mock.calls[0][1];
    expect(params[2]).toBeNull();                // userId defaults to null
    expect(params[4]).toBe('message');            // contentType default
    expect(params[6]).toBe(JSON.stringify({}));   // metadata default
    expect(params[7]).toBeNull();                 // contentHash defaults to null
  });

  it('should return the id from the RETURNING clause', async () => {
    mockQueryReturningId('returned-id-xyz');

    const id = await vectorEmbeddingService.storeEmbedding({
      sourceType: 'meal',
      sourceId: 'm-789',
      content: 'Grilled chicken salad',
    });

    expect(id).toBe('returned-id-xyz');
  });

  it('should pass contentHash when provided instead of null', async () => {
    mockQueryReturningId();

    await vectorEmbeddingService.storeEmbedding({
      sourceType: 'conversation',
      sourceId: 'conv-hash-test',
      content: 'Hash test content',
      contentHash: 'sha256-deadbeef',
    });

    const params: unknown[] = mockQuery.mock.calls[0][1];
    expect(params[7]).toBe('sha256-deadbeef');
  });
});
