/**
 * Wiki Lint Service — Expanded Unit Tests
 *
 * Tests the full lint pipeline: stale marking, orphan detection,
 * broken link detection, index rebuild, and error resilience.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockDbQuery = jest.fn<any>();
const mockGetOrphans = jest.fn<any>();
const mockLogOperation = jest.fn<any>();
const mockRebuildIndex = jest.fn<any>();
const mockMarkStalePages = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockDbQuery,
}));

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: {
    getOrphans: mockGetOrphans,
    logOperation: mockLogOperation,
  },
}));

jest.unstable_mockModule('../../../src/services/wiki-index.service.js', () => ({
  wikiIndexService: {
    markStalePages: mockMarkStalePages,
    rebuildIndex: mockRebuildIndex,
  },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { wikiLintService } = await import('../../../src/services/wiki-lint.service.js');

// ============================================
// TESTS
// ============================================

describe('WikiLintService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarkStalePages.mockResolvedValue(0);
    mockGetOrphans.mockResolvedValue([]);
    mockDbQuery.mockResolvedValue({ rows: [] });
    mockRebuildIndex.mockResolvedValue({});
    mockLogOperation.mockResolvedValue(undefined);
  });

  describe('lintUser — happy path', () => {
    it('should run all 5 lint steps successfully', async () => {
      mockMarkStalePages.mockResolvedValue(2);
      mockGetOrphans.mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]);
      mockDbQuery.mockResolvedValue({ rows: [{ id: 'broken-1' }] });

      const result = await wikiLintService.lintUser('user-1');

      expect(result.staleMarked).toBe(2);
      expect(result.orphansFound).toBe(3);
      expect(result.brokenLinks).toBe(1);
      expect(result.errors).toBe(0);
    });

    it('should log operation when issues are found', async () => {
      mockMarkStalePages.mockResolvedValue(1);
      mockGetOrphans.mockResolvedValue([{ id: '1' }]);
      mockDbQuery.mockResolvedValue({ rows: [] });

      await wikiLintService.lintUser('user-1');

      expect(mockLogOperation).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          operation: 'lint',
          summary: expect.stringContaining('1 stale'),
        }),
      );
    });

    it('should not log operation when no issues found', async () => {
      const result = await wikiLintService.lintUser('user-1');

      expect(result.staleMarked).toBe(0);
      expect(result.orphansFound).toBe(0);
      expect(result.brokenLinks).toBe(0);
      expect(mockLogOperation).not.toHaveBeenCalled();
    });

    it('should rebuild index as part of lint', async () => {
      await wikiLintService.lintUser('user-1');

      expect(mockRebuildIndex).toHaveBeenCalledWith('user-1');
    });
  });

  describe('lintUser — error resilience', () => {
    it('should continue lint when markStalePages fails', async () => {
      mockMarkStalePages.mockRejectedValue(new Error('Stale check failed'));
      mockGetOrphans.mockResolvedValue([{ id: '1' }]);

      const result = await wikiLintService.lintUser('user-1');

      expect(result.staleMarked).toBe(0);
      expect(result.orphansFound).toBe(1);
      expect(result.errors).toBe(1);
    });

    it('should continue lint when getOrphans fails', async () => {
      mockGetOrphans.mockRejectedValue(new Error('Orphan check failed'));
      mockMarkStalePages.mockResolvedValue(3);

      const result = await wikiLintService.lintUser('user-1');

      expect(result.staleMarked).toBe(3);
      expect(result.orphansFound).toBe(0);
      expect(result.errors).toBe(1);
    });

    it('should continue lint when broken link detection fails', async () => {
      mockDbQuery.mockRejectedValue(new Error('Link query failed'));
      mockMarkStalePages.mockResolvedValue(1);
      mockGetOrphans.mockResolvedValue([]);

      const result = await wikiLintService.lintUser('user-1');

      expect(result.staleMarked).toBe(1);
      expect(result.brokenLinks).toBe(0);
      expect(result.errors).toBe(1);
    });

    it('should continue lint when rebuildIndex fails', async () => {
      mockRebuildIndex.mockRejectedValue(new Error('Index rebuild failed'));
      mockMarkStalePages.mockResolvedValue(1);

      const result = await wikiLintService.lintUser('user-1');

      expect(result.staleMarked).toBe(1);
      expect(result.errors).toBe(1);
    });

    it('should continue lint when logOperation fails', async () => {
      mockMarkStalePages.mockResolvedValue(1);
      mockLogOperation.mockRejectedValue(new Error('Log failed'));

      const result = await wikiLintService.lintUser('user-1');

      expect(result.staleMarked).toBe(1);
      expect(result.errors).toBe(1);
    });

    it('should accumulate all errors when multiple steps fail', async () => {
      mockMarkStalePages.mockRejectedValue(new Error('Step 1 failed'));
      mockGetOrphans.mockRejectedValue(new Error('Step 2 failed'));
      mockDbQuery.mockRejectedValue(new Error('Step 3 failed'));
      mockRebuildIndex.mockRejectedValue(new Error('Step 4 failed'));

      const result = await wikiLintService.lintUser('user-1');

      expect(result.errors).toBe(4);
      expect(result.staleMarked).toBe(0);
      expect(result.orphansFound).toBe(0);
      expect(result.brokenLinks).toBe(0);
    });
  });

  describe('lintUser — broken links', () => {
    it('should detect links pointing to archived or missing pages', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [
          { id: 'link-1', source_slug: 'fitness-profile', target_slug: null },
          { id: 'link-2', source_slug: 'nutrition-profile', target_slug: null },
        ],
      });

      const result = await wikiLintService.lintUser('user-1');

      expect(result.brokenLinks).toBe(2);
    });
  });
});
