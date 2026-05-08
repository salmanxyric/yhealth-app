// server/tests/unit/jobs/wiki-synthesis.job.test.ts
/**
 * Wiki Synthesis Job Unit Tests
 *
 * Tests for the daily deep synthesis job (Memory Compiler Mode 2).
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();

const mockWikiService = {
  getPage: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  logOperation: jest.fn<any>(),
  searchPages: jest.fn<any>(),
};

const mockWikiIndexService = {
  rebuildIndex: jest.fn<any>(),
};

const mockLlmInvoke = jest.fn<any>();
const mockGetModel = jest.fn<any>().mockReturnValue({ invoke: mockLlmInvoke });

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

jest.unstable_mockModule('../../../src/services/model-factory.service.js', () => ({
  modelFactory: { getModel: mockGetModel },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// ============================================
// IMPORT UNDER TEST
// ============================================

const { processWikiSynthesisForUser } = await import(
  '../../../src/jobs/wiki-synthesis.job.js'
);

// ============================================
// HELPERS
// ============================================

function makeFullPage(slug: string, confidence = 0.5, body = 'Original body content.') {
  return {
    id: `page-${slug}`,
    userId: 'user-1',
    slug,
    pageType: 'pattern' as const,
    category: 'fitness',
    title: slug.replace(/-/g, ' '),
    summary: `Summary for ${slug}`,
    body,
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
  mockWikiIndexService.rebuildIndex.mockResolvedValue(undefined);
});

describe('processWikiSynthesisForUser', () => {
  const userId = 'user-synth-test';

  it('should skip user when they have no wiki pages', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(0);
    expect(mockWikiService.updatePage).not.toHaveBeenCalled();
  });

  it('should skip user when there are no recent data signals', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'fitness-profile' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '0' }] });

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(0);
    expect(mockLlmInvoke).not.toHaveBeenCalled();
  });

  it('should call LLM and update page when signals exist', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'fitness-profile' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '5' }] });
    mockQuery.mockResolvedValueOnce({
      rows: [
        { source_table: 'workout_logs', summary: 'Did 45min HIIT' },
        { source_table: 'workout_logs', summary: 'Morning jog 30min' },
      ],
    });

    const existingPage = makeFullPage('fitness-profile', 0.6);
    mockWikiService.getPage.mockResolvedValueOnce(existingPage);

    mockLlmInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        summary: 'Updated fitness summary with HIIT and jogging patterns.',
        body: '## Fitness Profile\n\nUser does HIIT and jogging regularly.',
        confidence: 0.72,
      }),
    });

    mockWikiService.updatePage.mockResolvedValueOnce({
      ...existingPage,
      version: 3,
      confidence: 0.72,
    });

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(1);
    expect(mockWikiService.updatePage).toHaveBeenCalledTimes(1);
    expect(mockWikiService.updatePage).toHaveBeenCalledWith(
      userId,
      'fitness-profile',
      expect.objectContaining({
        changeReason: expect.stringContaining('synthesis'),
      })
    );
    expect(mockWikiIndexService.rebuildIndex).toHaveBeenCalledWith(userId);
  });

  it('should cap pages updated at MAX_PAGES_PER_SYNTHESIS (20)', async () => {
    const slugs = Array.from({ length: 25 }, (_, i) => ({ slug: `page-${i}` }));
    mockQuery.mockResolvedValueOnce({ rows: slugs });
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '10' }] });
    mockQuery.mockResolvedValue({
      rows: [{ source_table: 'workout_logs', summary: 'Activity' }],
    });

    mockWikiService.getPage.mockImplementation((_uid: string, slug: string) =>
      Promise.resolve(makeFullPage(slug, 0.5))
    );

    mockLlmInvoke.mockResolvedValue({
      content: JSON.stringify({
        summary: 'Updated summary.',
        body: 'Updated body.',
        confidence: 0.6,
      }),
    });

    mockWikiService.updatePage.mockImplementation((_uid: string, slug: string) =>
      Promise.resolve(makeFullPage(slug, 0.6))
    );

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBeLessThanOrEqual(20);
  });

  it('should handle LLM failure gracefully and continue', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'fitness-profile' }, { slug: 'nutrition-profile' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '3' }] });
    mockQuery.mockResolvedValue({
      rows: [{ source_table: 'meal_logs', summary: 'Ate salad' }],
    });

    mockWikiService.getPage
      .mockResolvedValueOnce(makeFullPage('fitness-profile', 0.5))
      .mockResolvedValueOnce(makeFullPage('nutrition-profile', 0.5));

    mockLlmInvoke
      .mockRejectedValueOnce(new Error('Rate limited'))
      .mockResolvedValueOnce({
        content: JSON.stringify({
          summary: 'Nutrition update.',
          body: 'Updated nutrition.',
          confidence: 0.65,
        }),
      });

    mockWikiService.updatePage.mockResolvedValueOnce(
      makeFullPage('nutrition-profile', 0.65)
    );

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(1);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should skip LLM call when page has no recent signals', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'sleep-profile' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '2' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    mockWikiService.getPage.mockResolvedValueOnce(
      makeFullPage('sleep-profile', 0.8)
    );

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(0);
    expect(mockLlmInvoke).not.toHaveBeenCalled();
  });
});
