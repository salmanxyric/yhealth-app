import { jest } from '@jest/globals';

// ============================================
// MOCKS (must be before dynamic import)
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const mockMarkStalePages = jest.fn<any>();
const mockRebuildIndex = jest.fn<any>();
const mockGetOrphans = jest.fn<any>();
const mockLogOperation = jest.fn<any>();

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/services/wiki-index.service.js', () => ({
  wikiIndexService: {
    markStalePages: mockMarkStalePages,
    rebuildIndex: mockRebuildIndex,
  },
}));

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: {
    getOrphans: mockGetOrphans,
    logOperation: mockLogOperation,
  },
}));

const { wikiLintService } = await import('../../../src/services/wiki-lint.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[], rowCount = rows.length) {
  return { rows, rowCount, command: 'SELECT', oid: 0, fields: [] };
}

// ============================================
// TESTS
// ============================================

describe('WikiLintService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default happy-path mocks
    mockMarkStalePages.mockResolvedValue(0);
    mockGetOrphans.mockResolvedValue([]);
    mockQuery.mockResolvedValue(pgResult([]));
    mockRebuildIndex.mockResolvedValue({
      pageCount: 0,
      countsByType: {},
      countsByCategory: {},
      orphanCount: 0,
      staleCount: 0,
      contradictedCount: 0,
    });
    mockLogOperation.mockResolvedValue(undefined);
  });

  it('should mark stale pages and return count', async () => {
    mockMarkStalePages.mockResolvedValue(3);

    const result = await wikiLintService.lintUser('user-1');

    expect(mockMarkStalePages).toHaveBeenCalledWith('user-1');
    expect(result.staleMarked).toBe(3);
  });

  it('should detect orphan pages', async () => {
    const orphans = [
      { id: 'p1', slug: 'orphan-1' },
      { id: 'p2', slug: 'orphan-2' },
    ];
    mockGetOrphans.mockResolvedValue(orphans);

    const result = await wikiLintService.lintUser('user-1');

    expect(mockGetOrphans).toHaveBeenCalledWith('user-1');
    expect(result.orphansFound).toBe(2);
  });

  it('should detect broken links', async () => {
    const brokenLinks = [
      { id: 'link-1', source_slug: 'page-a', target_slug: null },
      { id: 'link-2', source_slug: 'page-b', target_slug: 'archived-page' },
      { id: 'link-3', source_slug: 'page-c', target_slug: null },
    ];
    mockQuery.mockResolvedValue(pgResult(brokenLinks));

    const result = await wikiLintService.lintUser('user-1');

    expect(result.brokenLinks).toBe(3);

    // Verify the SQL query targets wiki_links with LEFT JOIN
    const sql: string = mockQuery.mock.calls[0][0];
    expect(sql).toContain('wiki_links');
    expect(sql).toContain('LEFT JOIN');
    expect(sql).toContain('wiki_pages');

    // Verify user_id is passed as parameter
    expect(mockQuery.mock.calls[0][1]).toContain('user-1');
  });

  it('should rebuild index after lint', async () => {
    await wikiLintService.lintUser('user-1');

    expect(mockRebuildIndex).toHaveBeenCalledWith('user-1');

    // Verify rebuildIndex is called (order: markStale -> getOrphans -> query -> rebuildIndex)
    // rebuildIndex should be called regardless of lint results
    expect(mockRebuildIndex).toHaveBeenCalledTimes(1);
  });

  it('should log lint operation when issues found', async () => {
    mockMarkStalePages.mockResolvedValue(2);
    mockGetOrphans.mockResolvedValue([{ id: 'p1', slug: 'orphan-1' }]);
    mockQuery.mockResolvedValue(pgResult([{ id: 'link-1', source_slug: 'a', target_slug: null }]));

    await wikiLintService.lintUser('user-1');

    expect(mockLogOperation).toHaveBeenCalledWith('user-1', expect.objectContaining({
      operation: 'lint',
      pagesTouched: 2,
    }));
    // summary should be a string describing the lint results
    const logCall = mockLogOperation.mock.calls[0][1];
    expect(typeof logCall.summary).toBe('string');
    expect(logCall.summary.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully (markStalePages throws, still continues)', async () => {
    mockMarkStalePages.mockRejectedValue(new Error('DB timeout'));

    const result = await wikiLintService.lintUser('user-1');

    // Error should be counted
    expect(result.errors).toBe(1);
    // staleMarked should be 0 since it failed
    expect(result.staleMarked).toBe(0);
    // Other steps should still have run
    expect(mockGetOrphans).toHaveBeenCalledWith('user-1');
    expect(mockRebuildIndex).toHaveBeenCalledWith('user-1');
    // Logger should have warned about the error
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
