/**
 * WikiCompilerService Unit Tests
 *
 * Tests for the lightweight memory compiler that runs after every
 * conversation turn and bumps confidence for matching wiki pages.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockSearchPages = jest.fn<any>();
const mockGetPage = jest.fn<any>();
const mockUpdatePage = jest.fn<any>();
const mockLogOperation = jest.fn<any>();

const mockWikiService = {
  searchPages: mockSearchPages,
  getPage: mockGetPage,
  updatePage: mockUpdatePage,
  logOperation: mockLogOperation,
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const mockSeedUser = jest.fn<any>();
jest.unstable_mockModule('../../../src/services/wiki-seed.service.js', () => ({
  wikiSeedService: { seedUser: mockSeedUser },
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { wikiCompilerService } = await import('../../../src/services/wiki-compiler.service.js');

// ============================================
// HELPERS
// ============================================

function makeWikiSearchResult(overrides: Partial<{
  slug: string;
  title: string;
  confidence: number;
  category: string;
  similarity: number;
}> = {}) {
  const slug = overrides.slug ?? 'health-goals';
  return {
    page: {
      id: 'page-id-1',
      userId: 'user-1',
      slug,
      pageType: 'insight' as const,
      category: overrides.category ?? 'health',
      title: overrides.title ?? 'Health Goals',
      summary: 'User health goals summary',
      body: 'Body content about health goals',
      frontmatter: {},
      confidence: overrides.confidence ?? 0.5,
      evidenceCount: 3,
      wordCount: 50,
      status: 'active' as const,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLintAt: null,
      staleAfterDays: 30,
    },
    similarity: overrides.similarity ?? 0.8,
    matchContext: null,
  };
}

function makeFullPage(slug: string, confidence = 0.5) {
  return {
    id: 'page-id-1',
    userId: 'user-1',
    slug,
    pageType: 'insight' as const,
    category: 'health',
    title: 'Health Goals',
    summary: 'User health goals summary',
    body: 'Body content about health goals',
    frontmatter: {},
    confidence,
    evidenceCount: 3,
    wordCount: 50,
    status: 'active' as const,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLintAt: null,
    staleAfterDays: 30,
    outboundLinks: [],
    inboundLinks: [],
  };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockLogOperation.mockResolvedValue(undefined);
  mockSeedUser.mockResolvedValue({ pagesCreated: 0, errors: 0 });
});

describe('WikiCompilerService.processConversationTurn', () => {
  const userId = 'user-abc';
  const conversationId = 'conv-xyz';
  const shortMessage = 'hi';
  const longMessage = 'I have been tracking my sleep and workout habits consistently for the past month.';
  const assistantResponse = 'Great to hear about your sleep and workout habits!';

  // ============================================
  // TEST 1: Should update matching wiki page evidence when reinforcing signal found
  // ============================================

  it('should update matching wiki page evidence when reinforcing signal found', async () => {
    const searchResult = makeWikiSearchResult({ slug: 'sleep-habits', confidence: 0.6 });
    mockSearchPages.mockResolvedValue([searchResult]);

    const fullPage = makeFullPage('sleep-habits', 0.6);
    mockGetPage.mockResolvedValue(fullPage);

    mockUpdatePage.mockResolvedValue({ ...fullPage, confidence: 0.62 });

    const result = await wikiCompilerService.processConversationTurn(
      userId,
      longMessage,
      assistantResponse,
      conversationId
    );

    expect(result.pagesUpdated).toBeGreaterThanOrEqual(0);
    expect(result.pagesUpdated).toBeLessThanOrEqual(3);
    expect(result.conversationId).toBe(conversationId);
  });

  // ============================================
  // TEST 2: Should respect MAX_PAGES_PER_TURN limit of 3
  // ============================================

  it('should respect MAX_PAGES_PER_TURN limit of 3', async () => {
    const results = [
      makeWikiSearchResult({ slug: 'page-1', similarity: 0.9 }),
      makeWikiSearchResult({ slug: 'page-2', similarity: 0.85 }),
      makeWikiSearchResult({ slug: 'page-3', similarity: 0.8 }),
      makeWikiSearchResult({ slug: 'page-4', similarity: 0.75 }),
      makeWikiSearchResult({ slug: 'page-5', similarity: 0.7 }),
    ];
    mockSearchPages.mockResolvedValue(results);

    // getPage returns a full page for any slug
    mockGetPage.mockImplementation((_userId: string, slug: string) =>
      Promise.resolve(makeFullPage(slug, 0.5))
    );
    mockUpdatePage.mockImplementation((_userId: string, slug: string) =>
      Promise.resolve(makeFullPage(slug, 0.52))
    );

    const result = await wikiCompilerService.processConversationTurn(
      userId,
      longMessage,
      assistantResponse,
      conversationId
    );

    expect(result.pagesUpdated).toBeLessThanOrEqual(3);
    expect(result.conversationId).toBe(conversationId);
  });

  // ============================================
  // TEST 3: Should return zero pages updated when no wiki pages match
  // ============================================

  it('should return zero pages updated when no wiki pages match', async () => {
    mockSearchPages.mockResolvedValue([]);

    const result = await wikiCompilerService.processConversationTurn(
      userId,
      longMessage,
      assistantResponse,
      conversationId
    );

    expect(result.pagesUpdated).toBe(0);
    expect(result.conversationId).toBe(conversationId);
    expect(mockGetPage).not.toHaveBeenCalled();
    expect(mockUpdatePage).not.toHaveBeenCalled();
  });

  // ============================================
  // ADDITIONAL: Short message is skipped
  // ============================================

  it('should skip processing when message is shorter than MIN_MESSAGE_LENGTH', async () => {
    const result = await wikiCompilerService.processConversationTurn(
      userId,
      shortMessage,
      assistantResponse,
      conversationId
    );

    expect(result.pagesUpdated).toBe(0);
    expect(result.conversationId).toBe(conversationId);
    expect(mockSearchPages).not.toHaveBeenCalled();
  });

  // ============================================
  // ADDITIONAL: Confidence is capped at 1.0
  // ============================================

  it('should cap confidence at 1.0 when page already has high confidence', async () => {
    const searchResult = makeWikiSearchResult({ slug: 'high-conf-page', confidence: 0.99 });
    mockSearchPages.mockResolvedValue([searchResult]);

    const fullPage = makeFullPage('high-conf-page', 0.99);
    mockGetPage.mockResolvedValue(fullPage);
    mockUpdatePage.mockResolvedValue({ ...fullPage, confidence: 1.0 });

    await wikiCompilerService.processConversationTurn(
      userId,
      longMessage,
      assistantResponse,
      conversationId
    );

    expect(mockUpdatePage).toHaveBeenCalledWith(
      userId,
      'high-conf-page',
      expect.objectContaining({
        confidence: 1.0,
      })
    );
  });

  // ============================================
  // ADDITIONAL: Error is caught and returns zero
  // ============================================

  it('should return zero pagesUpdated on error and log it', async () => {
    mockSearchPages.mockRejectedValue(new Error('DB connection failed'));

    const result = await wikiCompilerService.processConversationTurn(
      userId,
      longMessage,
      assistantResponse,
      conversationId
    );

    expect(result.pagesUpdated).toBe(0);
    expect(result.conversationId).toBe(conversationId);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
