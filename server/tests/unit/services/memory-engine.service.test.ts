/**
 * Memory Engine Service Unit Tests
 *
 * Covers:
 *   A. createMemory — evidence validation, confidence formula, DB insert, error propagation
 *   B. getActiveMemories — status filter, category/type/confidence filters, pagination, empty results
 *   C. getMemoriesForContext — ranked retrieval, MAX_CONTEXT_MEMORIES cap, text search, access recording
 *   D. reinforceMemory — confidence boost, cap at 1.0, evidence merging, not-found error
 *   E. processUserFeedback — verify/reject/correct/dismiss actions, counter-memory, error cases
 *   F. applyDecay — time-based decay, archival, expiry, empty user
 *   G. findOrCreatePattern — idempotent create-or-reinforce, DB error propagation
 *   H. formatMemoriesForPrompt — category grouping, empty array, low-confidence annotation
 *
 * Total: 48 test cases
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS (before any service imports)
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { memoryEngineService } = await import('../../../src/services/memory-engine.service.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ============================================
// HELPERS
// ============================================

const USER_ID = 'u-test-001';
const MEMORY_ID = 'mem-001';

function makeEvidence(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    source_table: 'activity_events',
    source_id: `evt-${i + 1}`,
    date: '2025-01-15',
    summary: `Evidence item ${i + 1}`,
  }));
}

function makeMemoryRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: MEMORY_ID,
    user_id: USER_ID,
    memory_type: 'pattern',
    category: 'fitness',
    subcategory: null,
    title: 'Morning workout preference',
    description: 'User consistently works out between 6-8am',
    structured_data: { preferred_time: '06:00-08:00' },
    confidence: 0.6,
    evidence_count: 3,
    evidence: makeEvidence(3),
    min_evidence: 3,
    source: 'ai',
    kg_node_ids: [],
    related_memory_ids: [],
    status: 'active',
    verified_at: null,
    rejected_at: null,
    rejection_reason: null,
    superseded_by: null,
    last_accessed_at: now,
    access_count: 5,
    decay_rate: 0.01,
    expires_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function makeCreateInput(overrides: Record<string, unknown> = {}) {
  return {
    memoryType: 'pattern' as const,
    category: 'fitness' as const,
    title: 'Morning workout preference',
    description: 'User consistently works out between 6-8am',
    evidence: makeEvidence(3),
    source: 'ai' as const,
    ...overrides,
  };
}

// ============================================
// SETUP
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// A. createMemory
// ============================================

describe('createMemory', () => {
  it('creates memory with valid AI input (3 evidence items)', async () => {
    const row = makeMemoryRow({ confidence: 0.6 });
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    const result = await memoryEngineService.createMemory(USER_ID, makeCreateInput());

    expect(result.id).toBe(MEMORY_ID);
    expect(result.userId).toBe(USER_ID);
    expect(result.memoryType).toBe('pattern');
    expect(result.category).toBe('fitness');
    expect(result.source).toBe('ai');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    // Verify INSERT query
    expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO intelligence_memories');
  });

  it('creates memory with valid user input (1 evidence item)', async () => {
    const row = makeMemoryRow({
      source: 'user',
      min_evidence: 1,
      evidence_count: 1,
      confidence: 0.7,
    });
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    const input = makeCreateInput({
      evidence: makeEvidence(1),
      source: 'user',
    });
    const result = await memoryEngineService.createMemory(USER_ID, input);

    expect(result.source).toBe('user');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('rejects AI memory with fewer than 3 evidence items', async () => {
    const input = makeCreateInput({ evidence: makeEvidence(2) });

    await expect(
      memoryEngineService.createMemory(USER_ID, input),
    ).rejects.toThrow('AI-created memories require at least 3 evidence item(s), got 2');

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects user memory with 0 evidence items', async () => {
    const input = makeCreateInput({ evidence: [], source: 'user' });

    await expect(
      memoryEngineService.createMemory(USER_ID, input),
    ).rejects.toThrow('User-created memories require at least 1 evidence item(s), got 0');

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('computes AI confidence: 3 items -> 0.6', async () => {
    const row = makeMemoryRow();
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    await memoryEngineService.createMemory(USER_ID, makeCreateInput({ evidence: makeEvidence(3) }));

    // confidence param is at index 7 in the params array
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params[7]).toBeCloseTo(0.6, 5); // 0.3 + 3*0.1
  });

  it('caps AI confidence at 0.8 for 5+ items', async () => {
    const row = makeMemoryRow({ evidence_count: 7, confidence: 0.8 });
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    await memoryEngineService.createMemory(
      USER_ID,
      makeCreateInput({ evidence: makeEvidence(7) }),
    );

    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params[7]).toBe(0.8); // min(0.3 + 7*0.1, 0.8) = min(1.0, 0.8) = 0.8
  });

  it('computes user confidence: 2 items -> 0.9 (capped)', async () => {
    const row = makeMemoryRow({ source: 'user', confidence: 0.9 });
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    await memoryEngineService.createMemory(
      USER_ID,
      makeCreateInput({ evidence: makeEvidence(3), source: 'user' }),
    );

    const params = mockQuery.mock.calls[0][1] as unknown[];
    // user formula: min(0.5 + 3*0.2, 0.9) = min(1.1, 0.9) = 0.9
    expect(params[7]).toBe(0.9);
  });

  it('sends structuredData as JSON string', async () => {
    const structured = { workout: 'morning', duration: 45 };
    const row = makeMemoryRow({ structured_data: structured });
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    await memoryEngineService.createMemory(
      USER_ID,
      makeCreateInput({ structuredData: structured }),
    );

    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params[6]).toBe(JSON.stringify(structured));
  });

  it('sets default decay_rate to 0.01', async () => {
    const row = makeMemoryRow();
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    await memoryEngineService.createMemory(USER_ID, makeCreateInput());

    const params = mockQuery.mock.calls[0][1] as unknown[];
    // decay_rate is at index 12
    expect(params[12]).toBe(0.01);
  });

  it('propagates database errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('connection refused'));

    await expect(
      memoryEngineService.createMemory(USER_ID, makeCreateInput()),
    ).rejects.toThrow('connection refused');
  });
});

// ============================================
// B. getActiveMemories
// ============================================

describe('getActiveMemories', () => {
  it('returns all active/verified memories for user with no filter', async () => {
    const rows = [
      makeMemoryRow({ id: 'mem-1', confidence: 0.9 }),
      makeMemoryRow({ id: 'mem-2', confidence: 0.6 }),
    ];
    mockQuery.mockResolvedValueOnce(pgResult(rows));

    const result = await memoryEngineService.getActiveMemories(USER_ID);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('mem-1');
    expect(result[1].id).toBe('mem-2');
    // Check that default status filter includes active+verified
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("status IN ('active', 'verified')");
  });

  it('filters by category', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ category: 'nutrition' })]));

    const result = await memoryEngineService.getActiveMemories(USER_ID, { category: 'nutrition' });

    expect(result).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('category = $2');
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params[1]).toBe('nutrition');
  });

  it('filters by memoryType', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ memory_type: 'preference' })]));

    const result = await memoryEngineService.getActiveMemories(USER_ID, { memoryType: 'preference' });

    expect(result).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('memory_type = $2');
  });

  it('filters by minConfidence', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ confidence: 0.8 })]));

    await memoryEngineService.getActiveMemories(USER_ID, { minConfidence: 0.7 });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('confidence >= $2');
    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params[1]).toBe(0.7);
  });

  it('respects limit and offset pagination', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await memoryEngineService.getActiveMemories(USER_ID, { limit: 10, offset: 20 });

    const params = mockQuery.mock.calls[0][1] as unknown[];
    // limit and offset are the last two params
    const limitIdx = params.length - 2;
    const offsetIdx = params.length - 1;
    expect(params[limitIdx]).toBe(10);
    expect(params[offsetIdx]).toBe(20);
  });

  it('returns empty array when no matches', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.getActiveMemories(USER_ID, { category: 'sleep' });

    expect(result).toEqual([]);
  });

  it('combines multiple filters with AND', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await memoryEngineService.getActiveMemories(USER_ID, {
      category: 'fitness',
      memoryType: 'pattern',
      minConfidence: 0.5,
    });

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('category = $2');
    expect(sql).toContain('memory_type = $3');
    expect(sql).toContain('confidence >= $4');
  });
});

// ============================================
// C. getMemoriesForContext
// ============================================

describe('getMemoriesForContext', () => {
  it('returns ranked memories for user message', async () => {
    const rows = [
      makeMemoryRow({ id: 'mem-1', confidence: 0.9 }),
      makeMemoryRow({ id: 'mem-2', confidence: 0.7 }),
    ];
    // SELECT query
    mockQuery.mockResolvedValueOnce(pgResult(rows));
    // UPDATE access query
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.getMemoriesForContext(
      USER_ID,
      'morning workout routine',
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('mem-1');
    // Verify ILIKE text search
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('ILIKE');
    expect(sql).toContain('relevance_score');
  });

  it('caps at MAX_CONTEXT_MEMORIES (20)', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.getMemoriesForContext(USER_ID, 'query', 50);

    const params = mockQuery.mock.calls[0][1] as unknown[];
    // limit param should be capped at 20
    expect(params[1]).toBe(20);
  });

  it('truncates userMessage to 100 chars for ILIKE', async () => {
    const longMessage = 'a'.repeat(200);
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.getMemoriesForContext(USER_ID, longMessage);

    const params = mockQuery.mock.calls[0][1] as unknown[];
    const searchParam = params[2] as string;
    // Should be %...% wrapping at most 100 chars
    expect(searchParam.length).toBeLessThanOrEqual(102); // 100 + 2 for %...%
  });

  it('records access for returned memories', async () => {
    const rows = [makeMemoryRow({ id: 'mem-1' }), makeMemoryRow({ id: 'mem-2' })];
    mockQuery.mockResolvedValueOnce(pgResult(rows));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.getMemoriesForContext(USER_ID, 'test');

    // Second query should be the UPDATE for access recording
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const updateSql = mockQuery.mock.calls[1][0] as string;
    expect(updateSql).toContain('UPDATE intelligence_memories');
    expect(updateSql).toContain('access_count = access_count + 1');
  });

  it('returns empty array for user with no memories', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.getMemoriesForContext(USER_ID, 'anything');

    expect(result).toEqual([]);
    // No access update query should fire
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('uses default limit of 10 when not specified', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.getMemoriesForContext(USER_ID, 'test');

    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params[1]).toBe(10);
  });
});

// ============================================
// D. reinforceMemory
// ============================================

describe('reinforceMemory', () => {
  it('boosts confidence by newEvidence.length * 0.1', async () => {
    const existingRow = makeMemoryRow({
      confidence: 0.5,
      evidence_count: 3,
      evidence: makeEvidence(3),
    });
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    mockQuery.mockResolvedValueOnce(pgEmpty()); // UPDATE

    const result = await memoryEngineService.reinforceMemory(
      MEMORY_ID,
      USER_ID,
      makeEvidence(1),
    );

    expect(result.previousConfidence).toBe(0.5);
    expect(result.newConfidence).toBeCloseTo(0.6, 5);
    expect(result.totalEvidence).toBe(4);
    expect(result.memoryId).toBe(MEMORY_ID);
  });

  it('caps confidence at 1.0', async () => {
    const existingRow = makeMemoryRow({
      confidence: 0.95,
      evidence_count: 10,
      evidence: makeEvidence(10),
    });
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.reinforceMemory(
      MEMORY_ID,
      USER_ID,
      makeEvidence(2),
    );

    expect(result.newConfidence).toBe(1.0);
  });

  it('caps boost at 0.3 for many evidence items', async () => {
    const existingRow = makeMemoryRow({
      confidence: 0.5,
      evidence_count: 3,
      evidence: makeEvidence(3),
    });
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.reinforceMemory(
      MEMORY_ID,
      USER_ID,
      makeEvidence(5), // 5 * 0.1 = 0.5, but capped at 0.3
    );

    expect(result.newConfidence).toBeCloseTo(0.8, 5); // 0.5 + 0.3
    expect(result.totalEvidence).toBe(8);
  });

  it('merges new evidence with existing evidence array', async () => {
    const existingEvidence = makeEvidence(2);
    const existingRow = makeMemoryRow({
      confidence: 0.5,
      evidence_count: 2,
      evidence: existingEvidence,
    });
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const newEvidence = makeEvidence(1);
    await memoryEngineService.reinforceMemory(MEMORY_ID, USER_ID, newEvidence);

    // UPDATE query params: evidence = $5
    const updateParams = mockQuery.mock.calls[1][1] as unknown[];
    const evidenceJson = JSON.parse(updateParams[4] as string);
    expect(evidenceJson).toHaveLength(3); // 2 existing + 1 new
  });

  it('throws when memory not found or not active', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await expect(
      memoryEngineService.reinforceMemory(MEMORY_ID, USER_ID, makeEvidence(1)),
    ).rejects.toThrow('Memory not found or not active');
  });
});

// ============================================
// E. processUserFeedback
// ============================================

describe('processUserFeedback', () => {
  it('verify: sets verified status, boosts confidence by 0.15', async () => {
    const verifiedRow = makeMemoryRow({
      status: 'verified',
      verified_at: new Date(),
      confidence: 0.75,
    });
    // UPDATE RETURNING *
    mockQuery.mockResolvedValueOnce(pgResult([verifiedRow]));
    // INSERT feedback
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.processUserFeedback(
      MEMORY_ID, USER_ID, 'verify',
    );

    expect(result.memory.status).toBe('verified');
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("status = 'verified'");
    expect(sql).toContain('verified_at = NOW()');
    expect(sql).toContain('confidence + 0.15');
  });

  it('verify: records feedback with confidence_delta 0.15', async () => {
    const verifiedRow = makeMemoryRow({ status: 'verified', verified_at: new Date() });
    mockQuery.mockResolvedValueOnce(pgResult([verifiedRow]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.processUserFeedback(MEMORY_ID, USER_ID, 'verify');

    // Feedback INSERT
    const feedbackSql = mockQuery.mock.calls[1][0] as string;
    expect(feedbackSql).toContain('intelligence_feedback');
    const feedbackParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(feedbackParams[4]).toBe(0.15); // confidence_delta
  });

  it('reject: sets rejected status with reason', async () => {
    const rejectedRow = makeMemoryRow({
      status: 'rejected',
      rejected_at: new Date(),
      rejection_reason: 'Inaccurate observation',
      related_memory_ids: [],
    });
    mockQuery.mockResolvedValueOnce(pgResult([rejectedRow]));
    // INSERT feedback
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.processUserFeedback(
      MEMORY_ID, USER_ID, 'reject', undefined, 'Inaccurate observation',
    );

    expect(result.memory.status).toBe('rejected');
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("status = 'rejected'");
    expect(sql).toContain('rejected_at = NOW()');
  });

  it('reject: reduces confidence on related memories', async () => {
    const rejectedRow = makeMemoryRow({
      status: 'rejected',
      rejected_at: new Date(),
      related_memory_ids: ['related-1', 'related-2'],
    });
    // UPDATE original memory
    mockQuery.mockResolvedValueOnce(pgResult([rejectedRow]));
    // UPDATE related memories confidence
    mockQuery.mockResolvedValueOnce(pgEmpty());
    // INSERT feedback
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.processUserFeedback(
      MEMORY_ID, USER_ID, 'reject', undefined, 'wrong',
    );

    // Second call is the related memories update
    const relatedSql = mockQuery.mock.calls[1][0] as string;
    expect(relatedSql).toContain('confidence - 0.1');
    expect(relatedSql).toContain('ANY($1)');
    const relatedParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(relatedParams[0]).toEqual(['related-1', 'related-2']);
  });

  it('correct: creates counter-memory and marks original as superseded', async () => {
    const supersededRow = makeMemoryRow({
      status: 'superseded',
      category: 'fitness',
      memory_type: 'pattern',
    });
    // UPDATE original to superseded
    mockQuery.mockResolvedValueOnce(pgResult([supersededRow]));
    // INSERT counter-memory
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'counter-mem-1' }]));
    // UPDATE superseded_by
    mockQuery.mockResolvedValueOnce(pgEmpty());
    // INSERT feedback
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.processUserFeedback(
      MEMORY_ID, USER_ID, 'correct',
      { title: 'Corrected title', description: 'Corrected description' },
    );

    expect(result.counterMemoryId).toBe('counter-mem-1');
    expect(result.memory.status).toBe('superseded');

    // Verify counter-memory INSERT
    const counterSql = mockQuery.mock.calls[1][0] as string;
    expect(counterSql).toContain('INSERT INTO intelligence_memories');
    const counterParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(counterParams[4]).toBe('Corrected title');
    expect(counterParams[5]).toBe('Corrected description');

    // Verify superseded_by UPDATE
    const superSql = mockQuery.mock.calls[2][0] as string;
    expect(superSql).toContain('superseded_by = $1');
  });

  it('correct with no correctionData: marks superseded but no counter-memory', async () => {
    const supersededRow = makeMemoryRow({ status: 'superseded' });
    // UPDATE original
    mockQuery.mockResolvedValueOnce(pgResult([supersededRow]));
    // INSERT feedback
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.processUserFeedback(
      MEMORY_ID, USER_ID, 'correct',
    );

    // Should not create a counter-memory
    expect(result.counterMemoryId).toBeUndefined();
    expect(result.memory.status).toBe('superseded');
    // Only 2 queries: UPDATE + feedback INSERT
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('dismiss: reduces confidence by 0.1', async () => {
    const dismissedRow = makeMemoryRow({ confidence: 0.5 });
    mockQuery.mockResolvedValueOnce(pgResult([dismissedRow]));
    // INSERT feedback
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.processUserFeedback(MEMORY_ID, USER_ID, 'dismiss');

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('confidence - 0.1');
    expect(sql).toContain('GREATEST');
    // Feedback delta should be -0.1
    const feedbackParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(feedbackParams[4]).toBe(-0.1);
  });

  it('throws when memory not found', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await expect(
      memoryEngineService.processUserFeedback(MEMORY_ID, USER_ID, 'verify'),
    ).rejects.toThrow('Memory not found or action not applicable');
  });

  it('throws when action on wrong user (returns 0 rows)', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await expect(
      memoryEngineService.processUserFeedback(MEMORY_ID, 'wrong-user', 'dismiss'),
    ).rejects.toThrow('Memory not found or action not applicable');
  });

  it('verify with comment: passes comment to feedback record', async () => {
    const verifiedRow = makeMemoryRow({ status: 'verified', verified_at: new Date() });
    mockQuery.mockResolvedValueOnce(pgResult([verifiedRow]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.processUserFeedback(
      MEMORY_ID, USER_ID, 'verify', undefined, 'Looks accurate',
    );

    const feedbackParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(feedbackParams[3]).toBe('Looks accurate');
  });
});

// ============================================
// F. applyDecay
// ============================================

describe('applyDecay', () => {
  it('decays memories not accessed in 7+ days', async () => {
    // Decay UPDATE
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'mem-1' }, { id: 'mem-2' }]));
    // Archive UPDATE
    mockQuery.mockResolvedValueOnce(pgEmpty());
    // Expire UPDATE
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.applyDecay(USER_ID);

    expect(result.decayed).toBe(2);
    const decaySql = mockQuery.mock.calls[0][0] as string;
    expect(decaySql).toContain("last_accessed_at < NOW() - INTERVAL '7 days'");
    expect(decaySql).toContain('confidence - decay_rate');
  });

  it('archives memories with confidence below 0.1', async () => {
    // Decay UPDATE
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'mem-1' }]));
    // Archive UPDATE
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'mem-2' }, { id: 'mem-3' }]));
    // Expire UPDATE
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.applyDecay(USER_ID);

    expect(result.archived).toBe(2);
    const archiveSql = mockQuery.mock.calls[1][0] as string;
    expect(archiveSql).toContain("status = 'expired'");
    expect(archiveSql).toContain('confidence < 0.1');
  });

  it('expires memories past their hard expiry date', async () => {
    // Decay
    mockQuery.mockResolvedValueOnce(pgEmpty());
    // Archive
    mockQuery.mockResolvedValueOnce(pgEmpty());
    // Expire
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.applyDecay(USER_ID);

    // Third query handles expiry
    const expireSql = mockQuery.mock.calls[2][0] as string;
    expect(expireSql).toContain('expires_at IS NOT NULL');
    expect(expireSql).toContain('expires_at < NOW()');
    expect(expireSql).toContain("status = 'expired'");
  });

  it('returns correct decayed and archived counts', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'a' }, { id: 'b' }, { id: 'c' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'd' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.applyDecay(USER_ID);

    expect(result).toEqual({ decayed: 3, archived: 1 });
  });

  it('handles user with no memories (all zeros)', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const result = await memoryEngineService.applyDecay(USER_ID);

    expect(result).toEqual({ decayed: 0, archived: 0 });
  });

  it('passes userId to all three queries', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await memoryEngineService.applyDecay(USER_ID);

    expect(mockQuery).toHaveBeenCalledTimes(3);
    for (let i = 0; i < 3; i++) {
      const params = mockQuery.mock.calls[i][1] as unknown[];
      expect(params[0]).toBe(USER_ID);
    }
  });
});

// ============================================
// G. findOrCreatePattern
// ============================================

describe('findOrCreatePattern', () => {
  it('creates new memory when no existing match', async () => {
    // Search query returns nothing
    mockQuery.mockResolvedValueOnce(pgEmpty());
    // createMemory INSERT
    const newRow = makeMemoryRow({ id: 'new-mem-1' });
    mockQuery.mockResolvedValueOnce(pgResult([newRow]));

    const result = await memoryEngineService.findOrCreatePattern(
      USER_ID,
      'fitness',
      'Evening runs',
      'User runs in the evening 3x per week',
      makeEvidence(3),
      'ai',
    );

    expect(result.wasReinforced).toBe(false);
    expect(result.memory.id).toBe('new-mem-1');
    // First query is the search, second is the INSERT
    const searchSql = mockQuery.mock.calls[0][0] as string;
    expect(searchSql).toContain('title ILIKE');
  });

  it('reinforces existing memory when title matches', async () => {
    // Search returns existing
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'existing-mem' }]));
    // reinforceMemory: SELECT existing
    const existingRow = makeMemoryRow({
      id: 'existing-mem',
      confidence: 0.6,
      evidence_count: 3,
      evidence: makeEvidence(3),
    });
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    // reinforceMemory: UPDATE
    mockQuery.mockResolvedValueOnce(pgEmpty());
    // refreshed SELECT
    const refreshedRow = makeMemoryRow({
      id: 'existing-mem',
      confidence: 0.7,
      evidence_count: 4,
    });
    mockQuery.mockResolvedValueOnce(pgResult([refreshedRow]));

    const result = await memoryEngineService.findOrCreatePattern(
      USER_ID,
      'fitness',
      'Morning workout',
      'User works out in the morning',
      makeEvidence(1),
      'ai',
    );

    expect(result.wasReinforced).toBe(true);
    expect(result.memory.id).toBe('existing-mem');
  });

  it('searches by title ILIKE pattern', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await memoryEngineService.findOrCreatePattern(
      USER_ID,
      'fitness',
      'My Pattern Title',
      'Description text',
      makeEvidence(3),
    );

    const params = mockQuery.mock.calls[0][1] as unknown[];
    expect(params[2]).toBe('%My Pattern Title%');
    expect(params[3]).toBe('%My Pattern Title%');
  });

  it('propagates DB error during search', async () => {
    mockQuery.mockRejectedValueOnce(new Error('table does not exist'));

    await expect(
      memoryEngineService.findOrCreatePattern(
        USER_ID, 'fitness', 'Title', 'Desc', makeEvidence(3),
      ),
    ).rejects.toThrow('table does not exist');
  });
});

// ============================================
// H. formatMemoriesForPrompt
// ============================================

describe('formatMemoriesForPrompt', () => {
  it('groups memories by category with markdown headers', () => {
    const memories = [
      {
        id: '1', userId: USER_ID, memoryType: 'pattern' as const,
        category: 'fitness' as const, title: 'Morning runs',
        description: 'Runs at 6am daily', structuredData: {},
        confidence: 0.8, evidenceCount: 5, evidence: [],
        minEvidence: 3, source: 'ai' as const, kgNodeIds: [],
        relatedMemoryIds: [], status: 'active' as const,
        verifiedAt: null, rejectedAt: null, rejectionReason: null,
        supersededBy: null, lastAccessedAt: new Date().toISOString(),
        accessCount: 10, decayRate: 0.01, expiresAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: '2', userId: USER_ID, memoryType: 'preference' as const,
        category: 'nutrition' as const, title: 'Prefers protein',
        description: 'High protein meals preferred', structuredData: {},
        confidence: 0.7, evidenceCount: 4, evidence: [],
        minEvidence: 3, source: 'ai' as const, kgNodeIds: [],
        relatedMemoryIds: [], status: 'active' as const,
        verifiedAt: null, rejectedAt: null, rejectionReason: null,
        supersededBy: null, lastAccessedAt: new Date().toISOString(),
        accessCount: 3, decayRate: 0.01, expiresAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: '3', userId: USER_ID, memoryType: 'context' as const,
        category: 'fitness' as const, title: 'Gym membership',
        description: 'Has active gym membership', structuredData: {},
        confidence: 0.9, evidenceCount: 2, evidence: [],
        minEvidence: 1, source: 'user' as const, kgNodeIds: [],
        relatedMemoryIds: [], status: 'active' as const,
        verifiedAt: null, rejectedAt: null, rejectionReason: null,
        supersededBy: null, lastAccessedAt: new Date().toISOString(),
        accessCount: 1, decayRate: 0.01, expiresAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ];

    const result = memoryEngineService.formatMemoriesForPrompt(memories);

    // Should have category headers
    expect(result).toContain('### Fitness');
    expect(result).toContain('### Nutrition');
    // Fitness should have 2 items
    expect(result).toContain('[pattern] Morning runs');
    expect(result).toContain('[context] Gym membership');
    // Nutrition should have 1 item
    expect(result).toContain('[preference] Prefers protein');
    // Source formatting: user -> user-reported
    expect(result).toContain('user-reported');
    // Data points
    expect(result).toContain('5 data points');
    expect(result).toContain('4 data points');
  });

  it('returns empty string for empty array', () => {
    const result = memoryEngineService.formatMemoriesForPrompt([]);

    expect(result).toBe('');
  });

  it('annotates low confidence memories (below 0.5)', () => {
    const memories = [
      {
        id: '1', userId: USER_ID, memoryType: 'pattern' as const,
        category: 'sleep' as const, title: 'Late sleeper',
        description: 'Goes to bed after midnight', structuredData: {},
        confidence: 0.3, evidenceCount: 2, evidence: [],
        minEvidence: 3, source: 'ai' as const, kgNodeIds: [],
        relatedMemoryIds: [], status: 'active' as const,
        verifiedAt: null, rejectedAt: null, rejectionReason: null,
        supersededBy: null, lastAccessedAt: new Date().toISOString(),
        accessCount: 0, decayRate: 0.01, expiresAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ];

    const result = memoryEngineService.formatMemoriesForPrompt(memories);

    expect(result).toContain('(low confidence)');
    expect(result).toContain('### Sleep');
  });

  it('does not annotate low confidence for memories at 0.5+', () => {
    const memories = [
      {
        id: '1', userId: USER_ID, memoryType: 'pattern' as const,
        category: 'fitness' as const, title: 'Test',
        description: 'Test desc', structuredData: {},
        confidence: 0.5, evidenceCount: 3, evidence: [],
        minEvidence: 3, source: 'ai' as const, kgNodeIds: [],
        relatedMemoryIds: [], status: 'active' as const,
        verifiedAt: null, rejectedAt: null, rejectionReason: null,
        supersededBy: null, lastAccessedAt: new Date().toISOString(),
        accessCount: 0, decayRate: 0.01, expiresAt: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ];

    const result = memoryEngineService.formatMemoriesForPrompt(memories);

    expect(result).not.toContain('(low confidence)');
  });
});
