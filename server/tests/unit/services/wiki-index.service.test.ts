import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { wikiIndexService } = await import('../../../src/services/wiki-index.service.js');

function pgResult<T>(rows: T[], rowCount = rows.length) {
  return { rows, rowCount, command: 'SELECT', oid: 0, fields: [] };
}

describe('wikiIndexService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rebuildIndex', () => {
    it('should compute page counts by type and category', async () => {
      // Mock 6 count queries + 1 upsert = 7 calls total
      // Query 1: total page count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '42' }]));
      // Query 2: counts by page_type
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { page_type: 'entity', count: '15' },
          { page_type: 'concept', count: '10' },
          { page_type: 'pattern', count: '8' },
        ])
      );
      // Query 3: counts by category
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { category: 'health', count: '20' },
          { category: 'nutrition', count: '12' },
        ])
      );
      // Query 4: orphan count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '5' }]));
      // Query 5: stale count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '3' }]));
      // Query 6: contradicted count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '2' }]));
      // Query 7: upsert wiki_index
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'index-1', user_id: 'user-1' }]));

      const stats = await wikiIndexService.rebuildIndex('user-1');

      expect(stats.pageCount).toBe(42);
      expect(stats.countsByType).toEqual({ entity: 15, concept: 10, pattern: 8 });
      expect(stats.countsByCategory).toEqual({ health: 20, nutrition: 12 });
      expect(stats.orphanCount).toBe(5);
      expect(stats.staleCount).toBe(3);
      expect(stats.contradictedCount).toBe(2);

      // Verify all 7 queries were called
      expect(mockQuery).toHaveBeenCalledTimes(7);

      // Verify the upsert targets wiki_index table
      const upsertCall = mockQuery.mock.calls[6];
      expect(upsertCall[0]).toContain('wiki_index');
      expect(upsertCall[0]).toContain('ON CONFLICT');
      expect(upsertCall[1]).toContain('user-1');
    });

    it('should return zeroed stats and log error when query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      const stats = await wikiIndexService.rebuildIndex('user-1');

      expect(stats.pageCount).toBe(0);
      expect(stats.countsByType).toEqual({});
      expect(stats.countsByCategory).toEqual({});
      expect(stats.orphanCount).toBe(0);
      expect(stats.staleCount).toBe(0);
      expect(stats.contradictedCount).toBe(0);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('rebuildIndex'),
        expect.objectContaining({ error: 'DB connection failed' })
      );
    });
  });

  describe('markStalePages', () => {
    it('should mark pages as stale when last updated exceeds stale_after_days', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { id: 'page-1', slug: 'my-diet-plan' },
          { id: 'page-2', slug: 'exercise-routine' },
        ])
      );

      const count = await wikiIndexService.markStalePages('user-1');

      expect(count).toBe(2);

      // Verify the SQL uses stale_after_days
      const sql: string = mockQuery.mock.calls[0][0];
      expect(sql).toContain('stale_after_days');
      expect(sql).toContain('stale');
      expect(sql).toContain('RETURNING');

      // Verify user_id is passed as parameter
      expect(mockQuery.mock.calls[0][1]).toContain('user-1');
    });

    it('should return 0 and not log when no pages are stale', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const count = await wikiIndexService.markStalePages('user-1');

      expect(count).toBe(0);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
