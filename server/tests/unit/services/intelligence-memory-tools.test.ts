/**
 * Intelligence Memory Tools Unit Tests
 *
 * Tests for `registerIntelligenceMemoryTools` from the intelligence-memory
 * LangGraph tools domain. This module exposes three tools that let the AI
 * coach search, create, and inspect user memories stored in the intelligence
 * layer.
 *
 * Covers:
 *   A. Registration — tool count, names, schemas, mutationType, icon
 *   B. searchUserMemories — service delegation, mapping, defaults, errors
 *   C. createUserMemory — evidence forwarding, response shape, semanticDelta, errors
 *   D. getMemoryEvidence — lookup, not-found, error handling
 *
 * Total: 22 test cases
 */

import { jest } from '@jest/globals';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS (before any service imports)
// ============================================

setupLoggerMock();

const mockGetMemoriesForContext = jest.fn<any>();
const mockCreateMemory = jest.fn<any>();
const mockGetActiveMemories = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: {
    getMemoriesForContext: mockGetMemoriesForContext,
    createMemory: mockCreateMemory,
    getActiveMemories: mockGetActiveMemories,
  },
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { registerIntelligenceMemoryTools } = await import(
  '../../../src/services/langgraph-tools/domains/intelligence-memory.js'
);

// ============================================
// HELPERS
// ============================================

const USER_ID = 'u-test-mem-001';

function makeMemoryResult(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mem-001',
    memoryType: 'pattern',
    category: 'fitness',
    title: 'Morning workout preference',
    description: 'User consistently works out between 6-8am',
    confidence: 0.75,
    evidenceCount: 4,
    source: 'ai',
    status: 'active',
    evidence: [
      { source_table: 'activity_events', source_id: 'evt-1', date: '2025-01-15', summary: 'Morning run at 6:30am' },
      { source_table: 'activity_events', source_id: 'evt-2', date: '2025-01-16', summary: 'Gym session at 7:00am' },
      { source_table: 'activity_events', source_id: 'evt-3', date: '2025-01-17', summary: 'Morning yoga at 6:45am' },
      { source_table: 'activity_events', source_id: 'evt-4', date: '2025-01-18', summary: 'HIIT at 7:15am' },
    ],
    lastAccessedAt: '2025-01-20T12:00:00Z',
    ...overrides,
  };
}

function makeEvidence(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    source_table: 'activity_events',
    source_id: `evt-${i + 1}`,
    date: '2025-01-15',
    summary: `Evidence item ${i + 1}`,
  }));
}

/**
 * Look up a specific tool by name from the returned array.
 */
function getTool(tools: Array<{ name: string; handler: any; [k: string]: unknown }>, name: string) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
}

// ============================================
// TESTS
// ============================================

describe('registerIntelligenceMemoryTools', () => {
  let tools: ReturnType<typeof registerIntelligenceMemoryTools>;

  beforeAll(() => {
    tools = registerIntelligenceMemoryTools(USER_ID);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────
  // A. Registration
  // ──────────────────────────────────────────

  describe('Registration', () => {
    it('should return an array of exactly 3 tools', () => {
      expect(tools).toHaveLength(3);
    });

    it('should contain searchUserMemories, createUserMemory, and getMemoryEvidence', () => {
      const names = tools.map((t) => t.name);
      expect(names).toEqual(
        expect.arrayContaining(['searchUserMemories', 'createUserMemory', 'getMemoryEvidence'])
      );
    });

    it('should assign a Zod schema to every tool', () => {
      for (const tool of tools) {
        expect(tool.schema).toBeDefined();
        expect(typeof tool.schema.parse).toBe('function');
      }
    });

    it('should set mutationType to "read" for search and evidence tools', () => {
      expect(getTool(tools, 'searchUserMemories').mutationType).toBe('read');
      expect(getTool(tools, 'getMemoryEvidence').mutationType).toBe('read');
    });

    it('should set mutationType to "create" for createUserMemory', () => {
      expect(getTool(tools, 'createUserMemory').mutationType).toBe('create');
    });

    it('should define semanticDelta as a function on createUserMemory only', () => {
      const create = getTool(tools, 'createUserMemory');
      expect(typeof create.semanticDelta).toBe('function');

      // Other tools should NOT have semanticDelta
      expect(getTool(tools, 'searchUserMemories').semanticDelta).toBeUndefined();
      expect(getTool(tools, 'getMemoryEvidence').semanticDelta).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────
  // B. searchUserMemories
  // ──────────────────────────────────────────

  describe('searchUserMemories handler', () => {
    it('should return formatted memories for a valid query', async () => {
      const memories = [makeMemoryResult(), makeMemoryResult({ id: 'mem-002', title: 'Prefers protein shakes' })];
      mockGetMemoriesForContext.mockResolvedValueOnce(memories);

      const tool = getTool(tools, 'searchUserMemories');
      const raw = await tool.handler(USER_ID, { query: 'morning workout' });
      const result = JSON.parse(raw);

      expect(result.memories).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.memories[0]).toHaveProperty('id');
      expect(result.memories[0]).toHaveProperty('type');
      expect(result.memories[0]).toHaveProperty('category');
      expect(result.memories[0]).toHaveProperty('title');
      expect(result.memories[0]).toHaveProperty('confidence');
      expect(result.memories[0]).toHaveProperty('evidenceCount');
    });

    it('should return an empty-result message when no memories match', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([]);

      const tool = getTool(tools, 'searchUserMemories');
      const raw = await tool.handler(USER_ID, { query: 'nonexistent topic' });
      const result = JSON.parse(raw);

      expect(result.memories).toEqual([]);
      expect(result.message).toBe('No matching memories found');
    });

    it('should pass the correct userId and query to the service', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([]);

      const tool = getTool(tools, 'searchUserMemories');
      await tool.handler(USER_ID, { query: 'sleep quality' });

      expect(mockGetMemoriesForContext).toHaveBeenCalledWith(USER_ID, 'sleep quality', 10);
    });

    it('should use default limit of 10 when not specified', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([]);

      const tool = getTool(tools, 'searchUserMemories');
      await tool.handler(USER_ID, { query: 'hydration' });

      expect(mockGetMemoriesForContext).toHaveBeenCalledWith(USER_ID, 'hydration', 10);
    });

    it('should forward custom limit when specified', async () => {
      mockGetMemoriesForContext.mockResolvedValueOnce([]);

      const tool = getTool(tools, 'searchUserMemories');
      await tool.handler(USER_ID, { query: 'hydration', limit: 3 });

      expect(mockGetMemoriesForContext).toHaveBeenCalledWith(USER_ID, 'hydration', 3);
    });

    it('should include description, source, and status in mapped output', async () => {
      const memory = makeMemoryResult({ description: 'Loves HIIT', source: 'user', status: 'verified' });
      mockGetMemoriesForContext.mockResolvedValueOnce([memory]);

      const tool = getTool(tools, 'searchUserMemories');
      const raw = await tool.handler(USER_ID, { query: 'HIIT' });
      const result = JSON.parse(raw);

      expect(result.memories[0].source).toBe('user');
      expect(result.memories[0].status).toBe('verified');
    });

    it('should return an error response when the service throws', async () => {
      mockGetMemoriesForContext.mockRejectedValueOnce(new Error('DB connection lost'));

      const tool = getTool(tools, 'searchUserMemories');
      const raw = await tool.handler(USER_ID, { query: 'anything' });
      const result = JSON.parse(raw);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to execute searchUserMemories');
    });
  });

  // ──────────────────────────────────────────
  // C. createUserMemory
  // ──────────────────────────────────────────

  describe('createUserMemory handler', () => {
    const validInput = {
      memoryType: 'pattern' as const,
      category: 'fitness' as const,
      title: 'Prefers morning runs',
      description: 'Consistent 6am jog pattern',
      evidence: makeEvidence(3),
    };

    it('should create a memory with valid input and 3+ evidence items', async () => {
      mockCreateMemory.mockResolvedValueOnce({
        id: 'mem-new-001',
        title: 'Prefers morning runs',
        confidence: 0.6,
      });

      const tool = getTool(tools, 'createUserMemory');
      const raw = await tool.handler(USER_ID, validInput);
      const result = JSON.parse(raw);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'mem-new-001',
        title: 'Prefers morning runs',
        confidence: 0.6,
      });
    });

    it('should pass structured evidence with source "ai" to the service', async () => {
      mockCreateMemory.mockResolvedValueOnce({
        id: 'mem-new-002',
        title: 'Prefers morning runs',
        confidence: 0.6,
      });

      const tool = getTool(tools, 'createUserMemory');
      await tool.handler(USER_ID, validInput);

      expect(mockCreateMemory).toHaveBeenCalledWith(USER_ID, expect.objectContaining({
        memoryType: 'pattern',
        category: 'fitness',
        title: 'Prefers morning runs',
        source: 'ai',
        evidence: expect.arrayContaining([
          expect.objectContaining({ source_table: 'activity_events', summary: expect.any(String) }),
        ]),
      }));
    });

    it('should return a message containing the memory title and confidence', async () => {
      mockCreateMemory.mockResolvedValueOnce({
        id: 'mem-new-003',
        title: 'Evening wind-down',
        confidence: 0.55,
      });

      const tool = getTool(tools, 'createUserMemory');
      const raw = await tool.handler(USER_ID, { ...validInput, title: 'Evening wind-down' });
      const result = JSON.parse(raw);

      expect(result.message).toContain('Evening wind-down');
      expect(result.message).toContain('55%');
    });

    it('should produce a semanticDelta containing the title', () => {
      const create = getTool(tools, 'createUserMemory');
      const delta = (create.semanticDelta as (...args: unknown[]) => unknown)({ title: 'Loves protein shakes' }, {});
      expect(delta).toBe('Learned: Loves protein shakes');
    });

    it('should forward optional structuredData when provided', async () => {
      const structured = { preferred_time: '06:00-08:00', days: ['mon', 'wed', 'fri'] };
      mockCreateMemory.mockResolvedValueOnce({ id: 'mem-new-004', title: 'Morning runner', confidence: 0.7 });

      const tool = getTool(tools, 'createUserMemory');
      await tool.handler(USER_ID, { ...validInput, structuredData: structured });

      expect(mockCreateMemory).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ structuredData: structured })
      );
    });

    it('should return error response when the service throws', async () => {
      mockCreateMemory.mockRejectedValueOnce(new Error('INSERT failed'));

      const tool = getTool(tools, 'createUserMemory');
      const raw = await tool.handler(USER_ID, validInput);
      const result = JSON.parse(raw);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to execute createUserMemory');
    });
  });

  // ──────────────────────────────────────────
  // D. getMemoryEvidence
  // ──────────────────────────────────────────

  describe('getMemoryEvidence handler', () => {
    const MEMORY_ID = '11111111-1111-1111-1111-111111111111';

    it('should return full memory with evidence for a valid memoryId', async () => {
      const memory = makeMemoryResult({ id: MEMORY_ID });
      mockGetActiveMemories.mockResolvedValueOnce([memory]);

      const tool = getTool(tools, 'getMemoryEvidence');
      const raw = await tool.handler(USER_ID, { memoryId: MEMORY_ID });
      const result = JSON.parse(raw);

      expect(result.id).toBe(MEMORY_ID);
      expect(result.title).toBe('Morning workout preference');
      expect(result.confidence).toBe(0.75);
      expect(result.evidenceCount).toBe(4);
      expect(result.evidence).toHaveLength(4);
      expect(result.source).toBe('ai');
      expect(result.status).toBe('active');
      expect(result.lastAccessed).toBe('2025-01-20T12:00:00Z');
    });

    it('should return "not found" when memoryId does not exist', async () => {
      mockGetActiveMemories.mockResolvedValueOnce([
        makeMemoryResult({ id: '22222222-2222-2222-2222-222222222222' }),
      ]);

      const tool = getTool(tools, 'getMemoryEvidence');
      const raw = await tool.handler(USER_ID, { memoryId: MEMORY_ID });
      const result = JSON.parse(raw);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Memory not found');
    });

    it('should return "not found" when no active memories exist at all', async () => {
      mockGetActiveMemories.mockResolvedValueOnce([]);

      const tool = getTool(tools, 'getMemoryEvidence');
      const raw = await tool.handler(USER_ID, { memoryId: MEMORY_ID });
      const result = JSON.parse(raw);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Memory not found');
    });

    it('should call getActiveMemories with the correct userId', async () => {
      mockGetActiveMemories.mockResolvedValueOnce([]);

      const tool = getTool(tools, 'getMemoryEvidence');
      await tool.handler(USER_ID, { memoryId: MEMORY_ID });

      expect(mockGetActiveMemories).toHaveBeenCalledWith(USER_ID);
    });

    it('should return error response when the service throws', async () => {
      mockGetActiveMemories.mockRejectedValueOnce(new Error('DB timeout'));

      const tool = getTool(tools, 'getMemoryEvidence');
      const raw = await tool.handler(USER_ID, { memoryId: MEMORY_ID });
      const result = JSON.parse(raw);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to execute getMemoryEvidence');
    });
  });
});
