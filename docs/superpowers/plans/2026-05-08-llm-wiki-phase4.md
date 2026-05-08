# Phase 4: Wiki Lint + Seeding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automated wiki health maintenance (stale detection, orphan linking, contradiction flagging) via a scheduled lint job, and seed wiki pages for existing users from their historical data.

**Architecture:** New `wiki-lint.service.ts` with per-user lint logic, orchestrated by a `wiki-lint.job.ts` interval-based job (same pattern as `wiki-synthesis.job.ts`). Seeding command creates default domain pages for users who have activity data but no wiki pages yet. Both run through existing infrastructure — no new queues or dependencies.

**Tech Stack:** TypeScript, PostgreSQL, Jest 30 ESM, `setInterval`-based job scheduling

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/src/services/wiki-lint.service.ts` | Per-user lint logic: stale detection, orphan detection, contradiction scan, link integrity |
| Create | `server/src/jobs/wiki-lint.job.ts` | Scheduled job: runs lint for users with recent wiki activity |
| Create | `server/src/services/wiki-seed.service.ts` | Seeds default domain pages for users with no wiki pages |
| Modify | `server/src/index.ts` | Register wiki-lint job at startup |
| Create | `server/tests/unit/services/wiki-lint.service.test.ts` | Unit tests for lint service |
| Create | `server/tests/unit/jobs/wiki-lint.job.test.ts` | Unit tests for lint job |
| Create | `server/tests/unit/services/wiki-seed.service.test.ts` | Unit tests for seeding |

---

### Task 1: Wiki Lint Service

**Files:**
- Create: `server/src/services/wiki-lint.service.ts`
- Create: `server/tests/unit/services/wiki-lint.service.test.ts`

- [ ] **Step 1: Write the failing test file**

```typescript
// server/tests/unit/services/wiki-lint.service.test.ts
import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();

const mockWikiService = {
  getPage: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  logOperation: jest.fn<any>(),
  listPages: jest.fn<any>(),
  getLinks: jest.fn<any>(),
  getOrphans: jest.fn<any>(),
};

const mockWikiIndexService = {
  markStalePages: jest.fn<any>(),
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

const { wikiLintService } = await import(
  '../../../src/services/wiki-lint.service.js'
);

beforeEach(() => {
  jest.clearAllMocks();
  mockWikiService.logOperation.mockResolvedValue(undefined);
  mockWikiIndexService.rebuildIndex.mockResolvedValue({
    pageCount: 0, countsByType: {}, countsByCategory: {},
    orphanCount: 0, staleCount: 0, contradictedCount: 0,
  });
});

describe('wikiLintService.lintUser', () => {
  const userId = 'user-lint-test';

  it('should mark stale pages and return count', async () => {
    mockWikiIndexService.markStalePages.mockResolvedValueOnce(3);
    mockWikiService.getOrphans.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce({ rows: [] }); // broken links

    const result = await wikiLintService.lintUser(userId);

    expect(result.staleMarked).toBe(3);
    expect(mockWikiIndexService.markStalePages).toHaveBeenCalledWith(userId);
  });

  it('should detect orphan pages', async () => {
    mockWikiIndexService.markStalePages.mockResolvedValueOnce(0);
    mockWikiService.getOrphans.mockResolvedValueOnce([
      { id: 'p1', slug: 'orphan-page', title: 'Orphan' },
    ]);
    mockQuery.mockResolvedValueOnce({ rows: [] }); // broken links

    const result = await wikiLintService.lintUser(userId);

    expect(result.orphansFound).toBe(1);
  });

  it('should detect broken links', async () => {
    mockWikiIndexService.markStalePages.mockResolvedValueOnce(0);
    mockWikiService.getOrphans.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'link-1', source_slug: 'a', target_slug: 'deleted-page' }],
    });

    const result = await wikiLintService.lintUser(userId);

    expect(result.brokenLinks).toBe(1);
  });

  it('should rebuild index after lint', async () => {
    mockWikiIndexService.markStalePages.mockResolvedValueOnce(0);
    mockWikiService.getOrphans.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await wikiLintService.lintUser(userId);

    expect(mockWikiIndexService.rebuildIndex).toHaveBeenCalledWith(userId);
  });

  it('should log lint operation', async () => {
    mockWikiIndexService.markStalePages.mockResolvedValueOnce(1);
    mockWikiService.getOrphans.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await wikiLintService.lintUser(userId);

    expect(mockWikiService.logOperation).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ operation: 'lint' })
    );
  });

  it('should handle errors gracefully', async () => {
    mockWikiIndexService.markStalePages.mockRejectedValueOnce(new Error('DB error'));

    const result = await wikiLintService.lintUser(userId);

    expect(result.staleMarked).toBe(0);
    expect(result.errors).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --experimental-vm-modules node_modules/.bin/jest --testPathPatterns="wiki-lint.service" --no-coverage 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Create the wiki-lint service**

```typescript
// server/src/services/wiki-lint.service.ts
import { query } from '../config/database.config.js';
import { wikiService } from './wiki.service.js';
import { wikiIndexService } from './wiki-index.service.js';
import { logger } from './logger.service.js';

export interface LintResult {
  staleMarked: number;
  orphansFound: number;
  brokenLinks: number;
  errors: number;
}

class WikiLintService {
  async lintUser(userId: string): Promise<LintResult> {
    const result: LintResult = {
      staleMarked: 0,
      orphansFound: 0,
      brokenLinks: 0,
      errors: 0,
    };

    // 1. Mark stale pages
    try {
      result.staleMarked = await wikiIndexService.markStalePages(userId);
    } catch (error) {
      result.errors++;
      logger.warn('[WikiLint] Failed to mark stale pages', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 2. Detect orphan pages (no inbound links)
    try {
      const orphans = await wikiService.getOrphans(userId);
      result.orphansFound = orphans.length;
    } catch (error) {
      result.errors++;
      logger.warn('[WikiLint] Failed to detect orphans', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 3. Detect broken links (target page doesn't exist)
    try {
      const brokenResult = await query<{ id: string; source_slug: string; target_slug: string }>(
        `SELECT wl.id,
                sp.slug AS source_slug,
                tp.slug AS target_slug
         FROM wiki_links wl
         JOIN wiki_pages sp ON sp.id = wl.source_page_id AND sp.user_id = $1
         LEFT JOIN wiki_pages tp ON tp.id = wl.target_page_id AND tp.user_id = $1
         WHERE tp.id IS NULL OR tp.status = 'archived'`,
        [userId]
      );
      result.brokenLinks = brokenResult.rows.length;
    } catch (error) {
      result.errors++;
      logger.warn('[WikiLint] Failed to detect broken links', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 4. Rebuild index with fresh counts
    try {
      await wikiIndexService.rebuildIndex(userId);
    } catch (error) {
      logger.warn('[WikiLint] Failed to rebuild index', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 5. Log lint operation
    const total = result.staleMarked + result.orphansFound + result.brokenLinks;
    if (total > 0 || result.errors > 0) {
      try {
        await wikiService.logOperation(userId, {
          operation: 'lint',
          summary: `Lint: ${result.staleMarked} stale, ${result.orphansFound} orphans, ${result.brokenLinks} broken links`,
          pagesTouched: result.staleMarked,
        });
      } catch {
        // Non-critical
      }
    }

    return result;
  }
}

export const wikiLintService = new WikiLintService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --experimental-vm-modules node_modules/.bin/jest --testPathPatterns="wiki-lint.service" --no-coverage 2>&1 | tail -20`
Expected: 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add server/src/services/wiki-lint.service.ts server/tests/unit/services/wiki-lint.service.test.ts
git commit -m "feat(wiki): add WikiLintService for automated wiki health checks"
```

---

### Task 2: Wiki Lint Job

**Files:**
- Create: `server/src/jobs/wiki-lint.job.ts`
- Create: `server/tests/unit/jobs/wiki-lint.job.test.ts`

- [ ] **Step 1: Write the failing test file**

```typescript
// server/tests/unit/jobs/wiki-lint.job.test.ts
import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();

const mockWikiLintService = {
  lintUser: jest.fn<any>(),
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

jest.unstable_mockModule('../../../src/services/wiki-lint.service.js', () => ({
  wikiLintService: mockWikiLintService,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { processWikiLintForAllUsers } = await import(
  '../../../src/jobs/wiki-lint.job.js'
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('processWikiLintForAllUsers', () => {
  it('should lint all users with wiki pages', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
    });
    mockWikiLintService.lintUser.mockResolvedValue({
      staleMarked: 1, orphansFound: 0, brokenLinks: 0, errors: 0,
    });

    await processWikiLintForAllUsers();

    expect(mockWikiLintService.lintUser).toHaveBeenCalledTimes(2);
    expect(mockWikiLintService.lintUser).toHaveBeenCalledWith('user-1');
    expect(mockWikiLintService.lintUser).toHaveBeenCalledWith('user-2');
  });

  it('should skip when no users have wiki pages', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await processWikiLintForAllUsers();

    expect(mockWikiLintService.lintUser).not.toHaveBeenCalled();
  });

  it('should continue processing when one user fails', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
    });
    mockWikiLintService.lintUser
      .mockRejectedValueOnce(new Error('User 1 failed'))
      .mockResolvedValueOnce({
        staleMarked: 0, orphansFound: 0, brokenLinks: 0, errors: 0,
      });

    await processWikiLintForAllUsers();

    expect(mockWikiLintService.lintUser).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --experimental-vm-modules node_modules/.bin/jest --testPathPatterns="wiki-lint.job" --no-coverage 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Create the wiki-lint job**

```typescript
// server/src/jobs/wiki-lint.job.ts
import { query } from '../config/database.config.js';
import { wikiLintService } from '../services/wiki-lint.service.js';
import { logger } from '../services/logger.service.js';

const JOB_INTERVAL_MS = 12 * 60 * 60 * 1000; // Every 12 hours
const STARTUP_DELAY_MS = 1800 * 1000; // 30 minutes (after wiki synthesis at 1620s)
const BATCH_SIZE = 5;
const INTER_BATCH_DELAY_MS = 3000;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export async function processWikiLintForAllUsers(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const usersResult = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM wiki_pages
       WHERE status != 'archived'
       ORDER BY user_id
       LIMIT 100`,
    );

    if (usersResult.rows.length === 0) {
      logger.debug('[WikiLint] No users with wiki pages');
      return;
    }

    let totalStale = 0;
    let totalOrphans = 0;
    let totalBroken = 0;
    let totalErrors = 0;

    for (let i = 0; i < usersResult.rows.length; i += BATCH_SIZE) {
      const batch = usersResult.rows.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((row) => wikiLintService.lintUser(row.user_id))
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          totalStale += r.value.staleMarked;
          totalOrphans += r.value.orphansFound;
          totalBroken += r.value.brokenLinks;
          totalErrors += r.value.errors;
        } else {
          totalErrors++;
        }
      }

      if (i + BATCH_SIZE < usersResult.rows.length) {
        await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
      }
    }

    if (totalStale > 0 || totalOrphans > 0 || totalBroken > 0 || totalErrors > 0) {
      logger.info('[WikiLint] Processing complete', {
        usersProcessed: usersResult.rows.length,
        totalStale,
        totalOrphans,
        totalBroken,
        totalErrors,
      });
    }
  } catch (error) {
    logger.error('[WikiLint] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isRunning = false;
  }
}

export function startWikiLint(): void {
  if (intervalId) {
    logger.warn('[WikiLint] Already running');
    return;
  }

  logger.info('[WikiLint] Starting wiki lint job', {
    intervalMs: JOB_INTERVAL_MS,
    startupDelayMs: STARTUP_DELAY_MS,
  });

  setTimeout(() => {
    processWikiLintForAllUsers();
    intervalId = setInterval(processWikiLintForAllUsers, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopWikiLint(): void {
  if (!intervalId) {
    logger.warn('[WikiLint] Not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  logger.info('[WikiLint] Stopped wiki lint job');
}

export function isWikiLintRunning(): boolean {
  return intervalId !== null;
}

export const wikiLintJob = {
  start: startWikiLint,
  stop: stopWikiLint,
  isRunning: isWikiLintRunning,
  processNow: processWikiLintForAllUsers,
};

export default wikiLintJob;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --experimental-vm-modules node_modules/.bin/jest --testPathPatterns="wiki-lint.job" --no-coverage 2>&1 | tail -20`
Expected: 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add server/src/jobs/wiki-lint.job.ts server/tests/unit/jobs/wiki-lint.job.test.ts
git commit -m "feat(wiki): add WikiLint scheduled job for automated health checks"
```

---

### Task 3: Register Wiki Lint Job at Startup

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: Add import**

Add after the existing wiki synthesis import:

```typescript
import { wikiLintJob } from './jobs/wiki-lint.job.js';
```

- [ ] **Step 2: Add startup registration**

Add after the wiki synthesis startup block (which is at 1620s). The lint job should start at 1800s (30 minutes):

```typescript
setTimeout(() => {
  wikiLintJob.start();
  logger.info("Wiki lint job started (staggered 1800s)");
}, 1800_000);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts
git commit -m "feat(wiki): register wiki lint job at server startup"
```

---

### Task 4: Wiki Seed Service

**Files:**
- Create: `server/src/services/wiki-seed.service.ts`
- Create: `server/tests/unit/services/wiki-seed.service.test.ts`

- [ ] **Step 1: Write the failing test file**

```typescript
// server/tests/unit/services/wiki-seed.service.test.ts
import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();

const mockWikiService = {
  createPage: jest.fn<any>(),
  getPage: jest.fn<any>(),
  logOperation: jest.fn<any>(),
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

const { wikiSeedService } = await import(
  '../../../src/services/wiki-seed.service.js'
);

beforeEach(() => {
  jest.clearAllMocks();
  mockWikiService.logOperation.mockResolvedValue(undefined);
  mockWikiIndexService.rebuildIndex.mockResolvedValue(undefined);
});

describe('wikiSeedService.seedUser', () => {
  const userId = 'user-seed-test';

  it('should create all 9 default domain pages', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] }); // no existing pages
    mockWikiService.createPage.mockResolvedValue({ id: 'new-page', slug: 'test' });

    const result = await wikiSeedService.seedUser(userId);

    expect(result.pagesCreated).toBe(9);
    expect(mockWikiService.createPage).toHaveBeenCalledTimes(9);
  });

  it('should skip seeding if user already has wiki pages', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] }); // has pages

    const result = await wikiSeedService.seedUser(userId);

    expect(result.pagesCreated).toBe(0);
    expect(mockWikiService.createPage).not.toHaveBeenCalled();
  });

  it('should continue creating remaining pages if one fails', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
    mockWikiService.createPage
      .mockRejectedValueOnce(new Error('Duplicate'))
      .mockResolvedValue({ id: 'new', slug: 'test' });

    const result = await wikiSeedService.seedUser(userId);

    expect(result.pagesCreated).toBe(8);
    expect(result.errors).toBe(1);
  });

  it('should rebuild index after seeding', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });
    mockWikiService.createPage.mockResolvedValue({ id: 'new', slug: 'test' });

    await wikiSeedService.seedUser(userId);

    expect(mockWikiIndexService.rebuildIndex).toHaveBeenCalledWith(userId);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --experimental-vm-modules node_modules/.bin/jest --testPathPatterns="wiki-seed" --no-coverage 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Create the wiki-seed service**

```typescript
// server/src/services/wiki-seed.service.ts
import { query } from '../config/database.config.js';
import { wikiService } from './wiki.service.js';
import { wikiIndexService } from './wiki-index.service.js';
import { logger } from './logger.service.js';

export interface SeedResult {
  pagesCreated: number;
  errors: number;
}

const DEFAULT_DOMAIN_PAGES = [
  {
    slug: 'fitness-profile',
    pageType: 'pattern' as const,
    category: 'fitness',
    title: 'Fitness Profile',
    summary: 'Overall fitness patterns, workout preferences, and exercise habits.',
    body: '## Fitness Profile\n\nThis page tracks your fitness patterns and preferences. It will be updated automatically as you log workouts and share fitness goals.\n\n### Key Areas\n- Workout frequency and consistency\n- Exercise preferences and performance\n- Recovery patterns\n- Fitness goals and progress',
  },
  {
    slug: 'nutrition-profile',
    pageType: 'pattern' as const,
    category: 'nutrition',
    title: 'Nutrition Profile',
    summary: 'Dietary patterns, meal preferences, and nutritional habits.',
    body: '## Nutrition Profile\n\nThis page tracks your dietary patterns and nutritional habits. Updated as you log meals and discuss nutrition.\n\n### Key Areas\n- Dietary preferences and restrictions\n- Meal timing and frequency\n- Nutritional balance trends\n- Hydration patterns',
  },
  {
    slug: 'sleep-profile',
    pageType: 'pattern' as const,
    category: 'sleep',
    title: 'Sleep Profile',
    summary: 'Sleep patterns, quality indicators, and bedtime habits.',
    body: '## Sleep Profile\n\nThis page tracks your sleep patterns and quality. Updated from wearable data and conversations about sleep.\n\n### Key Areas\n- Sleep duration and consistency\n- Sleep quality indicators\n- Bedtime routine patterns\n- Factors affecting sleep',
  },
  {
    slug: 'mental-wellbeing',
    pageType: 'pattern' as const,
    category: 'wellbeing',
    title: 'Mental Wellbeing',
    summary: 'Stress patterns, mood trends, and mental health indicators.',
    body: '## Mental Wellbeing\n\nThis page tracks your mental health patterns and emotional wellbeing. Updated from mood logs, stress assessments, and conversations.\n\n### Key Areas\n- Stress patterns and triggers\n- Mood trends over time\n- Coping strategies that work\n- Emotional resilience indicators',
  },
  {
    slug: 'lifestyle-context',
    pageType: 'entity' as const,
    category: 'lifestyle',
    title: 'Lifestyle Context',
    summary: 'Daily routines, work patterns, and life circumstances affecting health.',
    body: '## Lifestyle Context\n\nThis page captures your daily routines and life circumstances that affect your health decisions.\n\n### Key Areas\n- Work schedule and demands\n- Social connections and activities\n- Environmental factors\n- Time constraints and priorities',
  },
  {
    slug: 'goals-strategy',
    pageType: 'synthesis' as const,
    category: 'goals',
    title: 'Goals & Strategy',
    summary: 'Current health goals, progress tracking, and strategic approach.',
    body: '## Goals & Strategy\n\nThis page synthesizes your active health goals and the coaching strategies being used to help you achieve them.\n\n### Key Areas\n- Active goals and milestones\n- Progress metrics\n- Strategy adjustments\n- Obstacles and solutions',
  },
  {
    slug: 'coaching-relationship',
    pageType: 'entity' as const,
    category: 'coaching',
    title: 'Coaching Relationship',
    summary: 'Communication preferences, coaching style, and interaction patterns.',
    body: '## Coaching Relationship\n\nThis page tracks how we work together — your communication preferences, what motivates you, and how coaching interactions are most effective.\n\n### Key Areas\n- Communication preferences\n- Motivation styles\n- Feedback preferences\n- Coaching effectiveness patterns',
  },
  {
    slug: 'behavioral-patterns',
    pageType: 'pattern' as const,
    category: 'behavioral',
    title: 'Behavioral Patterns',
    summary: 'Cross-domain behavioral trends, habit loops, and change patterns.',
    body: '## Behavioral Patterns\n\nThis page identifies cross-domain patterns in your behavior — habit loops, triggers, and trends that span fitness, nutrition, sleep, and wellbeing.\n\n### Key Areas\n- Habit formation and consistency\n- Behavioral triggers and responses\n- Cross-domain correlations\n- Change trajectory and velocity',
  },
  {
    slug: 'user-index',
    pageType: 'synthesis' as const,
    category: 'meta',
    title: 'User Index',
    summary: 'Master index linking all domain pages with navigation and status.',
    body: '## User Index\n\nThis page serves as a master navigation hub for all your wiki pages.\n\n### Domain Pages\n- [[fitness-profile]] — Workout patterns and exercise habits\n- [[nutrition-profile]] — Dietary patterns and nutrition\n- [[sleep-profile]] — Sleep quality and patterns\n- [[mental-wellbeing]] — Stress and emotional health\n- [[lifestyle-context]] — Daily routines and circumstances\n- [[goals-strategy]] — Active goals and progress\n- [[coaching-relationship]] — How we work together\n- [[behavioral-patterns]] — Cross-domain trends',
  },
];

class WikiSeedService {
  async seedUser(userId: string): Promise<SeedResult> {
    const result: SeedResult = { pagesCreated: 0, errors: 0 };

    // Check if user already has wiki pages
    const existingResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM wiki_pages WHERE user_id = $1`,
      [userId]
    );

    const existingCount = parseInt(existingResult.rows[0]?.count ?? '0', 10);
    if (existingCount > 0) {
      logger.debug('[WikiSeed] User already has wiki pages, skipping', {
        userId,
        existingCount,
      });
      return result;
    }

    // Create all default domain pages
    for (const page of DEFAULT_DOMAIN_PAGES) {
      try {
        await wikiService.createPage(userId, {
          ...page,
          confidence: 0.1,
        });
        result.pagesCreated++;
      } catch (error) {
        result.errors++;
        logger.warn('[WikiSeed] Failed to create seed page', {
          userId,
          slug: page.slug,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Rebuild index
    if (result.pagesCreated > 0) {
      await wikiIndexService.rebuildIndex(userId);

      await wikiService.logOperation(userId, {
        operation: 'create',
        summary: `Seeded ${result.pagesCreated} default domain pages`,
        pagesTouched: result.pagesCreated,
      });

      logger.info('[WikiSeed] User seeded', {
        userId,
        pagesCreated: result.pagesCreated,
        errors: result.errors,
      });
    }

    return result;
  }
}

export const wikiSeedService = new WikiSeedService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --experimental-vm-modules node_modules/.bin/jest --testPathPatterns="wiki-seed" --no-coverage 2>&1 | tail -20`
Expected: 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add server/src/services/wiki-seed.service.ts server/tests/unit/services/wiki-seed.service.test.ts
git commit -m "feat(wiki): add WikiSeedService for default domain page initialization"
```

---

### Task 5: Wire Seeding into Conversation Flow

**Files:**
- Modify: `server/src/services/wiki-compiler.service.ts`

- [ ] **Step 1: Read the wiki-compiler service to understand its structure**

The wiki compiler runs after each conversation turn. We need to add a check: if the user has no wiki pages, seed them before processing the conversation.

- [ ] **Step 2: Add import for wiki-seed service**

```typescript
import { wikiSeedService } from './wiki-seed.service.js';
```

- [ ] **Step 3: Add seeding check at the start of processConversationTurn**

At the very beginning of the `processConversationTurn` method (before any other wiki operations), add:

```typescript
// Seed wiki for first-time users (no-op if pages already exist)
await wikiSeedService.seedUser(userId);
```

This is idempotent — `seedUser` checks if pages already exist and returns immediately if they do.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/wiki-compiler.service.ts
git commit -m "feat(wiki): auto-seed wiki pages on first conversation for new users"
```

---

### Task 6: Run All Wiki Tests

**Files:** None (verification only)

- [ ] **Step 1: Run all wiki tests**

Run all wiki test files to verify everything passes:

```bash
cd server && node --experimental-vm-modules node_modules/.bin/jest --no-coverage \
  tests/unit/services/wiki.service.test.ts \
  tests/unit/services/wiki-index.service.test.ts \
  tests/unit/services/wiki-context.service.test.ts \
  tests/unit/services/wiki-compiler.service.test.ts \
  tests/unit/services/wiki-ingest.service.test.ts \
  tests/unit/services/wiki-ingest-data-event.test.ts \
  tests/unit/jobs/wiki-synthesis.job.test.ts \
  tests/unit/workers/activity-event-processor-wiki.test.ts \
  tests/unit/services/wiki-lint.service.test.ts \
  tests/unit/jobs/wiki-lint.job.test.ts \
  tests/unit/services/wiki-seed.service.test.ts \
  2>&1 | tail -30
```

Expected: All tests pass (Phase 0+1: 28 tests, Phase 2: 13 tests, Phase 4: 13 new tests = 54 total).

- [ ] **Step 2: Verify server TypeScript compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

## Self-Review Checklist

### Spec coverage
- [x] `wiki-lint.service.ts` — stale detection via `markStalePages()`, orphan detection via `getOrphans()`, broken link detection via SQL query
- [x] Lint scheduled job — 12h interval, staggered startup at 1800s, batch processing
- [x] Lint registered at server startup
- [x] Wiki seeding — 9 default domain pages matching spec section 3.2.1
- [x] Auto-seed on first conversation
- [ ] Analytics layer — Deferred (metrics derive from existing wiki data, surfaced via artifacts system)
- [ ] Graph visualization — Deferred (requires D3 dependency evaluation)
- [ ] Performance optimization — Deferred (token budgets are in wiki-synthesis job already)

### Placeholder scan
- No TBD, TODO, or incomplete sections
- All code blocks are complete
- All file paths are exact

### Type consistency
- `LintResult` — `{ staleMarked, orphansFound, brokenLinks, errors }`
- `SeedResult` — `{ pagesCreated, errors }`
- `wikiLintService.lintUser(userId)` consistent across service, job, and tests
- `wikiSeedService.seedUser(userId)` consistent across service and compiler
- `DEFAULT_DOMAIN_PAGES` uses `WikiPageType` literals matching the spec's domain hierarchy
