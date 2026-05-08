/**
 * WikiSeedService Unit Tests
 *
 * Tests for the service that seeds default domain pages for new users.
 * Covers: full seeding, skip-if-exists, partial failure resilience,
 * and index rebuild after seeding.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockQuery = jest.fn<any>();

const mockCreatePage = jest.fn<any>();
const mockLogOperation = jest.fn<any>();

const mockWikiService = {
  createPage: mockCreatePage,
  logOperation: mockLogOperation,
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

const { wikiSeedService } = await import('../../../src/services/wiki-seed.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[], rowCount = rows.length) {
  return { rows, rowCount, command: 'SELECT', oid: 0, fields: [] };
}

// ============================================
// TESTS
// ============================================

describe('wikiSeedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('seedUser', () => {
    it('should create all 9 default domain pages for a new user', async () => {
      // User has no existing wiki pages
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));

      // All createPage calls succeed
      mockCreatePage.mockResolvedValue({ id: 'page-id', slug: 'test' });

      // rebuildIndex succeeds
      mockRebuildIndex.mockResolvedValue({ pageCount: 9 });

      // logOperation succeeds
      mockLogOperation.mockResolvedValue(undefined);

      const result = await wikiSeedService.seedUser('user-1');

      expect(result.pagesCreated).toBe(9);
      expect(result.errors).toBe(0);

      // Verify createPage called 9 times with userId and confidence 0.1
      expect(mockCreatePage).toHaveBeenCalledTimes(9);

      // Verify each call passes userId as first arg and confidence 0.1
      for (const call of mockCreatePage.mock.calls) {
        expect(call[0]).toBe('user-1');
        expect(call[1]).toHaveProperty('confidence', 0.1);
      }

      // Verify all expected slugs were created
      const slugsCreated = mockCreatePage.mock.calls.map(
        (call: any[]) => call[1].slug
      );
      expect(slugsCreated).toEqual(
        expect.arrayContaining([
          'fitness-profile',
          'nutrition-profile',
          'sleep-profile',
          'mental-wellbeing',
          'lifestyle-context',
          'goals-strategy',
          'coaching-relationship',
          'behavioral-patterns',
          'user-index',
        ])
      );
      expect(slugsCreated).toHaveLength(9);

      // Verify rebuildIndex was called
      expect(mockRebuildIndex).toHaveBeenCalledWith('user-1');

      // Verify logOperation was called with correct summary info
      expect(mockLogOperation).toHaveBeenCalledWith('user-1', expect.objectContaining({
        operation: 'create',
        pagesTouched: 9,
      }));
    });

    it('should skip seeding if user already has wiki pages', async () => {
      // User already has 5 pages
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '5' }]));

      const result = await wikiSeedService.seedUser('user-1');

      expect(result.pagesCreated).toBe(0);
      expect(result.errors).toBe(0);

      // createPage should never be called
      expect(mockCreatePage).not.toHaveBeenCalled();

      // rebuildIndex should not be called
      expect(mockRebuildIndex).not.toHaveBeenCalled();

      // logOperation should not be called
      expect(mockLogOperation).not.toHaveBeenCalled();
    });

    it('should continue creating remaining pages if one fails', async () => {
      // User has no existing wiki pages
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));

      // First call fails, remaining 8 succeed
      mockCreatePage
        .mockRejectedValueOnce(new Error('DB constraint violation'))
        .mockResolvedValue({ id: 'page-id', slug: 'test' });

      // rebuildIndex succeeds
      mockRebuildIndex.mockResolvedValue({ pageCount: 8 });

      // logOperation succeeds
      mockLogOperation.mockResolvedValue(undefined);

      const result = await wikiSeedService.seedUser('user-1');

      expect(result.pagesCreated).toBe(8);
      expect(result.errors).toBe(1);

      // All 9 attempts were made
      expect(mockCreatePage).toHaveBeenCalledTimes(9);

      // Error was logged
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should rebuild index after seeding', async () => {
      // User has no existing wiki pages
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));

      // All createPage calls succeed
      mockCreatePage.mockResolvedValue({ id: 'page-id', slug: 'test' });

      // rebuildIndex succeeds
      mockRebuildIndex.mockResolvedValue({ pageCount: 9 });

      // logOperation succeeds
      mockLogOperation.mockResolvedValue(undefined);

      await wikiSeedService.seedUser('user-1');

      // rebuildIndex must be called with the user's ID
      expect(mockRebuildIndex).toHaveBeenCalledTimes(1);
      expect(mockRebuildIndex).toHaveBeenCalledWith('user-1');
    });
  });
});
