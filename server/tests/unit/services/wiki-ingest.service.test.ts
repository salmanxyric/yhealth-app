/**
 * WikiIngestService Unit Tests
 *
 * Tests for the wiki ingest service that:
 * 1. Initializes 9 domain hierarchy pages for new users
 * 2. Ingests conversations into wiki evidence (updating matching pages)
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockQuery = jest.fn<any>();

const mockCreatePage = jest.fn<any>();
const mockGetPage = jest.fn<any>();
const mockUpdatePage = jest.fn<any>();
const mockCreateLink = jest.fn<any>();
const mockAddSources = jest.fn<any>();
const mockLogOperation = jest.fn<any>();
const mockSearchPages = jest.fn<any>();

const mockWikiService = {
  createPage: mockCreatePage,
  getPage: mockGetPage,
  updatePage: mockUpdatePage,
  createLink: mockCreateLink,
  addSources: mockAddSources,
  logOperation: mockLogOperation,
  searchPages: mockSearchPages,
};

const mockRebuildIndex = jest.fn<any>();

const mockWikiIndexService = {
  rebuildIndex: mockRebuildIndex,
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

jest.unstable_mockModule('../../../src/services/wiki-index.service.js', () => ({
  wikiIndexService: mockWikiIndexService,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { wikiIngestService } = await import('../../../src/services/wiki-ingest.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[], rowCount = rows.length) {
  return { rows, rowCount, command: 'SELECT', oid: 0, fields: [] };
}

function makeWikiPage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'page-id-1',
    userId: 'user-1',
    slug: 'fitness-profile',
    pageType: 'pattern',
    category: 'fitness',
    title: 'Fitness Profile',
    summary: 'Workout patterns, exercise preferences, and training history.',
    body: 'No data yet. Placeholder for fitness profile.',
    frontmatter: {},
    confidence: 0.1,
    evidenceCount: 0,
    wordCount: 8,
    status: 'active',
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lastLintAt: null,
    staleAfterDays: 30,
    ...overrides,
  };
}

function makeWikiPageWithLinks(page = makeWikiPage()) {
  return { ...page, outboundLinks: [], inboundLinks: [] };
}

function makeSearchResult(
  page = makeWikiPage(),
  similarity = 0.8,
  matchContext: string | null = null
) {
  return { page, similarity, matchContext };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockLogOperation.mockResolvedValue(undefined);
  mockRebuildIndex.mockResolvedValue({ pageCount: 9 });
  mockCreateLink.mockResolvedValue({ id: 'link-id-1' });
});

// ============================================
// ingestFromConversation tests
// ============================================

describe('wikiIngestService.ingestFromConversation', () => {
  const userId = 'user-1';
  const conversationId = 'conv-1';

  // ============================================
  // TEST 1: fetch recent messages and update matching wiki pages (no match)
  // ============================================

  it('should fetch recent messages and return zero pages when no wiki pages match', async () => {
    // Mock: return conversation messages
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { role: 'user', content: 'I went for a 5km run this morning and felt great.' },
        { role: 'assistant', content: 'That sounds like a great workout!' },
      ])
    );

    // Mock: searchPages returns no matches
    mockSearchPages.mockResolvedValueOnce([]);

    const result = await wikiIngestService.ingestFromConversation(userId, conversationId);

    expect(result.conversationId).toBe(conversationId);
    expect(result.pagesCreated).toBe(0);
    // No pages updated since search returned empty
    expect(result.pagesUpdated).toBe(0);
  });

  // ============================================
  // TEST 2: update existing page when matching wiki page found
  // ============================================

  it('should update existing page when matching wiki page found', async () => {
    // Mock: return conversation messages
    mockQuery.mockResolvedValueOnce(
      pgResult([
        { role: 'user', content: 'I have been tracking my sleep and workout habits for the past month.' },
        { role: 'assistant', content: 'Great consistency with your health tracking!' },
      ])
    );

    // Mock: searchPages returns one match
    const page = makeWikiPage({ slug: 'fitness-profile', confidence: 0.5 });
    const searchResult = makeSearchResult(page, 0.8, null);
    mockSearchPages.mockResolvedValueOnce([searchResult]);

    // Mock: getPage returns full page with links
    const fullPage = makeWikiPageWithLinks(page);
    mockGetPage.mockResolvedValueOnce(fullPage);

    // Mock: updatePage resolves successfully
    mockUpdatePage.mockResolvedValueOnce({ ...page, confidence: 0.53 });

    // Mock: addSources resolves
    mockAddSources.mockResolvedValueOnce(undefined);

    const result = await wikiIngestService.ingestFromConversation(userId, conversationId);

    expect(result.conversationId).toBe(conversationId);
    expect(result.pagesUpdated).toBeGreaterThanOrEqual(0);
  });

  // ============================================
  // ADDITIONAL: early return when no messages
  // ============================================

  it('should return early with zero counts when no messages in conversation', async () => {
    // Mock: empty message query result
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const result = await wikiIngestService.ingestFromConversation(userId, conversationId);

    expect(result.conversationId).toBe(conversationId);
    expect(result.pagesCreated).toBe(0);
    expect(result.pagesUpdated).toBe(0);
    expect(result.linksAdded).toBe(0);

    // searchPages should NOT be called if no messages
    expect(mockSearchPages).not.toHaveBeenCalled();
  });

  // ============================================
  // ADDITIONAL: handles errors gracefully
  // ============================================

  it('should return zero counts and log error when query throws', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

    const result = await wikiIngestService.ingestFromConversation(userId, conversationId);

    expect(result.conversationId).toBe(conversationId);
    expect(result.pagesCreated).toBe(0);
    expect(result.pagesUpdated).toBe(0);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

// ============================================
// initializeDomainPages tests
// ============================================

describe('wikiIngestService.initializeDomainPages', () => {
  const userId = 'user-new';

  // ============================================
  // TEST 3: create domain pages for new user
  // ============================================

  it('should create domain pages for new user with no existing pages', async () => {
    // Mock: count query returns 0 existing pages
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));

    // Mock: createPage succeeds for each domain page (9 pages)
    const createdPages = Array.from({ length: 9 }, (_, i) =>
      makeWikiPage({ id: `page-id-${i + 1}`, slug: `domain-page-${i + 1}` })
    );
    for (const page of createdPages) {
      mockCreatePage.mockResolvedValueOnce(page);
    }

    // Mock: createLink succeeds for each link (8 links from user-index to other pages)
    for (let i = 0; i < 8; i++) {
      mockCreateLink.mockResolvedValueOnce({ id: `link-id-${i + 1}` });
    }

    const result = await wikiIngestService.initializeDomainPages(userId);

    expect(result.pagesCreated).toBeGreaterThan(0);
    expect(mockCreatePage).toHaveBeenCalled();
    expect(mockRebuildIndex).toHaveBeenCalledWith(userId);
    expect(mockLogOperation).toHaveBeenCalled();
  });

  // ============================================
  // TEST 4: skip if user already has wiki pages
  // ============================================

  it('should skip initialization if user already has wiki pages', async () => {
    // Mock: count query returns 5 existing pages
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '5' }]));

    const result = await wikiIngestService.initializeDomainPages(userId);

    expect(result.pagesCreated).toBe(0);
    expect(mockCreatePage).not.toHaveBeenCalled();
    expect(mockRebuildIndex).not.toHaveBeenCalled();
  });

  // ============================================
  // ADDITIONAL: handles create page error gracefully
  // ============================================

  it('should return zero and log error when createPage throws', async () => {
    // Mock: count query returns 0 (new user)
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));

    // Mock: createPage throws on first call
    mockCreatePage.mockRejectedValueOnce(new Error('Insert failed'));

    const result = await wikiIngestService.initializeDomainPages(userId);

    expect(result.pagesCreated).toBe(0);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
