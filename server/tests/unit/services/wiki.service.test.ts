/**
 * Wiki Service Unit Tests
 *
 * Tests CRUD operations, search, link management, versioning,
 * stats aggregation, orphan detection, and helper functions.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockDbQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockDbQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { wikiService, extractDomainSlugs, extractKeywords } = await import('../../../src/services/wiki.service.js');

// ============================================
// HELPERS
// ============================================

function makePageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'page-1',
    user_id: 'user-1',
    slug: 'fitness-profile',
    page_type: 'pattern',
    category: 'fitness',
    title: 'Fitness Profile',
    summary: 'User fitness patterns',
    body: 'User works out 4x per week.',
    frontmatter: {},
    confidence: 0.7,
    evidence_count: 5,
    word_count: 7,
    status: 'active',
    version: 1,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-02T00:00:00Z'),
    last_lint_at: null,
    stale_after_days: 30,
    ...overrides,
  };
}

function makeLinkRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'link-1',
    user_id: 'user-1',
    source_page_id: 'page-1',
    target_page_id: 'page-2',
    source_slug: 'fitness-profile',
    source_title: 'Fitness Profile',
    target_slug: 'nutrition-profile',
    target_title: 'Nutrition Profile',
    link_type: 'reference',
    context: 'Related domains',
    anchor_text: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeVersionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ver-1',
    page_id: 'page-1',
    version: 1,
    title: 'Fitness Profile',
    summary: 'User fitness patterns',
    body: 'Original body content.',
    frontmatter: {},
    confidence: 0.6,
    evidence_count: 3,
    change_reason: 'Initial creation',
    trigger_type: null,
    trigger_id: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('WikiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // CREATE
  // ------------------------------------------

  describe('createPage', () => {
    it('should insert a new wiki page with computed word count', async () => {
      const row = makePageRow();
      mockDbQuery.mockResolvedValue({ rows: [row] });

      const page = await wikiService.createPage('user-1', {
        slug: 'fitness-profile',
        pageType: 'pattern',
        category: 'fitness',
        title: 'Fitness Profile',
        summary: 'User fitness patterns',
        body: 'User works out 4x per week.',
      });

      expect(page.slug).toBe('fitness-profile');
      expect(page.pageType).toBe('pattern');
      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wiki_pages'),
        expect.arrayContaining(['user-1', 'fitness-profile']),
      );
    });

    it('should add sources when provided', async () => {
      const row = makePageRow();
      mockDbQuery
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await wikiService.createPage('user-1', {
        slug: 'fitness-profile',
        pageType: 'pattern',
        category: 'fitness',
        title: 'Fitness Profile',
        summary: 'Test',
        body: 'Test body content here.',
        sources: [{
          sourceType: 'activity',
          sourceId: 'batch-1',
          sourceTable: 'workout_logs',
          rowCount: 10,
        }],
      });

      expect(mockDbQuery).toHaveBeenCalledTimes(3);
      expect(mockDbQuery.mock.calls[1][0]).toContain('wiki_page_sources');
    });

    it('should default confidence to 0.5 when not provided', async () => {
      const row = makePageRow({ confidence: 0.5 });
      mockDbQuery.mockResolvedValue({ rows: [row] });

      const page = await wikiService.createPage('user-1', {
        slug: 'test-page',
        pageType: 'concept',
        category: 'health',
        title: 'Test',
        summary: 'Test',
        body: 'Test body.',
      });

      expect(page.confidence).toBe(0.5);
    });
  });

  // ------------------------------------------
  // READ
  // ------------------------------------------

  describe('getPage', () => {
    it('should return page with outbound and inbound links', async () => {
      const pageRow = makePageRow();
      const outboundLink = makeLinkRow();
      const inboundLink = makeLinkRow({ id: 'link-2', source_page_id: 'page-3', target_page_id: 'page-1' });

      mockDbQuery
        .mockResolvedValueOnce({ rows: [pageRow] })
        .mockResolvedValueOnce({ rows: [outboundLink] })
        .mockResolvedValueOnce({ rows: [inboundLink] });

      const result = await wikiService.getPage('user-1', 'fitness-profile');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('fitness-profile');
      expect(result!.outboundLinks).toHaveLength(1);
      expect(result!.inboundLinks).toHaveLength(1);
    });

    it('should return null for nonexistent page', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await wikiService.getPage('user-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // ------------------------------------------
  // UPDATE
  // ------------------------------------------

  describe('updatePage', () => {
    it('should save version snapshot before updating', async () => {
      const currentRow = makePageRow();
      const updatedRow = makePageRow({ version: 2, title: 'Updated Title' });

      mockDbQuery
        .mockResolvedValueOnce({ rows: [currentRow] })
        .mockResolvedValueOnce({ rows: [] }) // version snapshot insert
        .mockResolvedValueOnce({ rows: [updatedRow] }); // update

      const page = await wikiService.updatePage('user-1', 'fitness-profile', {
        title: 'Updated Title',
        changeReason: 'Title improvement',
      });

      expect(page.version).toBe(2);
      expect(mockDbQuery).toHaveBeenCalledTimes(3);
      expect(mockDbQuery.mock.calls[1][0]).toContain('wiki_page_versions');
    });

    it('should throw when page not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await expect(
        wikiService.updatePage('user-1', 'nonexistent', { changeReason: 'test' })
      ).rejects.toThrow('Wiki page not found: nonexistent');
    });

    it('should update word count when body changes', async () => {
      const currentRow = makePageRow();
      const updatedRow = makePageRow({ word_count: 10, version: 2 });

      mockDbQuery
        .mockResolvedValueOnce({ rows: [currentRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      await wikiService.updatePage('user-1', 'fitness-profile', {
        body: 'This is a new body with more words in it.',
        changeReason: 'Body update',
      });

      const updateSql = mockDbQuery.mock.calls[2][0] as string;
      expect(updateSql).toContain('word_count');
    });

    it('should update confidence when provided', async () => {
      const currentRow = makePageRow();
      const updatedRow = makePageRow({ confidence: 0.9, version: 2 });

      mockDbQuery
        .mockResolvedValueOnce({ rows: [currentRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      const page = await wikiService.updatePage('user-1', 'fitness-profile', {
        confidence: 0.9,
        changeReason: 'Confidence bump',
      });

      expect(page.confidence).toBe(0.9);
    });

    it('should update status when provided', async () => {
      const currentRow = makePageRow();
      const updatedRow = makePageRow({ status: 'stale', version: 2 });

      mockDbQuery
        .mockResolvedValueOnce({ rows: [currentRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [updatedRow] });

      const page = await wikiService.updatePage('user-1', 'fitness-profile', {
        status: 'stale',
        changeReason: 'Marked stale',
      });

      expect(page.status).toBe('stale');
    });
  });

  // ------------------------------------------
  // ARCHIVE
  // ------------------------------------------

  describe('archivePage', () => {
    it('should set status to archived', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      await wikiService.archivePage('user-1', 'fitness-profile');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'archived'"),
        ['user-1', 'fitness-profile'],
      );
    });

    it('should throw when page not found', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      await expect(
        wikiService.archivePage('user-1', 'nonexistent')
      ).rejects.toThrow('Wiki page not found: nonexistent');
    });
  });

  // ------------------------------------------
  // LIST
  // ------------------------------------------

  describe('listPages', () => {
    it('should return paginated results with total count', async () => {
      const rows = [makePageRow()];

      mockDbQuery
        .mockResolvedValueOnce({ rows })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const result = await wikiService.listPages('user-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by pageType', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await wikiService.listPages('user-1', { pageType: 'pattern' });

      const sql = mockDbQuery.mock.calls[0][0] as string;
      expect(sql).toContain('page_type');
    });

    it('should filter by category', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await wikiService.listPages('user-1', { category: 'fitness' });

      const sql = mockDbQuery.mock.calls[0][0] as string;
      expect(sql).toContain('category');
    });

    it('should filter by status and exclude archived by default', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await wikiService.listPages('user-1', {});

      const sql = mockDbQuery.mock.calls[0][0] as string;
      expect(sql).toContain("status != 'archived'");
    });

    it('should filter by minConfidence', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await wikiService.listPages('user-1', { minConfidence: 0.8 });

      const sql = mockDbQuery.mock.calls[0][0] as string;
      expect(sql).toContain('confidence');
    });
  });

  // ------------------------------------------
  // SEARCH
  // ------------------------------------------

  describe('searchPages', () => {
    it('should search by domain keyword routing and keyword matching', async () => {
      const row = { ...makePageRow(), similarity: 2.0 };
      mockDbQuery.mockResolvedValue({ rows: [row] });

      const results = await wikiService.searchPages('user-1', 'fitness workout');

      expect(results).toHaveLength(1);
      expect(results[0].page.slug).toBe('fitness-profile');
      expect(results[0].similarity).toBe(2.0);
      const sql = mockDbQuery.mock.calls[0][0] as string;
      expect(sql).toContain('slug = ANY');
      expect(sql).toContain('unnest');
    });

    it('should exclude archived pages by default', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await wikiService.searchPages('user-1', 'test');

      const sql = mockDbQuery.mock.calls[0][0] as string;
      expect(sql).toContain("status != 'archived'");
    });

    it('should limit results to specified limit', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await wikiService.searchPages('user-1', 'test', { limit: 5 });

      const params = mockDbQuery.mock.calls[0][1] as unknown[];
      expect(params[params.length - 1]).toBe(5);
    });

    it('should return empty array when no matches', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const results = await wikiService.searchPages('user-1', 'nonexistent query');

      expect(results).toHaveLength(0);
    });
  });

  // ------------------------------------------
  // LINKS
  // ------------------------------------------

  describe('createLink', () => {
    it('should resolve slugs and create link', async () => {
      const slugMap = [
        { slug: 'fitness-profile', id: 'page-1' },
        { slug: 'nutrition-profile', id: 'page-2' },
      ];
      const linkRow = makeLinkRow();

      mockDbQuery
        .mockResolvedValueOnce({ rows: slugMap })
        .mockResolvedValueOnce({ rows: [linkRow] });

      const link = await wikiService.createLink('user-1', {
        sourceSlug: 'fitness-profile',
        targetSlug: 'nutrition-profile',
        linkType: 'reference',
        context: 'Related domains',
      });

      expect(link.linkType).toBe('reference');
    });

    it('should throw when source slug is not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ slug: 'nutrition-profile', id: 'page-2' }] });

      await expect(
        wikiService.createLink('user-1', {
          sourceSlug: 'nonexistent',
          targetSlug: 'nutrition-profile',
          linkType: 'reference',
        })
      ).rejects.toThrow('Source page not found: nonexistent');
    });

    it('should throw when target slug is not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [{ slug: 'fitness-profile', id: 'page-1' }] });

      await expect(
        wikiService.createLink('user-1', {
          sourceSlug: 'fitness-profile',
          targetSlug: 'nonexistent',
          linkType: 'reference',
        })
      ).rejects.toThrow('Target page not found: nonexistent');
    });
  });

  describe('getLinks', () => {
    it('should return outbound and inbound links', async () => {
      const outLink = makeLinkRow();
      const inLink = makeLinkRow({ id: 'link-2' });

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: 'page-1' }] })
        .mockResolvedValueOnce({ rows: [outLink] })
        .mockResolvedValueOnce({ rows: [inLink] });

      const links = await wikiService.getLinks('user-1', 'fitness-profile');

      expect(links.outbound).toHaveLength(1);
      expect(links.inbound).toHaveLength(1);
    });

    it('should throw when page not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await expect(
        wikiService.getLinks('user-1', 'nonexistent')
      ).rejects.toThrow('Wiki page not found: nonexistent');
    });
  });

  describe('getOrphans', () => {
    it('should return pages with no inbound links', async () => {
      mockDbQuery.mockResolvedValue({ rows: [makePageRow()] });

      const orphans = await wikiService.getOrphans('user-1');

      expect(orphans).toHaveLength(1);
      expect(orphans[0].slug).toBe('fitness-profile');
    });
  });

  // ------------------------------------------
  // VERSIONING
  // ------------------------------------------

  describe('getVersions', () => {
    it('should return version history for a page', async () => {
      const versionRow = makeVersionRow();
      mockDbQuery.mockResolvedValue({ rows: [versionRow] });

      const versions = await wikiService.getVersions('user-1', 'fitness-profile');

      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe(1);
      expect(versions[0].changeReason).toBe('Initial creation');
    });
  });

  describe('getVersion', () => {
    it('should return specific version', async () => {
      const versionRow = makeVersionRow();
      mockDbQuery.mockResolvedValue({ rows: [versionRow] });

      const version = await wikiService.getVersion('user-1', 'fitness-profile', 1);

      expect(version).not.toBeNull();
      expect(version!.version).toBe(1);
    });

    it('should return null for nonexistent version', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const version = await wikiService.getVersion('user-1', 'fitness-profile', 999);

      expect(version).toBeNull();
    });
  });

  // ------------------------------------------
  // LOG
  // ------------------------------------------

  describe('logOperation', () => {
    it('should insert log entry', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      await wikiService.logOperation('user-1', {
        operation: 'update',
        summary: 'Test operation',
        pagesTouched: 1,
      });

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wiki_log'),
        expect.arrayContaining(['user-1', 'update', 'Test operation']),
      );
    });
  });

  describe('getLog', () => {
    it('should return recent log entries', async () => {
      const logRow = {
        id: 'log-1',
        user_id: 'user-1',
        operation: 'update',
        page_ids: ['page-1'],
        source_type: null,
        source_id: null,
        conversation_id: null,
        summary: 'Test log',
        details: {},
        pages_touched: 1,
        created_at: new Date(),
      };
      mockDbQuery.mockResolvedValue({ rows: [logRow] });

      const entries = await wikiService.getLog('user-1');

      expect(entries).toHaveLength(1);
      expect(entries[0].operation).toBe('update');
    });
  });

  // ------------------------------------------
  // STATS
  // ------------------------------------------

  describe('getStats', () => {
    it('should return comprehensive stats', async () => {
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ exists: true }] })
        .mockResolvedValueOnce({ rows: [{ total: '10', active: '8', stale: '1', contradicted: '1' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ page_type: 'pattern', count: '4' }, { page_type: 'concept', count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ category: 'fitness', count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ last_ingest: new Date(), last_lint: new Date() }] });

      const stats = await wikiService.getStats('user-1');

      expect(stats.totalPages).toBe(10);
      expect(stats.activePages).toBe(8);
      expect(stats.stalePages).toBe(1);
      expect(stats.contradictedPages).toBe(1);
      expect(stats.totalLinks).toBe(5);
      expect(stats.totalSources).toBe(3);
    });

    it('should return empty stats when wiki table does not exist', async () => {
      // The wikiTableExistsCache may already be true from the previous test,
      // so hasWikiTable() won't query again. Instead, the Promise.all queries
      // fire and we simulate a 42P01 (table missing) error on one of them,
      // which is caught by the try/catch in getStats and returns emptyStats().
      const tableError = new Error('relation "wiki_pages" does not exist');
      (tableError as Error & { code?: string }).code = '42P01';
      mockDbQuery.mockRejectedValueOnce(tableError);

      const stats = await wikiService.getStats('user-1');

      expect(stats.totalPages).toBe(0);
      expect(stats.activePages).toBe(0);
    });
  });

  // ------------------------------------------
  // HELPERS
  // ------------------------------------------

  describe('parseWikiLinks', () => {
    it('should extract [[slug]] links from body text', () => {
      const body = 'Check out [[fitness-profile]] and also [[nutrition-profile]] for context.';
      const links = wikiService.parseWikiLinks(body);

      expect(links).toEqual(['fitness-profile', 'nutrition-profile']);
    });

    it('should deduplicate repeated links', () => {
      const body = 'See [[fitness-profile]] and [[fitness-profile]] again.';
      const links = wikiService.parseWikiLinks(body);

      expect(links).toEqual(['fitness-profile']);
    });

    it('should return empty array when no links found', () => {
      const body = 'No wiki links here.';
      const links = wikiService.parseWikiLinks(body);

      expect(links).toEqual([]);
    });

    it('should handle trimming whitespace in slugs', () => {
      const body = 'See [[ fitness-profile ]] here.';
      const links = wikiService.parseWikiLinks(body);

      expect(links).toEqual(['fitness-profile']);
    });
  });

  describe('countWords', () => {
    it('should count words in a string', () => {
      expect(wikiService.countWords('Hello world')).toBe(2);
    });

    it('should handle multiple spaces', () => {
      expect(wikiService.countWords('Hello   world   test')).toBe(3);
    });

    it('should return 0 for empty string', () => {
      expect(wikiService.countWords('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(wikiService.countWords('   ')).toBe(0);
    });
  });

  describe('resolveLinks', () => {
    it('should resolve slugs to page IDs', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [
          { slug: 'fitness-profile', id: 'page-1' },
          { slug: 'nutrition-profile', id: 'page-2' },
        ],
      });

      const map = await wikiService.resolveLinks('user-1', ['fitness-profile', 'nutrition-profile']);

      expect(map.get('fitness-profile')).toBe('page-1');
      expect(map.get('nutrition-profile')).toBe('page-2');
    });

    it('should return empty map for empty input', async () => {
      const map = await wikiService.resolveLinks('user-1', []);

      expect(map.size).toBe(0);
    });
  });

  // ------------------------------------------
  // SEARCH HELPERS
  // ------------------------------------------

  describe('extractDomainSlugs', () => {
    it('should map meal-related text to nutrition-profile', () => {
      const slugs = extractDomainSlugs('I had 1 omelette and 2 rotis for breakfast');
      expect(slugs).toContain('nutrition-profile');
    });

    it('should map exercise text to fitness-profile', () => {
      const slugs = extractDomainSlugs('I went for a run this morning');
      expect(slugs).toContain('fitness-profile');
    });

    it('should return multiple slugs for multi-domain text', () => {
      const slugs = extractDomainSlugs('After my workout I ate chicken and rice');
      expect(slugs).toContain('fitness-profile');
      expect(slugs).toContain('nutrition-profile');
    });

    it('should return empty array for unrelated text', () => {
      const slugs = extractDomainSlugs('hello how are you');
      expect(slugs).toHaveLength(0);
    });
  });

  describe('extractKeywords', () => {
    it('should strip stop words and return meaningful tokens', () => {
      const kw = extractKeywords('I had 1 omelette and 2 rotis for breakfast');
      expect(kw).toContain('omelette');
      expect(kw).toContain('rotis');
      expect(kw).toContain('breakfast');
      expect(kw).not.toContain('and');
      expect(kw).not.toContain('for');
    });

    it('should lowercase all tokens', () => {
      const kw = extractKeywords('Running in the Morning');
      expect(kw).toContain('running');
      expect(kw).toContain('morning');
    });

    it('should filter tokens shorter than 3 chars', () => {
      const kw = extractKeywords('I am ok at it');
      expect(kw).toHaveLength(0);
    });
  });

  // ------------------------------------------
  // ADD SOURCES
  // ------------------------------------------

  describe('addSources', () => {
    it('should insert sources and sync evidence_count on wiki_pages', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] }); // INSERT sources
      mockDbQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE evidence_count

      await wikiService.addSources('page-1', [
        { sourceType: 'conversation', sourceId: 'conv-1', sourceTable: 'rag_messages', extractSummary: 'test' },
      ]);

      expect(mockDbQuery).toHaveBeenCalledTimes(2);

      // Second call should be the evidence_count sync
      const syncCall = mockDbQuery.mock.calls[1];
      expect(syncCall[0]).toContain('UPDATE wiki_pages');
      expect(syncCall[0]).toContain('evidence_count');
      expect(syncCall[1]).toEqual(['page-1']);
    });

    it('should skip when sources array is empty', async () => {
      await wikiService.addSources('page-1', []);
      expect(mockDbQuery).not.toHaveBeenCalled();
    });
  });
});
