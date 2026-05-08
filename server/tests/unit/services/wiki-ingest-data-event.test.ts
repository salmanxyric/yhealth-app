/**
 * WikiIngestService.ingestFromDataEvent() Unit Tests
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();

const mockWikiService = {
  getPage: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  addSources: jest.fn<any>(),
  logOperation: jest.fn<any>(),
  searchPages: jest.fn<any>(),
  createPage: jest.fn<any>(),
  createLink: jest.fn<any>(),
  parseWikiLinks: jest.fn<any>(),
};

const mockWikiIndexService = {
  rebuildIndex: jest.fn<any>(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
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
// IMPORT UNDER TEST
// ============================================

const { wikiIngestService } = await import(
  '../../../src/services/wiki-ingest.service.js'
);

// ============================================
// HELPERS
// ============================================

function makeFullPage(slug: string, confidence = 0.5) {
  return {
    id: `page-${slug}`,
    userId: 'user-1',
    slug,
    pageType: 'pattern' as const,
    category: 'fitness',
    title: slug.replace(/-/g, ' '),
    summary: `Summary for ${slug}`,
    body: `Body for ${slug}`,
    frontmatter: {},
    confidence,
    evidenceCount: 3,
    wordCount: 20,
    status: 'active' as const,
    version: 2,
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
  mockWikiService.logOperation.mockResolvedValue(undefined);
  mockWikiService.addSources.mockResolvedValue(undefined);
  mockWikiIndexService.rebuildIndex.mockResolvedValue(undefined);
});

describe('WikiIngestService.ingestFromDataEvent', () => {
  const userId = 'user-data-event';

  it('should update matching wiki page for workout event', async () => {
    const page = makeFullPage('fitness-profile', 0.6);
    mockWikiService.getPage.mockResolvedValueOnce(page);
    mockWikiService.updatePage.mockResolvedValueOnce({ ...page, confidence: 0.61 });

    const result = await wikiIngestService.ingestFromDataEvent(userId, {
      type: 'workout',
      eventId: 'evt-001',
      source: 'manual',
      timestamp: new Date().toISOString(),
    });

    expect(result.pagesUpdated).toBe(1);
    expect(mockWikiService.updatePage).toHaveBeenCalledWith(
      userId,
      'fitness-profile',
      expect.objectContaining({
        confidence: 0.61,
        changeReason: expect.stringContaining('workout'),
      })
    );
    expect(mockWikiService.addSources).toHaveBeenCalledWith(
      page.id,
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: 'activity_event',
          sourceId: 'evt-001',
        }),
      ])
    );
  });

  it('should update nutrition-profile for nutrition events', async () => {
    const page = makeFullPage('nutrition-profile', 0.5);
    mockWikiService.getPage.mockResolvedValueOnce(page);
    mockWikiService.updatePage.mockResolvedValueOnce({ ...page, confidence: 0.51 });

    const result = await wikiIngestService.ingestFromDataEvent(userId, {
      type: 'nutrition',
      eventId: 'evt-002',
      source: 'manual',
      timestamp: new Date().toISOString(),
    });

    expect(result.pagesUpdated).toBe(1);
    expect(mockWikiService.getPage).toHaveBeenCalledWith(userId, 'nutrition-profile');
  });

  it('should return zero when domain page does not exist', async () => {
    mockWikiService.getPage.mockResolvedValueOnce(null);

    const result = await wikiIngestService.ingestFromDataEvent(userId, {
      type: 'workout',
      eventId: 'evt-003',
      source: 'manual',
      timestamp: new Date().toISOString(),
    });

    expect(result.pagesUpdated).toBe(0);
    expect(mockWikiService.updatePage).not.toHaveBeenCalled();
  });

  it('should cap confidence at 1.0', async () => {
    const page = makeFullPage('fitness-profile', 0.995);
    mockWikiService.getPage.mockResolvedValueOnce(page);
    mockWikiService.updatePage.mockResolvedValueOnce({ ...page, confidence: 1.0 });

    await wikiIngestService.ingestFromDataEvent(userId, {
      type: 'workout',
      eventId: 'evt-004',
      source: 'whoop',
      timestamp: new Date().toISOString(),
    });

    expect(mockWikiService.updatePage).toHaveBeenCalledWith(
      userId,
      'fitness-profile',
      expect.objectContaining({ confidence: 1.0 })
    );
  });

  it('should handle errors gracefully and return empty result', async () => {
    mockWikiService.getPage.mockRejectedValueOnce(new Error('DB connection failed'));

    const result = await wikiIngestService.ingestFromDataEvent(userId, {
      type: 'workout',
      eventId: 'evt-005',
      source: 'manual',
      timestamp: new Date().toISOString(),
    });

    expect(result.pagesUpdated).toBe(0);
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
