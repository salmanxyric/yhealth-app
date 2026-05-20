import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();

vi.mock('../../config/database.config.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

vi.mock('../logger.service.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { memoryEngineService } = await import('../memory-engine.service.js');

describe('memoryEngineService.findSimilarMemories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns matching memories by title similarity within category', async () => {
    // First call: hasMemoryTable check (cache may or may not be set from prior runs)
    // Mock both to be safe; extra resolved values are ignored.
    mockQuery
      .mockResolvedValueOnce({ rows: [{ exists: true }] }) // hasMemoryTable
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'mem-1',
            user_id: 'user-1',
            title: 'Morning workout preference',
            description: 'User prefers morning workouts',
            category: 'fitness',
            memory_type: 'preference',
            confidence: 0.8,
            evidence_count: 3,
            evidence: [],
            min_evidence: 3,
            source: 'ai',
            kg_node_ids: [],
            related_memory_ids: [],
            status: 'active',
            verified_at: null,
            rejected_at: null,
            rejection_reason: null,
            superseded_by: null,
            last_accessed_at: new Date(),
            access_count: 5,
            decay_rate: 0.01,
            expires_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            structured_data: {},
            subcategory: null,
          },
        ],
      });

    const result = await memoryEngineService.findSimilarMemories(
      'user-1',
      'fitness',
      'morning workout'
    );

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Morning workout preference');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('intelligence_memories'),
      expect.arrayContaining(['user-1', 'fitness'])
    );
  });

  it('returns empty array when no matches found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await memoryEngineService.findSimilarMemories(
      'user-1',
      'fitness',
      'something unrelated'
    );

    expect(result).toHaveLength(0);
  });

  it('returns empty array when memory table is missing', async () => {
    mockQuery.mockRejectedValueOnce(
      Object.assign(new Error('relation "intelligence_memories" does not exist'), { code: '42P01' })
    );

    const result = await memoryEngineService.findSimilarMemories(
      'user-1',
      'fitness',
      'morning workout'
    );

    expect(result).toHaveLength(0);
  });
});
