/**
 * Intelligence Files API Integration Tests
 *
 * Tests the HTTP layer for the Intelligence Files sub-module mounted at
 * /api/v1/intelligence/files. Verifies status codes, response shapes, header
 * correctness, validation, and not-found handling across all 17 endpoints.
 *
 * Uses mock-db (no real database) with a lightweight Express harness that
 * mounts only the intelligence-files routes + error middleware, avoiding
 * the full app bootstrap and its 90+ transitive route imports.
 *
 * Endpoints:
 *   GET    /folders
 *   GET    /memories
 *   GET    /memories/search
 *   GET    /memories/:id
 *   POST   /memories
 *   PATCH  /memories/:id
 *   POST   /memories/:id/verify
 *   POST   /memories/:id/reject
 *   POST   /memories/:id/expire
 *   GET    /core
 *   PATCH  /core/:section/:key
 *   GET    /artifacts
 *   GET    /artifacts/:id
 *   PATCH  /artifacts/:id
 *   GET    /plans
 *   GET    /logs
 *   POST   /feedback
 *
 * Total: 28 test cases
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../helpers/mock-services.js';

// ============================================
// INFRASTRUCTURE MOCKS (before any dynamic imports)
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── env mock — only fields used by the controller + error middleware ─
jest.unstable_mockModule('../../src/config/env.config.js', () => ({
  env: {
    nodeEnv: 'test',
    isProduction: false,
    isDevelopment: true,
    isTest: true,
    api: { prefix: '/api', version: 'v1' },
  },
  default: { nodeEnv: 'test', isProduction: false },
}));

// ── Core profile kernel service mock ────────────────────────────
const mockCoreProfileKernel = {
  getProfile: jest.fn<any>().mockResolvedValue({
    biometrics: [],
    targets: [],
    constraints: [],
    preferences: [],
    medical: [],
    lifestyle: [],
    calibration: { score: 0.5, missingFields: [] },
  }),
  getProfileSection: jest.fn<any>().mockResolvedValue([]),
  updateValue: jest.fn<any>().mockResolvedValue({
    id: 'core-1',
    userId: 'test-user-id',
    section: 'biometrics',
    key: 'weight_kg',
    value: 75,
    unit: 'kg',
    confidence: 0.9,
    calibratedAt: new Date().toISOString(),
    dataPointsUsed: 5,
    source: 'user',
    previousValues: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
};
jest.unstable_mockModule('../../src/services/core-profile-kernel.service.js', () => ({
  coreProfileKernelService: mockCoreProfileKernel,
}));

// ============================================
// DYNAMIC IMPORTS (after all mocks are registered)
// ============================================

const express = (await import('express')).default;
const supertest = (await import('supertest')).default;
const { pgResult, pgEmpty } = await import('../helpers/factories.js');

// Import only the pieces we need — no full app bootstrap
const intelligenceFilesRoutes = (await import('../../src/routes/intelligence-files.routes.js')).default;
const { errorHandler } = await import('../../src/middlewares/error.middleware.js');

// ============================================
// LIGHTWEIGHT EXPRESS HARNESS
// ============================================

function buildTestApp() {
  const app = express();
  app.use(express.json());

  // Inject a test user on every request (simulates authenticate middleware)
  app.use((req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-id', email: 'test@test.com', role: 'user' };
    next();
  });

  // Mount the routes at the same path used in production
  app.use('/api/v1/intelligence/files', intelligenceFilesRoutes);

  // Error middleware (handles ApiError, ZodError, etc.)
  app.use(errorHandler);

  return app;
}

const app = buildTestApp();
const request = supertest(app);

const BASE = '/api/v1/intelligence/files';

// ============================================
// HELPERS
// ============================================

const NOW = new Date();

function makeMemoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mem-001',
    user_id: 'test-user-id',
    memory_type: 'pattern',
    category: 'fitness',
    subcategory: null,
    title: 'Morning workout preference',
    description: 'User consistently works out in the morning',
    structured_data: {},
    confidence: 0.75,
    evidence_count: 4,
    evidence: [
      { source_table: 'activity_events', source_id: 'evt-1', date: '2025-01-15', summary: 'Morning run' },
      { source_table: 'activity_events', source_id: 'evt-2', date: '2025-01-16', summary: 'Gym session' },
      { source_table: 'activity_events', source_id: 'evt-3', date: '2025-01-17', summary: 'Yoga class' },
      { source_table: 'activity_events', source_id: 'evt-4', date: '2025-01-18', summary: 'HIIT workout' },
    ],
    min_evidence: 3,
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
    id: 'art-001',
    user_id: 'test-user-id',
    artifact_type: 'chart',
    title: 'Weekly Activity Chart',
    description: 'Activity over the past 7 days',
    chart_config: { type: 'bar' },
    data: [],
    insight: 'You were most active on Wednesday',
    generated_by: 'intelligence_engine',
    trigger_message_id: null,
    conversation_id: null,
    analysis_id: null,
    memory_ids_used: [],
    data_sources: ['activity_events'],
    is_pinned: false,
    is_archived: false,
    tags: ['fitness', 'weekly'],
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makePlanRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-001',
    user_id: 'test-user-id',
    plan_type: 'workout',
    title: 'Morning Routine Plan',
    description: 'A structured 4-week morning workout plan',
    plan_data: { weeks: 4 },
    current_phase: 'week_1',
    version: 1,
    adaptation_log: [],
    adherence_rate: 0.85,
    status: 'active',
    starts_at: null,
    ends_at: null,
    last_adapted_at: null,
    source: 'ai',
    memory_ids_used: [],
    goal_ids: [],
    is_pinned: false,
    is_archived: false,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeLogRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-001',
    user_id: 'test-user-id',
    source_table: 'activity_events',
    source_id: 'evt-abc',
    source_date: '2025-01-15',
    summary: 'Completed 45-minute run',
    category: 'fitness',
    memory_ids: [],
    artifact_ids: [],
    created_at: NOW,
    ...overrides,
  };
}

function makeFolderCountRow(count: number | string, lastModified: Date | null = NOW) {
  return { count: String(count), last_modified: lastModified };
}

// ============================================
// TESTS
// ============================================

describe('Intelligence Files API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  // FOLDERS
  // ──────────────────────────────────────────

  describe('GET /folders', () => {
    it('should return 200 with folder summaries', async () => {
      // The controller fires 6 parallel COUNT queries
      mockQuery
        .mockResolvedValueOnce(pgResult([makeFolderCountRow(5)]))   // memories
        .mockResolvedValueOnce(pgResult([makeFolderCountRow(2)]))   // artifacts
        .mockResolvedValueOnce(pgResult([makeFolderCountRow(1)]))   // plans
        .mockResolvedValueOnce(pgResult([makeFolderCountRow(3)]))   // core
        .mockResolvedValueOnce(pgResult([makeFolderCountRow(10)])) // logs
        .mockResolvedValueOnce(pgResult([makeFolderCountRow(0, null)])); // notes

      const res = await request.get(`${BASE}/folders`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.folders).toHaveLength(6);

      const ids = res.body.data.folders.map((f: any) => f.id);
      expect(ids).toEqual(expect.arrayContaining(['memories', 'artifacts', 'plans', 'core', 'logs', 'notes']));

      const memories = res.body.data.folders.find((f: any) => f.id === 'memories');
      expect(memories.itemCount).toBe(5);
    });

    it('should handle empty database (all counts zero)', async () => {
      for (let i = 0; i < 6; i++) {
        mockQuery.mockResolvedValueOnce(pgResult([makeFolderCountRow(0, null)]));
      }

      const res = await request.get(`${BASE}/folders`).expect(200);

      expect(res.body.success).toBe(true);
      for (const folder of res.body.data.folders) {
        expect(folder.itemCount).toBe(0);
      }
    });
  });

  // ──────────────────────────────────────────
  // MEMORIES
  // ──────────────────────────────────────────

  describe('GET /memories', () => {
    it('should return 200 with paginated memories and meta', async () => {
      const row = makeMemoryRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([{ total: '1' }]))   // count query
        .mockResolvedValueOnce(pgResult([row]));              // data query

      const res = await request.get(`${BASE}/memories`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memories).toHaveLength(1);
      expect(res.body.data.memories[0]).toHaveProperty('id', 'mem-001');
      expect(res.body.data.memories[0]).toHaveProperty('memoryType', 'pattern');
      expect(res.body.data.memories[0]).toHaveProperty('confidence');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should support category filter', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ total: '0' }]))
        .mockResolvedValueOnce(pgResult([]));

      const res = await request
        .get(`${BASE}/memories?category=nutrition`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memories).toHaveLength(0);

      // Verify category was passed in the SQL via mockQuery call args
      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('category');
      expect(countCall[1]).toContain('nutrition');
    });

    it('should support minConfidence filter', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ total: '0' }]))
        .mockResolvedValueOnce(pgResult([]));

      const res = await request
        .get(`${BASE}/memories?minConfidence=0.8`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const countCall = mockQuery.mock.calls[0];
      expect(countCall[0]).toContain('confidence');
      expect(countCall[1]).toContain(0.8);
    });
  });

  describe('GET /memories/:id', () => {
    it('should return 200 with a single memory', async () => {
      const row = makeMemoryRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([row]))   // SELECT query
        .mockResolvedValueOnce(pgResult([]));       // UPDATE access query

      const res = await request.get(`${BASE}/memories/mem-001`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memory.id).toBe('mem-001');
      expect(res.body.data.memory.title).toBe('Morning workout preference');
    });

    it('should return 404 when memory does not exist', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const res = await request.get(`${BASE}/memories/nonexistent`).expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /memories', () => {
    const validBody = {
      memoryType: 'pattern',
      category: 'fitness',
      title: 'Prefers morning runs',
      description: 'Consistent 6am jog pattern across multiple weeks',
      evidence: [
        { source_table: 'activity_events', date: '2025-01-15', summary: 'Morning run at 6am' },
        { source_table: 'activity_events', date: '2025-01-16', summary: 'Morning run at 6:15am' },
        { source_table: 'activity_events', date: '2025-01-17', summary: 'Morning run at 5:50am' },
      ],
    };

    it('should return 201 when creating a memory with valid body', async () => {
      const insertedRow = makeMemoryRow({
        id: 'mem-new-001',
        title: 'Prefers morning runs',
        description: 'Consistent 6am jog pattern across multiple weeks',
        source: 'user',
      });
      mockQuery.mockResolvedValueOnce(pgResult([insertedRow]));

      const res = await request
        .post(`${BASE}/memories`)
        .send(validBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memory).toHaveProperty('id');
      expect(res.body.data.memory.title).toBe('Prefers morning runs');
    });

    it('should return error when title is missing', async () => {
      const { title: _title, ...bodyWithoutTitle } = validBody;

      const res = await request
        .post(`${BASE}/memories`)
        .send(bodyWithoutTitle);

      // Zod validation error propagated through error middleware
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should return error when evidence array is empty', async () => {
      const res = await request
        .post(`${BASE}/memories`)
        .send({ ...validBody, evidence: [] });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /memories/:id', () => {
    it('should return 200 when updating memory fields', async () => {
      const updatedRow = makeMemoryRow({ title: 'Updated title' });
      mockQuery.mockResolvedValueOnce(pgResult([updatedRow]));

      const res = await request
        .patch(`${BASE}/memories/mem-001`)
        .send({ title: 'Updated title' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memory.title).toBe('Updated title');
    });

    it('should return 404 when memory does not exist', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const res = await request
        .patch(`${BASE}/memories/nonexistent`)
        .send({ title: 'Will not work' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when no fields to update', async () => {
      const res = await request
        .patch(`${BASE}/memories/mem-001`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /memories/:id/verify', () => {
    it('should return 200 when verifying a memory', async () => {
      const verifiedRow = makeMemoryRow({ status: 'verified', verified_at: NOW });
      mockQuery
        .mockResolvedValueOnce(pgResult([verifiedRow]))  // UPDATE returning *
        .mockResolvedValueOnce(pgResult([]));              // INSERT feedback

      const res = await request
        .post(`${BASE}/memories/mem-001/verify`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memory.status).toBe('verified');
    });

    it('should return 404 when memory is not found or not verifiable', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const res = await request
        .post(`${BASE}/memories/nonexistent/verify`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /memories/:id/reject', () => {
    it('should return 200 when rejecting a memory with reason', async () => {
      const rejectedRow = makeMemoryRow({ status: 'rejected', rejected_at: NOW, rejection_reason: 'Inaccurate' });
      mockQuery
        .mockResolvedValueOnce(pgResult([rejectedRow]))  // UPDATE returning *
        .mockResolvedValueOnce(pgResult([]));              // INSERT feedback

      const res = await request
        .post(`${BASE}/memories/mem-001/reject`)
        .send({ reason: 'Inaccurate' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memory.status).toBe('rejected');
    });

    it('should return 404 when memory is not found or already rejected', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const res = await request
        .post(`${BASE}/memories/nonexistent/reject`)
        .send({})
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /memories/:id/expire', () => {
    it('should return 200 when expiring a memory', async () => {
      const expiredRow = makeMemoryRow({ status: 'expired', expires_at: NOW });
      mockQuery.mockResolvedValueOnce(pgResult([expiredRow]));

      const res = await request
        .post(`${BASE}/memories/mem-001/expire`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memory.status).toBe('expired');
    });

    it('should return 404 when memory is not found', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const res = await request
        .post(`${BASE}/memories/nonexistent/expire`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /memories/search', () => {
    it('should return 200 with search results', async () => {
      const row = makeMemoryRow();
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const res = await request
        .get(`${BASE}/memories/search?q=morning`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.memories).toHaveLength(1);
      expect(res.body.data.memories[0].id).toBe('mem-001');
    });

    it('should return error when q parameter is missing', async () => {
      const res = await request.get(`${BASE}/memories/search`);

      // Zod requires `q` min length 1
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────
  // CORE PROFILE
  // ──────────────────────────────────────────

  describe('GET /core', () => {
    it('should return 200 with core profile', async () => {
      mockCoreProfileKernel.getProfile.mockResolvedValueOnce({
        biometrics: [],
        targets: [],
        constraints: [],
        preferences: [],
        medical: [],
        lifestyle: [],
        calibration: { score: 0.5, missingFields: [] },
      });

      const res = await request.get(`${BASE}/core`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('profile');
      expect(res.body.data.profile).toHaveProperty('calibration');
    });
  });

  describe('PATCH /core/:section/:key', () => {
    it('should return 200 when updating a core value', async () => {
      mockCoreProfileKernel.updateValue.mockResolvedValueOnce({
        id: 'core-1',
        userId: 'test-user-id',
        section: 'biometrics',
        key: 'weight_kg',
        value: 75,
        unit: 'kg',
        confidence: 0.9,
        calibratedAt: new Date().toISOString(),
        dataPointsUsed: 5,
        source: 'user',
        previousValues: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request
        .patch(`${BASE}/core/biometrics/weight_kg`)
        .send({ value: 75, unit: 'kg' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.entry).toHaveProperty('id');
      expect(res.body.data.entry.section).toBe('biometrics');
      expect(res.body.data.entry.key).toBe('weight_kg');

      expect(mockCoreProfileKernel.updateValue).toHaveBeenCalledWith(
        'test-user-id', 'biometrics', 'weight_kg', 75, 'kg'
      );
    });
  });

  // ──────────────────────────────────────────
  // ARTIFACTS
  // ──────────────────────────────────────────

  describe('GET /artifacts', () => {
    it('should return 200 with paginated artifacts', async () => {
      const row = makeArtifactRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([{ total: '1' }]))
        .mockResolvedValueOnce(pgResult([row]));

      const res = await request.get(`${BASE}/artifacts`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.artifacts).toHaveLength(1);
      expect(res.body.data.artifacts[0]).toHaveProperty('artifactType', 'chart');
      expect(res.body.data.artifacts[0]).toHaveProperty('title', 'Weekly Activity Chart');
      expect(res.body.meta).toHaveProperty('total', 1);
    });
  });

  describe('GET /artifacts/:id', () => {
    it('should return 200 with a single artifact', async () => {
      const row = makeArtifactRow();
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const res = await request.get(`${BASE}/artifacts/art-001`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.artifact.id).toBe('art-001');
    });

    it('should return 404 when artifact does not exist', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const res = await request.get(`${BASE}/artifacts/nonexistent`).expect(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /artifacts/:id', () => {
    it('should return 200 when updating artifact tags', async () => {
      const updatedRow = makeArtifactRow({ tags: ['new-tag'] });
      mockQuery.mockResolvedValueOnce(pgResult([updatedRow]));

      const res = await request
        .patch(`${BASE}/artifacts/art-001`)
        .send({ tags: ['new-tag'] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.artifact.tags).toEqual(['new-tag']);
    });
  });

  // ──────────────────────────────────────────
  // PLANS
  // ──────────────────────────────────────────

  describe('GET /plans', () => {
    it('should return 200 with plans list', async () => {
      const row = makePlanRow();
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const res = await request.get(`${BASE}/plans`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plans).toHaveLength(1);
      expect(res.body.data.plans[0]).toHaveProperty('planType', 'workout');
      expect(res.body.data.plans[0]).toHaveProperty('title', 'Morning Routine Plan');
    });

    it('should return empty array when no plans exist', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const res = await request.get(`${BASE}/plans`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plans).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────
  // LOGS
  // ──────────────────────────────────────────

  describe('GET /logs', () => {
    it('should return 200 with paginated logs', async () => {
      const row = makeLogRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([{ total: '1' }]))
        .mockResolvedValueOnce(pgResult([row]));

      const res = await request.get(`${BASE}/logs`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.logs).toHaveLength(1);
      expect(res.body.data.logs[0]).toHaveProperty('sourceTable', 'activity_events');
      expect(res.body.data.logs[0]).toHaveProperty('category', 'fitness');
      expect(res.body.meta).toHaveProperty('total', 1);
    });
  });

  // ──────────────────────────────────────────
  // FEEDBACK
  // ──────────────────────────────────────────

  describe('POST /feedback', () => {
    it('should return 201 when submitting valid feedback', async () => {
      const feedbackRow = {
        id: 'fb-001',
        user_id: 'test-user-id',
        target_type: 'memory',
        target_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        action: 'verify',
        correction_data: null,
        comment: 'This is accurate',
        created_at: NOW,
      };
      mockQuery.mockResolvedValueOnce(pgResult([feedbackRow]));

      const res = await request
        .post(`${BASE}/feedback`)
        .send({
          targetType: 'memory',
          targetId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          action: 'verify',
          comment: 'This is accurate',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.feedback).toHaveProperty('id', 'fb-001');
    });

    it('should return error when required fields are missing', async () => {
      const res = await request
        .post(`${BASE}/feedback`)
        .send({ comment: 'Missing targetType and targetId' });

      // Zod validation should reject
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should return error when targetId is not a valid UUID', async () => {
      const res = await request
        .post(`${BASE}/feedback`)
        .send({
          targetType: 'memory',
          targetId: 'not-a-uuid',
          action: 'verify',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});
