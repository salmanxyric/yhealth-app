/**
 * Wiki Tools Idempotency Tests
 *
 * Verifies that createWikiPage, updateWikiPage, and createWikiLink
 * behave idempotently — returning early instead of mutating state
 * when a duplicate or no-op operation is detected.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ============================================
// MOCKS — top-level, before dynamic import
// ============================================

const mockWikiService = {
  getPage: jest.fn<any>(),
  createPage: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  createLink: jest.fn<any>(),
  parseWikiLinks: jest.fn<any>(),
  logOperation: jest.fn<any>(),
  searchPages: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: jest.fn<any>(),
}));

// ============================================
// MODULE UNDER TEST (loaded after mocks)
// ============================================

const { registerWikiTools } = await import(
  '../../../src/services/langgraph-tools/domains/wiki.js'
);

// ============================================
// HELPERS
// ============================================

const USER_ID = 'user-idempotency-test';

function getToolHandler(name: string) {
  const tools = registerWikiTools(USER_ID);
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found in registerWikiTools`);
  return tool.handler;
}

function buildExistingPage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'page-abc',
    slug: 'morning-routine',
    title: 'Morning Routine',
    summary: 'User does yoga and coffee every morning.',
    body: '## Morning Routine\n\nYoga at 7am, then coffee.',
    confidence: 0.8,
    version: 3,
    pageType: 'pattern',
    category: 'lifestyle',
    status: 'active',
    wordCount: 12,
    outboundLinks: [],
    inboundLinks: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('Wiki Tools — Idempotency Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // createWikiPage
  // ------------------------------------------
  describe('createWikiPage', () => {
    it('should return "already exists" without calling createPage when slug already exists', async () => {
      const existingPage = buildExistingPage();
      mockWikiService.getPage.mockResolvedValueOnce(existingPage);

      const handler = getToolHandler('createWikiPage');
      const result = await handler(USER_ID, {
        slug: 'morning-routine',
        pageType: 'pattern',
        category: 'lifestyle',
        title: 'Morning Routine',
        summary: 'User does yoga and coffee every morning.',
        body: '## Morning Routine\n\nYoga at 7am, then coffee.',
        confidence: 0.8,
      });

      expect(mockWikiService.createPage).not.toHaveBeenCalled();

      const parsed = JSON.parse(result);
      expect(parsed.message).toMatch(/already exists/i);
      expect(parsed.data?.slug ?? parsed.slug).toBe('morning-routine');
      expect(parsed.data?.title ?? parsed.title).toBe('Morning Routine');
      expect(parsed.data?.version ?? parsed.version).toBe(3);
    });

    it('should proceed to create when slug does not exist', async () => {
      mockWikiService.getPage.mockResolvedValueOnce(null);
      const newPage = buildExistingPage({ id: 'page-new', version: 1 });
      mockWikiService.createPage.mockResolvedValueOnce(newPage);
      mockWikiService.parseWikiLinks.mockReturnValueOnce([]);
      mockWikiService.logOperation.mockResolvedValueOnce(undefined);

      const handler = getToolHandler('createWikiPage');
      const result = await handler(USER_ID, {
        slug: 'morning-routine',
        pageType: 'pattern',
        category: 'lifestyle',
        title: 'Morning Routine',
        summary: 'User does yoga and coffee every morning.',
        body: '## Morning Routine\n\nYoga at 7am, then coffee.',
        confidence: 0.8,
      });

      expect(mockWikiService.createPage).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
    });
  });

  // ------------------------------------------
  // updateWikiPage
  // ------------------------------------------
  describe('updateWikiPage', () => {
    it('should return "no changes" without calling updatePage when all fields are unchanged', async () => {
      const existingPage = buildExistingPage();
      mockWikiService.getPage.mockResolvedValueOnce(existingPage);

      const handler = getToolHandler('updateWikiPage');
      const result = await handler(USER_ID, {
        slug: 'morning-routine',
        title: 'Morning Routine',
        summary: 'User does yoga and coffee every morning.',
        body: '## Morning Routine\n\nYoga at 7am, then coffee.',
        confidence: 0.8,
        changeReason: 'Retrying same update',
      });

      expect(mockWikiService.updatePage).not.toHaveBeenCalled();

      const parsed = JSON.parse(result);
      expect(parsed.message).toMatch(/no changes/i);
    });

    it('should return "not found" when slug does not exist', async () => {
      mockWikiService.getPage.mockResolvedValueOnce(null);

      const handler = getToolHandler('updateWikiPage');
      const result = await handler(USER_ID, {
        slug: 'non-existent-slug',
        title: 'New Title',
        changeReason: 'Updating missing page',
      });

      expect(mockWikiService.updatePage).not.toHaveBeenCalled();

      const parsed = JSON.parse(result);
      expect(parsed.message ?? parsed.error).toMatch(/not found/i);
    });

    it('should proceed to update when body has changed', async () => {
      const existingPage = buildExistingPage();
      mockWikiService.getPage.mockResolvedValueOnce(existingPage);
      const updatedPage = buildExistingPage({ version: 4, body: 'New body content.' });
      mockWikiService.updatePage.mockResolvedValueOnce(updatedPage);
      mockWikiService.parseWikiLinks.mockReturnValueOnce([]);
      mockWikiService.logOperation.mockResolvedValueOnce(undefined);

      const handler = getToolHandler('updateWikiPage');
      const result = await handler(USER_ID, {
        slug: 'morning-routine',
        body: 'New body content.',
        changeReason: 'Updated body with new info',
      });

      expect(mockWikiService.updatePage).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
    });
  });

  // ------------------------------------------
  // createWikiLink
  // ------------------------------------------
  describe('createWikiLink', () => {
    it('should succeed silently when link already exists (DB upsert)', async () => {
      const existingLink = { id: 'link-123', linkType: 'reference' };
      mockWikiService.createLink.mockResolvedValueOnce(existingLink);

      const handler = getToolHandler('createWikiLink');
      const result = await handler(USER_ID, {
        sourceSlug: 'morning-routine',
        targetSlug: 'yoga-practice',
        linkType: 'reference',
        context: 'Morning routine includes yoga',
      });

      expect(mockWikiService.createLink).toHaveBeenCalledTimes(1);

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(parsed.error).toBeUndefined();
    });
  });

  // ------------------------------------------
  // fileQueryAsWikiPage
  // ------------------------------------------
  describe('fileQueryAsWikiPage', () => {
    it('should return "already exists" without calling createPage when slug already exists', async () => {
      const existingPage = buildExistingPage({
        slug: 'sleep-qa-synthesis',
        title: 'Sleep Q&A Synthesis',
        pageType: 'synthesis',
      });
      mockWikiService.getPage.mockResolvedValueOnce(existingPage);

      const handler = getToolHandler('fileQueryAsWikiPage');
      const result = await handler(USER_ID, {
        slug: 'sleep-qa-synthesis',
        title: 'Sleep Q&A Synthesis',
        summary: 'Key insights from sleep discussion.',
        body: 'User sleeps best at 10pm with no screens.',
        category: 'sleep',
      });

      expect(mockWikiService.createPage).not.toHaveBeenCalled();

      const parsed = JSON.parse(result);
      expect(parsed.message).toMatch(/already exists/i);
    });

    it('should proceed to create synthesis page when slug does not exist', async () => {
      mockWikiService.getPage.mockResolvedValueOnce(null);
      const newPage = buildExistingPage({
        id: 'page-syn',
        slug: 'sleep-qa-synthesis',
        pageType: 'synthesis',
        version: 1,
      });
      mockWikiService.createPage.mockResolvedValueOnce(newPage);
      mockWikiService.parseWikiLinks.mockReturnValueOnce([]);
      mockWikiService.logOperation.mockResolvedValueOnce(undefined);

      const handler = getToolHandler('fileQueryAsWikiPage');
      const result = await handler(USER_ID, {
        slug: 'sleep-qa-synthesis',
        title: 'Sleep Q&A Synthesis',
        summary: 'Key insights from sleep discussion.',
        body: 'User sleeps best at 10pm with no screens.',
        category: 'sleep',
      });

      expect(mockWikiService.createPage).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
    });
  });
});
