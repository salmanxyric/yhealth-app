/**
 * Activity Wiki Synthesizer Service Unit Tests
 *
 * Tests domain-to-slug mapping, LLM synthesis flow, cooldown logic,
 * today-digest updates, fire-and-forget pattern, and race condition handling.
 */

import { jest } from '@jest/globals';
import type { ActivityDomain, ActivityEvent } from '../../../src/services/activity-wiki-synthesizer.service.js';

// ============================================
// MOCKS
// ============================================

const mockGetPage = jest.fn<any>();
const mockUpdatePage = jest.fn<any>();
const mockCreatePage = jest.fn<any>();

const mockWikiService = {
  getPage: mockGetPage,
  updatePage: mockUpdatePage,
  createPage: mockCreatePage,
};

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const mockInvalidateCache = jest.fn<any>();

const mockLlmInvoke = jest.fn<any>();
const mockGetModel = jest.fn<any>().mockReturnValue({ invoke: mockLlmInvoke });

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/services/model-factory.service.js', () => ({
  modelFactory: { getModel: mockGetModel },
}));

jest.unstable_mockModule('../../../src/services/comprehensive-user-context.service.js', () => ({
  comprehensiveUserContextService: { invalidateCache: mockInvalidateCache },
}));

const { activityWikiSynthesizer } = await import('../../../src/services/activity-wiki-synthesizer.service.js');

// ============================================
// HELPERS
// ============================================

function makeEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    domain: 'workout',
    userId: 'user-1',
    eventType: 'created',
    summary: 'Completed a 45min strength workout',
    ...overrides,
  };
}

function makeExistingPage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'page-1',
    slug: 'fitness-profile',
    title: 'Fitness Profile',
    summary: 'User fitness patterns',
    body: 'User works out 3x per week.',
    confidence: 0.6,
    outboundLinks: [],
    inboundLinks: [],
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('ActivityWikiSynthesizerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-set mock implementations (resetMocks in jest.config clears them between tests)
    mockGetModel.mockReturnValue({ invoke: mockLlmInvoke });
    mockLlmInvoke.mockResolvedValue({
      content: '# Fitness Profile\n\nUser works out 4x per week after adding strength training.',
    });
    mockUpdatePage.mockResolvedValue({});
    mockCreatePage.mockResolvedValue({ id: 'new-page', slug: 'fitness-profile' });
    mockInvalidateCache.mockResolvedValue(undefined);
  });

  describe('domain-to-slug mapping', () => {
    const domainSlugMap: Record<ActivityDomain, string> = {
      workout: 'fitness-profile',
      meal: 'nutrition-profile',
      schedule: 'lifestyle-context',
      goal: 'goals-strategy',
      mood: 'mental-wellbeing',
      stress: 'mental-wellbeing',
      energy: 'mental-wellbeing',
      habit: 'behavioral-patterns',
      'body-stats': 'fitness-profile',
      water: 'lifestyle-context',
      sleep: 'sleep-profile',
    };

    for (const [domain, expectedSlug] of Object.entries(domainSlugMap)) {
      it(`should map domain "${domain}" to slug "${expectedSlug}"`, async () => {
        const existingPage = makeExistingPage({ slug: expectedSlug });
        mockGetPage.mockResolvedValue(existingPage);

        await activityWikiSynthesizer.synthesize(makeEvent({
          domain: domain as ActivityDomain,
          userId: `user-map-${domain}`,
        }));

        const getCalls = mockGetPage.mock.calls;
        const slugsQueried = getCalls.map((c) => c[1]);
        expect(slugsQueried).toContain(expectedSlug);
      });
    }
  });

  describe('synthesize — update existing page', () => {
    it('should call LLM to rewrite domain page with existing content + new event', async () => {
      const existingPage = makeExistingPage();
      mockGetPage.mockResolvedValue(existingPage);

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-synth-update',
      }));

      expect(mockLlmInvoke).toHaveBeenCalled();
      const promptArg = mockLlmInvoke.mock.calls[0][0];
      const promptText = promptArg[0].content as string;
      expect(promptText).toContain('fitness');
      expect(promptText).toContain('Completed a 45min strength workout');
    });

    it('should update page with LLM output and bump confidence', async () => {
      const existingPage = makeExistingPage({ confidence: 0.6 });
      mockGetPage.mockResolvedValue(existingPage);

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-synth-bump',
      }));

      expect(mockUpdatePage).toHaveBeenCalledWith(
        'user-synth-bump',
        'fitness-profile',
        expect.objectContaining({
          confidence: expect.any(Number),
          changeReason: expect.stringContaining('workout'),
        }),
      );
    });

    it('should cap confidence at 1.0', async () => {
      const existingPage = makeExistingPage({ confidence: 0.99 });
      mockGetPage.mockResolvedValue(existingPage);

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-synth-cap',
      }));

      const updateCall = mockUpdatePage.mock.calls.find(
        (c) => c[1] === 'fitness-profile'
      );
      if (updateCall) {
        expect(updateCall[2].confidence).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('synthesize — create new page', () => {
    it('should create a new wiki page when none exists', async () => {
      mockGetPage.mockResolvedValue(null);

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-synth-create',
      }));

      expect(mockCreatePage).toHaveBeenCalledWith(
        'user-synth-create',
        expect.objectContaining({
          slug: 'fitness-profile',
          pageType: 'pattern',
          category: 'workout',
          confidence: 0.3,
        }),
      );
    });

    it('should handle duplicate key race condition by falling back to update', async () => {
      mockGetPage.mockResolvedValue(null);
      const duplicateError = new Error('duplicate key value');
      (duplicateError as any).code = '23505';
      mockCreatePage.mockRejectedValue(duplicateError);

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-synth-race',
      }));

      expect(mockUpdatePage).toHaveBeenCalledWith(
        'user-synth-race',
        'fitness-profile',
        expect.objectContaining({
          changeReason: expect.stringContaining('workout'),
        }),
      );
    });
  });

  describe('synthesize — today-digest', () => {
    it('should update today-digest page with new timeline entry', async () => {
      const digestPage = makeExistingPage({
        slug: 'today-digest',
        body: `# Today's Activity Digest — ${new Date().toISOString().slice(0, 10)}\n\n## Timeline\n- **9:00 AM** | Meal: Had breakfast`,
      });
      mockGetPage.mockImplementation((_uid: string, slug: string) => {
        if (slug === 'today-digest') return Promise.resolve(digestPage);
        return Promise.resolve(makeExistingPage());
      });

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-digest',
      }));

      const digestUpdateCall = mockUpdatePage.mock.calls.find(
        (c) => c[1] === 'today-digest'
      );
      expect(digestUpdateCall).toBeDefined();
      expect(digestUpdateCall![2].body).toContain('Workout');
    });

    it('should reset digest when date changes', async () => {
      const digestPage = makeExistingPage({
        slug: 'today-digest',
        body: `# Today's Activity Digest — 2025-01-01\n\n## Timeline\n- **9:00 AM** | Old entry`,
      });
      mockGetPage.mockImplementation((_uid: string, slug: string) => {
        if (slug === 'today-digest') return Promise.resolve(digestPage);
        return Promise.resolve(makeExistingPage());
      });

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-digest-reset',
      }));

      const digestUpdateCall = mockUpdatePage.mock.calls.find(
        (c) => c[1] === 'today-digest'
      );
      expect(digestUpdateCall).toBeDefined();
      const body = digestUpdateCall![2].body as string;
      expect(body).not.toContain('2025-01-01');
      expect(body).toContain(new Date().toISOString().slice(0, 10));
    });

    it('should create today-digest when it does not exist', async () => {
      mockGetPage.mockImplementation((_uid: string, slug: string) => {
        if (slug === 'today-digest') return Promise.resolve(null);
        return Promise.resolve(makeExistingPage());
      });

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-digest-new',
      }));

      expect(mockCreatePage).toHaveBeenCalledWith(
        'user-digest-new',
        expect.objectContaining({
          slug: 'today-digest',
          pageType: 'entity',
          category: 'meta',
        }),
      );
    });
  });

  describe('cooldown logic', () => {
    it('should skip LLM synthesis when within cooldown period', async () => {
      const existingPage = makeExistingPage();
      mockGetPage.mockResolvedValue(existingPage);

      // First call — should trigger LLM
      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-cooldown',
        domain: 'meal',
      }));

      const firstLlmCalls = mockLlmInvoke.mock.calls.length;
      expect(firstLlmCalls).toBe(1);

      // Second call immediately — should be throttled (cooldown active)
      jest.clearAllMocks();
      mockGetPage.mockResolvedValue(existingPage);
      mockUpdatePage.mockResolvedValue({});

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-cooldown',
        domain: 'meal',
      }));

      expect(mockLlmInvoke).not.toHaveBeenCalled();
    });

    it('should still update today-digest during cooldown', async () => {
      const existingPage = makeExistingPage();
      const digestPage = makeExistingPage({
        slug: 'today-digest',
        body: `# Today's Activity Digest — ${new Date().toISOString().slice(0, 10)}\n\n## Timeline\n- **9:00 AM** | First`,
      });
      mockGetPage.mockImplementation((_uid: string, slug: string) => {
        if (slug === 'today-digest') return Promise.resolve(digestPage);
        return Promise.resolve(existingPage);
      });
      mockUpdatePage.mockResolvedValue({});

      // Trigger cooldown
      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-cd-digest',
        domain: 'habit',
      }));

      jest.clearAllMocks();
      mockGetPage.mockImplementation((_uid: string, slug: string) => {
        if (slug === 'today-digest') return Promise.resolve(digestPage);
        return Promise.resolve(existingPage);
      });
      mockUpdatePage.mockResolvedValue({});

      // Second call — LLM skipped but digest still updated
      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-cd-digest',
        domain: 'habit',
        summary: 'Completed daily meditation',
      }));

      const digestUpdateCall = mockUpdatePage.mock.calls.find(
        (c) => c[1] === 'today-digest'
      );
      expect(digestUpdateCall).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should not throw — errors are caught and logged', async () => {
      // getPage for today-digest returns null so it tries createPage
      mockGetPage.mockResolvedValue(null);
      // createPage throws a non-duplicate error to trigger the outer catch
      mockCreatePage.mockRejectedValue(new Error('DB down'));

      await expect(
        activityWikiSynthesizer.synthesize(makeEvent({ userId: 'user-err' }))
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should skip synthesis when LLM returns empty content', async () => {
      mockGetPage.mockResolvedValue(makeExistingPage());
      mockLlmInvoke.mockResolvedValue({ content: '' });

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-empty-llm',
        domain: 'sleep',
      }));

      const domainUpdateCall = mockUpdatePage.mock.calls.find(
        (c) => c[1] === 'sleep-profile'
      );
      expect(domainUpdateCall).toBeUndefined();
    });

    it('should strip markdown code fences from LLM output', async () => {
      mockGetPage.mockResolvedValue(makeExistingPage());
      mockLlmInvoke.mockResolvedValue({
        content: '```markdown\n# Sleep Profile\n\nUser sleeps 7 hours.\n```',
      });

      await activityWikiSynthesizer.synthesize(makeEvent({
        userId: 'user-fence',
        domain: 'sleep',
      }));

      const updateCall = mockUpdatePage.mock.calls.find(
        (c) => c[1] === 'sleep-profile'
      );
      if (updateCall) {
        const body = updateCall[2].body as string;
        expect(body).not.toContain('```');
        expect(body).toContain('# Sleep Profile');
      }
    });
  });
});
