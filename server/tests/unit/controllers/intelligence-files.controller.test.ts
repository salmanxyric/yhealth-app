/**
 * Intelligence Files Controller Unit Tests
 *
 * Tests: getFolders, listMemories, getMemory, createMemory, updateMemory,
 *        verifyMemory, rejectMemory, expireMemory, searchMemories,
 *        getCoreProfile, updateCoreValue, listArtifacts, listLogs,
 *        submitFeedback, getCoreProfileSection, getArtifact, updateArtifact,
 *        listPlans, getPlan.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockCoreProfileKernelService = {
  getProfile: jest.fn<any>(),
  getProfileSection: jest.fn<any>(),
  updateValue: jest.fn<any>(),
};
jest.unstable_mockModule('../../../src/services/core-profile-kernel.service.js', () => ({
  coreProfileKernelService: mockCoreProfileKernelService,
}));

// ── Dynamic imports AFTER mocks ──
const { intelligenceFilesController: controller } = await import(
  '../../../src/controllers/intelligence-files.controller.js'
);
const { createAuthReq, createRes, createNext, callHandler, getJsonBody } = await import(
  '../../helpers/controller-harness.js'
);
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Shared Fixtures ──

const NOW = new Date('2025-06-15T12:00:00.000Z');

function makeMemoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mem-1',
    user_id: 'test-user-id',
    memory_type: 'pattern',
    category: 'fitness',
    subcategory: null,
    title: 'Morning runner',
    description: 'User consistently runs in the morning',
    structured_data: { avgDistance: 5 },
    confidence: 0.75,
    evidence_count: 3,
    evidence: [{ source_table: 'activities', date: '2025-06-01', summary: 'Ran 5k' }],
    min_evidence: 1,
    source: 'ai',
    kg_node_ids: [],
    related_memory_ids: [],
    status: 'active',
    verified_at: null,
    rejected_at: null,
    rejection_reason: null,
    superseded_by: null,
    last_accessed_at: NOW,
    access_count: 5,
    decay_rate: 0.01,
    expires_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeArtifactRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'art-1',
    user_id: 'test-user-id',
    artifact_type: 'chart',
    title: 'Weekly Steps Chart',
    description: 'Steps over last 7 days',
    chart_config: { type: 'bar' },
    data: [{ day: 'Mon', steps: 8000 }],
    insight: 'Steps peaked on Monday',
    generated_by: 'ai_coach',
    trigger_message_id: null,
    conversation_id: null,
    analysis_id: null,
    memory_ids_used: [],
    data_sources: ['activities'],
    is_pinned: false,
    is_archived: false,
    tags: ['steps', 'weekly'],
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeLogRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1',
    user_id: 'test-user-id',
    source_table: 'activities',
    source_id: 'act-1',
    source_date: '2025-06-10',
    summary: 'Completed 5k run',
    category: 'fitness',
    memory_ids: ['mem-1'],
    artifact_ids: [],
    created_at: NOW,
    ...overrides,
  };
}

function makeFolderCountRow(count: number, lastModified: Date | null = NOW) {
  return { count: String(count), last_modified: lastModified };
}

beforeEach(() => jest.clearAllMocks());

// ═══════════════════════════════════════════════
// getFolders
// ═══════════════════════════════════════════════
describe('getFolders', () => {
  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getFolders, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('returns all folder summaries with counts and lastModified', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    // 7 parallel COUNT queries: memories, artifacts, plans, core, logs, notes, wiki
    mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(12)]));
    mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(5)]));
    mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(3)]));
    mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(8)]));
    mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(20)]));
    mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(2)]));
    mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(4)]));

    await callHandler(controller.getFolders, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.folders).toHaveLength(7);

    const [memories, notes, artifacts, plans, core, logs, wiki] = body.data.folders;
    expect(memories.id).toBe('memories');
    expect(memories.itemCount).toBe(12);
    expect(notes.id).toBe('notes');
    expect(notes.itemCount).toBe(2);
    expect(artifacts.id).toBe('artifacts');
    expect(artifacts.itemCount).toBe(5);
    expect(plans.id).toBe('plans');
    expect(plans.itemCount).toBe(3);
    expect(core.id).toBe('core');
    expect(core.itemCount).toBe(8);
    expect(logs.id).toBe('logs');
    expect(logs.itemCount).toBe(20);
    expect(wiki.id).toBe('wiki');
    expect(wiki.itemCount).toBe(4);
  });

  it('returns zero counts and null lastModified for empty folders', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    for (let i = 0; i < 7; i++) {
      mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(0, null)]));
    }

    await callHandler(controller.getFolders, req, res, next);

    const body = getJsonBody(res);
    for (const folder of body.data.folders) {
      expect(folder.itemCount).toBe(0);
      expect(folder.lastModified).toBeNull();
    }
  });

  it('propagates database errors through next()', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockRejectedValueOnce(new Error('connection timeout'));

    await callHandler(controller.getFolders, req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════
// listMemories
// ═══════════════════════════════════════════════
describe('listMemories', () => {
  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.listMemories, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns paginated memories with default params', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '2' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow(), makeMemoryRow({ id: 'mem-2' })]));

    await callHandler(controller.listMemories, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.memories).toHaveLength(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
    expect(body.meta.total).toBe(2);
    expect(body.meta.totalPages).toBe(1);
    expect(body.meta.hasNextPage).toBe(false);
    expect(body.meta.hasPrevPage).toBe(false);
  });

  it('applies category filter', async () => {
    const req = createAuthReq({}, { query: { category: 'nutrition' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ category: 'nutrition' })]));

    await callHandler(controller.listMemories, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.memories[0].category).toBe('nutrition');
    // Verify the query included the category filter
    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('category = $');
  });

  it('applies memoryType filter', async () => {
    const req = createAuthReq({}, { query: { memoryType: 'preference' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listMemories, req, res, next);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('memory_type = $');
  });

  it('applies minConfidence filter', async () => {
    const req = createAuthReq({}, { query: { minConfidence: '0.5' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ confidence: 0.8 })]));

    await callHandler(controller.listMemories, req, res, next);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('confidence >= $');
  });

  it('applies non-active status filter as exact match', async () => {
    const req = createAuthReq({}, { query: { status: 'rejected' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ status: 'rejected' })]));

    await callHandler(controller.listMemories, req, res, next);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain('status = $');
    expect(countCall[1]).toContain('rejected');
  });

  it('defaults active status to IN (active, verified)', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listMemories, req, res, next);

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[0]).toContain("status IN ('active', 'verified')");
  });

  it('sorts by confidence when sort=confidence', async () => {
    const req = createAuthReq({}, { query: { sort: 'confidence' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listMemories, req, res, next);

    const dataCall = mockQuery.mock.calls[1];
    expect(dataCall[0]).toContain('ORDER BY confidence DESC');
  });

  it('sorts by usage when sort=usage', async () => {
    const req = createAuthReq({}, { query: { sort: 'usage' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listMemories, req, res, next);

    const dataCall = mockQuery.mock.calls[1];
    expect(dataCall[0]).toContain('ORDER BY access_count DESC');
  });

  it('calculates correct pagination meta for page 2', async () => {
    const req = createAuthReq({}, { query: { page: '2', limit: '5' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '12' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await callHandler(controller.listMemories, req, res, next);

    const body = getJsonBody(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(5);
    expect(body.meta.total).toBe(12);
    expect(body.meta.totalPages).toBe(3);
    expect(body.meta.hasNextPage).toBe(true);
    expect(body.meta.hasPrevPage).toBe(true);
  });

  it('passes correct LIMIT and OFFSET to the data query', async () => {
    const req = createAuthReq({}, { query: { page: '3', limit: '10' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '30' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listMemories, req, res, next);

    const dataCall = mockQuery.mock.calls[1];
    // Values array ends with [limit, offset]
    const dataValues = dataCall[1] as unknown[];
    expect(dataValues[dataValues.length - 2]).toBe(10);
    expect(dataValues[dataValues.length - 1]).toBe(20); // (3-1) * 10
  });

  it('combines multiple filters simultaneously', async () => {
    const req = createAuthReq({}, {
      query: { category: 'sleep', memoryType: 'pattern', minConfidence: '0.7', status: 'verified' },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listMemories, req, res, next);

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain('category = $');
    expect(countSql).toContain('memory_type = $');
    expect(countSql).toContain('confidence >= $');
    expect(countSql).toContain('status = $');
  });

  it('maps snake_case DB rows to camelCase response', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await callHandler(controller.listMemories, req, res, next);

    const body = getJsonBody(res);
    const mem = body.data.memories[0];
    expect(mem).toHaveProperty('memoryType');
    expect(mem).toHaveProperty('evidenceCount');
    expect(mem).toHaveProperty('accessCount');
    expect(mem).toHaveProperty('createdAt');
    expect(mem).not.toHaveProperty('memory_type');
    expect(mem).not.toHaveProperty('evidence_count');
  });
});

// ═══════════════════════════════════════════════
// getMemory
// ═══════════════════════════════════════════════
describe('getMemory', () => {
  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { params: { id: 'mem-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('returns memory and updates access tracking', async () => {
    const req = createAuthReq({}, { params: { id: 'mem-1' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));
    mockQuery.mockResolvedValueOnce(pgResult([])); // access update

    await callHandler(controller.getMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.memory.id).toBe('mem-1');
    expect(body.data.memory.title).toBe('Morning runner');

    // Verify access-tracking UPDATE was called
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[0]).toContain('last_accessed_at');
    expect(updateCall[0]).toContain('access_count');
  });

  it('returns 404 when memory does not exist', async () => {
    const req = createAuthReq({}, { params: { id: 'nonexistent' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.getMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════
// createMemory
// ═══════════════════════════════════════════════
describe('createMemory', () => {
  const validBody = {
    memoryType: 'pattern',
    category: 'fitness',
    title: 'New pattern',
    description: 'A fitness pattern detected by user',
    evidence: [{ source_table: 'activities', date: '2025-06-01', summary: 'Ran 5k' }],
    source: 'user',
  };

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { body: validBody });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.createMemory, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('creates a memory with valid input and returns 201', async () => {
    const req = createAuthReq({}, { body: validBody });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ id: 'new-mem', title: 'New pattern' })]));

    await callHandler(controller.createMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.memory.title).toBe('New pattern');
  });

  it('calculates confidence based on evidence count (user source)', async () => {
    const req = createAuthReq({}, {
      body: {
        ...validBody,
        evidence: [
          { source_table: 'a', date: '2025-01-01', summary: 'x' },
          { source_table: 'b', date: '2025-01-02', summary: 'y' },
          { source_table: 'c', date: '2025-01-03', summary: 'z' },
        ],
      },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await callHandler(controller.createMemory, req, res, next);

    // confidence = min(0.3 + 3 * 0.1, 0.9) = 0.6
    const insertCall = mockQuery.mock.calls[0];
    const values = insertCall[1] as unknown[];
    expect(values[7]).toBeCloseTo(0.6, 5); // confidence param
  });

  it('caps confidence at 0.8 for AI source', async () => {
    const req = createAuthReq({}, {
      body: {
        ...validBody,
        source: 'ai',
        evidence: [
          { source_table: 'a', date: '2025-01-01', summary: 'x' },
          { source_table: 'b', date: '2025-01-02', summary: 'y' },
          { source_table: 'c', date: '2025-01-03', summary: 'z' },
          { source_table: 'd', date: '2025-01-04', summary: 'w' },
          { source_table: 'e', date: '2025-01-05', summary: 'v' },
          { source_table: 'f', date: '2025-01-06', summary: 'u' },
        ],
      },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await callHandler(controller.createMemory, req, res, next);

    const insertCall = mockQuery.mock.calls[0];
    const values = insertCall[1] as unknown[];
    // min(0.3 + 6 * 0.1, 0.8) = min(0.9, 0.8) = 0.8
    expect(values[7]).toBeCloseTo(0.8, 5);
  });

  it('rejects AI source with fewer than 3 evidence items', async () => {
    const req = createAuthReq({}, {
      body: {
        ...validBody,
        source: 'ai',
        evidence: [
          { source_table: 'a', date: '2025-01-01', summary: 'x' },
          { source_table: 'b', date: '2025-01-02', summary: 'y' },
        ],
      },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.createMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('at least 3');
  });

  it('rejects invalid Zod body (missing required fields)', async () => {
    const req = createAuthReq({}, { body: { title: 'only title' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.createMemory, req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════
// updateMemory
// ═══════════════════════════════════════════════
describe('updateMemory', () => {
  it('updates title only', async () => {
    const req = createAuthReq({}, { params: { id: 'mem-1' }, body: { title: 'Updated title' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ title: 'Updated title' })]));

    await callHandler(controller.updateMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.data.memory.title).toBe('Updated title');
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('title = $');
  });

  it('updates multiple fields simultaneously', async () => {
    const req = createAuthReq({}, {
      params: { id: 'mem-1' },
      body: { title: 'New', description: 'Desc', structuredData: { key: 'val' } },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ title: 'New' })]));

    await callHandler(controller.updateMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('title = $');
    expect(sql).toContain('description = $');
    expect(sql).toContain('structured_data = $');
  });

  it('returns 400 when no updatable fields provided', async () => {
    const req = createAuthReq({}, { params: { id: 'mem-1' }, body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.updateMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('returns 404 when memory not found for update', async () => {
    const req = createAuthReq({}, { params: { id: 'gone' }, body: { title: 'X' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.updateMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { params: { id: 'mem-1' }, body: { title: 'X' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.updateMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════
// verifyMemory
// ═══════════════════════════════════════════════
describe('verifyMemory', () => {
  it('verifies a memory and inserts feedback record', async () => {
    const req = createAuthReq({}, { params: { id: 'mem-1' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ status: 'verified' })]));
    mockQuery.mockResolvedValueOnce(pgResult([])); // feedback INSERT

    await callHandler(controller.verifyMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);

    // Verify UPDATE query included confidence bump
    const updateSql = mockQuery.mock.calls[0][0] as string;
    expect(updateSql).toContain("status = 'verified'");
    expect(updateSql).toContain('confidence + 0.15');

    // Verify feedback INSERT
    const feedbackCall = mockQuery.mock.calls[1];
    expect(feedbackCall[0]).toContain('intelligence_feedback');
    expect(feedbackCall[0]).toContain('verify');
  });

  it('returns 404 when memory not found or not verifiable', async () => {
    const req = createAuthReq({}, { params: { id: 'nonexistent' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.verifyMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { params: { id: 'mem-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.verifyMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════
// rejectMemory
// ═══════════════════════════════════════════════
describe('rejectMemory', () => {
  it('rejects a memory with a reason', async () => {
    const req = createAuthReq({}, { params: { id: 'mem-1' }, body: { reason: 'Inaccurate data' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ status: 'rejected' })]));
    mockQuery.mockResolvedValueOnce(pgResult([])); // feedback INSERT

    await callHandler(controller.rejectMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);

    const updateSql = mockQuery.mock.calls[0][0] as string;
    expect(updateSql).toContain("status = 'rejected'");
    expect(updateSql).toContain('rejection_reason');
  });

  it('rejects a memory without a reason (optional)', async () => {
    const req = createAuthReq({}, { params: { id: 'mem-1' }, body: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ status: 'rejected' })]));
    mockQuery.mockResolvedValueOnce(pgResult([])); // feedback

    await callHandler(controller.rejectMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
  });

  it('creates a corrected memory when correction is provided', async () => {
    const req = createAuthReq({}, {
      params: { id: 'mem-1' },
      body: { reason: 'Wrong', correction: 'User actually prefers evening runs' },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ status: 'rejected' })]));
    mockQuery.mockResolvedValueOnce(pgResult([])); // feedback INSERT
    mockQuery.mockResolvedValueOnce(pgResult([])); // correction INSERT

    await callHandler(controller.rejectMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(3);
    const correctionSql = mockQuery.mock.calls[2][0] as string;
    expect(correctionSql).toContain('INSERT INTO intelligence_memories');
    const correctionParams = mockQuery.mock.calls[2][1] as string[];
    expect(JSON.stringify(correctionParams)).toContain('user_correction');
  });

  it('returns 404 when memory not found or already rejected', async () => {
    const req = createAuthReq({}, { params: { id: 'gone' }, body: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.rejectMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════
// expireMemory
// ═══════════════════════════════════════════════
describe('expireMemory', () => {
  it('expires a memory successfully', async () => {
    const req = createAuthReq({}, { params: { id: 'mem-1' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow({ status: 'expired' })]));

    await callHandler(controller.expireMemory, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    const updateSql = mockQuery.mock.calls[0][0] as string;
    expect(updateSql).toContain("status = 'expired'");
    expect(updateSql).toContain('expires_at = NOW()');
  });

  it('returns 404 when memory not found', async () => {
    const req = createAuthReq({}, { params: { id: 'gone' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.expireMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { params: { id: 'mem-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.expireMemory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════
// searchMemories
// ═══════════════════════════════════════════════
describe('searchMemories', () => {
  it('searches memories by query string', async () => {
    const req = createAuthReq({}, { query: { q: 'morning' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await callHandler(controller.searchMemories, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.memories).toHaveLength(1);

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('ILIKE');
    const values = mockQuery.mock.calls[0][1] as unknown[];
    expect(values).toContain('%morning%');
  });

  it('applies category filter when provided', async () => {
    const req = createAuthReq({}, { query: { q: 'run', category: 'fitness' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeMemoryRow()]));

    await callHandler(controller.searchMemories, req, res, next);

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('category = $');
  });

  it('defaults limit to 10', async () => {
    const req = createAuthReq({}, { query: { q: 'test' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.searchMemories, req, res, next);

    const values = mockQuery.mock.calls[0][1] as unknown[];
    expect(values[values.length - 1]).toBe(10); // last param = limit
  });

  it('respects custom limit', async () => {
    const req = createAuthReq({}, { query: { q: 'test', limit: '25' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.searchMemories, req, res, next);

    const values = mockQuery.mock.calls[0][1] as unknown[];
    expect(values[values.length - 1]).toBe(25);
  });

  it('rejects empty query string via Zod validation', async () => {
    const req = createAuthReq({}, { query: { q: '' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.searchMemories, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns empty array when no results match', async () => {
    const req = createAuthReq({}, { query: { q: 'nonexistent-xyzzy' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.searchMemories, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.data.memories).toEqual([]);
  });

  it('orders results by confidence DESC then updated_at DESC', async () => {
    const req = createAuthReq({}, { query: { q: 'run' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.searchMemories, req, res, next);

    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('ORDER BY confidence DESC, updated_at DESC');
  });
});

// ═══════════════════════════════════════════════
// getCoreProfile
// ═══════════════════════════════════════════════
describe('getCoreProfile', () => {
  it('returns grouped core profile from service', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    const mockProfile = {
      biometrics: [{ key: 'weight_kg', value: 75 }],
      targets: [{ key: 'daily_calories', value: 2000 }],
      calibration: { overallConfidence: 0.85, completeness: 0.6 },
    };
    mockCoreProfileKernelService.getProfile.mockResolvedValueOnce(mockProfile);

    await callHandler(controller.getCoreProfile, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.profile).toEqual(mockProfile);
    expect(mockCoreProfileKernelService.getProfile).toHaveBeenCalledWith('test-user-id');
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getCoreProfile, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('returns empty profile when no data exists', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockCoreProfileKernelService.getProfile.mockResolvedValueOnce({
      biometrics: [], targets: [], constraints: [], preferences: [], medical: [], lifestyle: [],
      calibration: { overallConfidence: 0, completeness: 0, fieldsCovered: 0, fieldsExpected: 15, missingHighImpact: [] },
    });

    await callHandler(controller.getCoreProfile, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.profile.biometrics).toEqual([]);
  });
});

// ═══════════════════════════════════════════════
// getCoreProfileSection
// ═══════════════════════════════════════════════
describe('getCoreProfileSection', () => {
  it('returns entries for a valid section', async () => {
    const req = createAuthReq({}, { params: { section: 'biometrics' } });
    const res = createRes();
    const next = createNext();

    const entries = [{ key: 'weight_kg', value: 75, unit: 'kg' }];
    mockCoreProfileKernelService.getProfileSection.mockResolvedValueOnce(entries);

    await callHandler(controller.getCoreProfileSection, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.data.entries).toEqual(entries);
    expect(mockCoreProfileKernelService.getProfileSection).toHaveBeenCalledWith('test-user-id', 'biometrics');
  });

  it('rejects invalid section via Zod validation', async () => {
    const req = createAuthReq({}, { params: { section: 'invalid_section' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.getCoreProfileSection, req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════
// updateCoreValue
// ═══════════════════════════════════════════════
describe('updateCoreValue', () => {
  it('updates a core value via service (insert/upsert)', async () => {
    const req = createAuthReq({}, {
      params: { section: 'biometrics', key: 'weight_kg' },
      body: { value: 80, unit: 'kg' },
    });
    const res = createRes();
    const next = createNext();

    const updatedEntry = { key: 'weight_kg', value: 80, unit: 'kg' };
    mockCoreProfileKernelService.updateValue.mockResolvedValueOnce(updatedEntry);

    await callHandler(controller.updateCoreValue, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.data.entry).toEqual(updatedEntry);
    expect(mockCoreProfileKernelService.updateValue).toHaveBeenCalledWith(
      'test-user-id', 'biometrics', 'weight_kg', 80, 'kg'
    );
  });

  it('updates value without unit (optional)', async () => {
    const req = createAuthReq({}, {
      params: { section: 'preferences', key: 'coaching_style' },
      body: { value: 'supportive' },
    });
    const res = createRes();
    const next = createNext();

    mockCoreProfileKernelService.updateValue.mockResolvedValueOnce({ key: 'coaching_style', value: 'supportive' });

    await callHandler(controller.updateCoreValue, req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockCoreProfileKernelService.updateValue).toHaveBeenCalledWith(
      'test-user-id', 'preferences', 'coaching_style', 'supportive', undefined
    );
  });

  it('rejects invalid section enum', async () => {
    const req = createAuthReq({}, {
      params: { section: 'not_a_section', key: 'foo' },
      body: { value: 123 },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.updateCoreValue, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, {
      params: { section: 'biometrics', key: 'weight_kg' },
      body: { value: 80 },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.updateCoreValue, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════
// listArtifacts
// ═══════════════════════════════════════════════
describe('listArtifacts', () => {
  it('returns paginated artifacts with default params', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeArtifactRow()]));

    await callHandler(controller.listArtifacts, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.artifacts).toHaveLength(1);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
  });

  it('filters by artifactType', async () => {
    const req = createAuthReq({}, { query: { artifactType: 'chart' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeArtifactRow()]));

    await callHandler(controller.listArtifacts, req, res, next);

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain('artifact_type = $');
  });

  it('filters by tag', async () => {
    const req = createAuthReq({}, { query: { tag: 'steps' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeArtifactRow()]));

    await callHandler(controller.listArtifacts, req, res, next);

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain('ANY(tags)');
  });

  it('returns empty list with correct pagination meta', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listArtifacts, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.artifacts).toEqual([]);
    expect(body.meta.total).toBe(0);
    expect(body.meta.totalPages).toBe(0);
  });

  it('maps snake_case artifact rows to camelCase', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeArtifactRow()]));

    await callHandler(controller.listArtifacts, req, res, next);

    const body = getJsonBody(res);
    const art = body.data.artifacts[0];
    expect(art).toHaveProperty('artifactType');
    expect(art).toHaveProperty('chartConfig');
    expect(art).toHaveProperty('isPinned');
    expect(art).toHaveProperty('isArchived');
    expect(art).not.toHaveProperty('artifact_type');
  });

  it('orders by is_pinned DESC then updated_at DESC', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listArtifacts, req, res, next);

    const dataSql = mockQuery.mock.calls[1][0] as string;
    expect(dataSql).toContain('ORDER BY is_pinned DESC, updated_at DESC');
  });
});

// ═══════════════════════════════════════════════
// getArtifact
// ═══════════════════════════════════════════════
describe('getArtifact', () => {
  it('returns a single artifact by id', async () => {
    const req = createAuthReq({}, { params: { id: 'art-1' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeArtifactRow()]));

    await callHandler(controller.getArtifact, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.data.artifact.id).toBe('art-1');
  });

  it('returns 404 when artifact not found', async () => {
    const req = createAuthReq({}, { params: { id: 'gone' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.getArtifact, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════
// updateArtifact
// ═══════════════════════════════════════════════
describe('updateArtifact', () => {
  it('pins an artifact', async () => {
    const req = createAuthReq({}, { params: { id: 'art-1' }, body: { isPinned: true } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([makeArtifactRow({ is_pinned: true })]));

    await callHandler(controller.updateArtifact, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('is_pinned = $');
  });

  it('returns 404 when artifact not found for update', async () => {
    const req = createAuthReq({}, { params: { id: 'gone' }, body: { isPinned: true } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.updateArtifact, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════
// listPlans
// ═══════════════════════════════════════════════
describe('listPlans', () => {
  it('returns non-archived plans ordered by pinned and status', async () => {
    const planRow = {
      id: 'plan-1', user_id: 'test-user-id', plan_type: 'workout',
      title: 'Weekly Workout', description: 'A weekly plan',
      plan_data: { phases: [] }, current_phase: null, version: 1,
      adaptation_log: [], adherence_rate: 0.8, status: 'active',
      starts_at: null, ends_at: null, last_adapted_at: null,
      source: 'ai', memory_ids_used: [], goal_ids: [],
      is_pinned: false, is_archived: false,
      created_at: NOW, updated_at: NOW,
    };
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([planRow]));

    await callHandler(controller.listPlans, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.data.plans).toHaveLength(1);
    expect(body.data.plans[0]).toHaveProperty('planType');
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.listPlans, req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════
// getPlan
// ═══════════════════════════════════════════════
describe('getPlan', () => {
  it('returns a single plan by id', async () => {
    const planRow = {
      id: 'plan-1', user_id: 'test-user-id', plan_type: 'nutrition',
      title: 'Meal Plan', description: null,
      plan_data: {}, current_phase: 'week1', version: 2,
      adaptation_log: [], adherence_rate: 0.9, status: 'active',
      starts_at: null, ends_at: null, last_adapted_at: NOW,
      source: 'user', memory_ids_used: [], goal_ids: [],
      is_pinned: true, is_archived: false,
      created_at: NOW, updated_at: NOW,
    };
    const req = createAuthReq({}, { params: { id: 'plan-1' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([planRow]));

    await callHandler(controller.getPlan, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.data.plan.id).toBe('plan-1');
    expect(body.data.plan.planType).toBe('nutrition');
  });

  it('returns 404 when plan not found', async () => {
    const req = createAuthReq({}, { params: { id: 'gone' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.getPlan, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════
// listLogs
// ═══════════════════════════════════════════════
describe('listLogs', () => {
  it('returns paginated logs with default params', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeLogRow()]));

    await callHandler(controller.listLogs, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.logs).toHaveLength(1);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(30);
  });

  it('filters by category', async () => {
    const req = createAuthReq({}, { query: { category: 'nutrition' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listLogs, req, res, next);

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain('category = $');
  });

  it('filters by date range (startDate and endDate)', async () => {
    const req = createAuthReq({}, { query: { startDate: '2025-06-01', endDate: '2025-06-30' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '3' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeLogRow(), makeLogRow({ id: 'log-2' }), makeLogRow({ id: 'log-3' })]));

    await callHandler(controller.listLogs, req, res, next);

    const countSql = mockQuery.mock.calls[0][0] as string;
    expect(countSql).toContain('source_date >= $');
    expect(countSql).toContain('source_date <= $');
    const values = mockQuery.mock.calls[0][1] as unknown[];
    expect(values).toContain('2025-06-01');
    expect(values).toContain('2025-06-30');
  });

  it('returns empty list when no logs exist', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listLogs, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.logs).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it('maps log rows to camelCase', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([makeLogRow()]));

    await callHandler(controller.listLogs, req, res, next);

    const body = getJsonBody(res);
    const log = body.data.logs[0];
    expect(log).toHaveProperty('sourceTable');
    expect(log).toHaveProperty('sourceId');
    expect(log).toHaveProperty('sourceDate');
    expect(log).toHaveProperty('memoryIds');
    expect(log).toHaveProperty('artifactIds');
    expect(log).not.toHaveProperty('source_table');
  });

  it('orders logs by source_date DESC then created_at DESC', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ total: '0' }]));
    mockQuery.mockResolvedValueOnce(pgEmpty());

    await callHandler(controller.listLogs, req, res, next);

    const dataSql = mockQuery.mock.calls[1][0] as string;
    expect(dataSql).toContain('ORDER BY source_date DESC, created_at DESC');
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.listLogs, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════
// submitFeedback
// ═══════════════════════════════════════════════
describe('submitFeedback', () => {
  const validFeedback = {
    targetType: 'memory',
    targetId: '11111111-1111-1111-1111-111111111111',
    action: 'verify',
    comment: 'Looks accurate',
  };

  it('submits feedback and returns 201', async () => {
    const req = createAuthReq({}, { body: validFeedback });
    const res = createRes();
    const next = createNext();

    const feedbackRow = {
      id: 'fb-1',
      user_id: 'test-user-id',
      target_type: 'memory',
      target_id: validFeedback.targetId,
      action: 'verify',
      correction_data: null,
      comment: 'Looks accurate',
      created_at: NOW,
    };
    mockQuery.mockResolvedValueOnce(pgResult([feedbackRow]));

    await callHandler(controller.submitFeedback, req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.feedback).toBeDefined();
  });

  it('submits feedback with correctionData', async () => {
    const req = createAuthReq({}, {
      body: {
        ...validFeedback,
        action: 'correct',
        correctionData: { correctedValue: 'evening runs' },
      },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'fb-2' }]));

    await callHandler(controller.submitFeedback, req, res, next);

    expect(next).not.toHaveBeenCalled();
    const insertValues = mockQuery.mock.calls[0][1] as unknown[];
    // correctionData should be stringified JSON
    expect(insertValues[4]).toBe(JSON.stringify({ correctedValue: 'evening runs' }));
  });

  it('rejects invalid feedback body (missing targetType)', async () => {
    const req = createAuthReq({}, { body: { targetId: 'xxx', action: 'verify' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.submitFeedback, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid targetId (not UUID)', async () => {
    const req = createAuthReq({}, { body: { targetType: 'memory', targetId: 'not-a-uuid', action: 'verify' } });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.submitFeedback, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any }, { body: validFeedback });
    const res = createRes();
    const next = createNext();

    await callHandler(controller.submitFeedback, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
