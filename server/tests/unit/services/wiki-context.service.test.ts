import { jest } from '@jest/globals';

const mockSearchPages = jest.fn<any>();
const mockGetPage = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: {
    searchPages: mockSearchPages,
    getPage: mockGetPage,
  },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { wikiContextService } = await import('../../../src/services/wiki-context.service.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWikiPage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'page-1',
    userId: 'user-1',
    slug: 'sleep-patterns',
    pageType: 'concept',
    category: 'health',
    title: 'Sleep Patterns',
    summary: 'User tends to sleep 6–7 hours on weekdays.',
    body: 'User typically sleeps between 11 PM and 6 AM on weekdays. Weekend sleep extends to 8–9 hours.',
    frontmatter: {},
    confidence: 0.85,
    evidenceCount: 12,
    wordCount: 22,
    status: 'active',
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    lastLintAt: null,
    staleAfterDays: 30,
    ...overrides,
  };
}

function makeSearchResult(page = makeWikiPage(), similarity = 0.9, matchContext: string | null = null) {
  return { page, similarity, matchContext };
}

function makeWikiPageWithLinks(page = makeWikiPage()) {
  return { ...page, outboundLinks: [], inboundLinks: [] };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('wikiContextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getContextForQuery', () => {
    it('should return formatted wiki context for a query', async () => {
      const page = makeWikiPage();
      const searchResult = makeSearchResult(page);
      const pageWithLinks = makeWikiPageWithLinks(page);

      mockSearchPages.mockResolvedValueOnce([searchResult]);
      mockGetPage.mockResolvedValueOnce(pageWithLinks);

      const result = await wikiContextService.getContextForQuery('user-1', 'how do I sleep better?');

      expect(result).toContain('WIKI KNOWLEDGE');
      expect(result).toContain(page.title);
      expect(result).toContain(page.summary);
      expect(mockSearchPages).toHaveBeenCalledWith('user-1', 'how do I sleep better?', { limit: 8 });
      expect(mockGetPage).toHaveBeenCalledWith('user-1', page.slug);
    });

    it('should return empty string when no wiki pages match', async () => {
      mockSearchPages.mockResolvedValueOnce([]);

      const result = await wikiContextService.getContextForQuery('user-1', 'some obscure query');

      expect(result).toBe('');
      expect(mockGetPage).not.toHaveBeenCalled();
    });

    it('should respect token budget and truncate long pages', async () => {
      const longBody = 'A'.repeat(10000);
      const page = makeWikiPage({ body: longBody });
      const searchResult = makeSearchResult(page);
      const pageWithLinks = makeWikiPageWithLinks(page);

      mockSearchPages.mockResolvedValueOnce([searchResult]);
      mockGetPage.mockResolvedValueOnce(pageWithLinks);

      const result = await wikiContextService.getContextForQuery('user-1', 'sleep', { maxTokens: 500 });

      // 500 tokens * 4 chars/token = 2000 chars max
      expect(result.length).toBeLessThan(3000);
    });
  });
});
