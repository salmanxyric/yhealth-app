# LLM Wiki Phase 2: Deep Synthesis + Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add daily deep synthesis (Memory Compiler Mode 2), data-event micro-ingest, and enhanced system prompt wiki instructions to the LLM Wiki Layer.

**Architecture:** Phase 2 adds three capabilities on top of Phase 0+1 infrastructure: (1) a `wiki-synthesis.job.ts` interval-based job that runs every 6 hours, gathers fresh data signals and LLM-rewrites wiki domain page narratives; (2) a `wikiIngestService.ingestFromDataEvent()` method wired into the activity-event-processor worker to micro-ingest workout/nutrition/wellbeing events into matching wiki pages; (3) an expanded system prompt constant with synthesis-specific behavioral rules for the AI Coach.

**Tech Stack:** TypeScript, LangChain/LangGraph, PostgreSQL, BullMQ (Redis), Jest 30 ESM

**Branch:** `feat/wiki-intelligence-layer` (continuing from Phase 0+1)

**Depends on:** Phase 0+1 complete (9 commits). Key existing services: `wiki.service.ts`, `wiki-index.service.ts`, `wiki-context.service.ts`, `wiki-compiler.service.ts`, `wiki-ingest.service.ts`.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/src/jobs/wiki-synthesis.job.ts` | Interval-based job: gather 24h signals, LLM-rewrite domain pages, update index |
| Create | `server/tests/unit/jobs/wiki-synthesis.job.test.ts` | Unit tests for synthesis job |
| Modify | `server/src/services/wiki-ingest.service.ts` | Add `ingestFromDataEvent()` method |
| Create | `server/tests/unit/services/wiki-ingest-data-event.test.ts` | Tests for data-event micro-ingest |
| Modify | `server/src/workers/activity-event-processor.worker.ts` | Wire `ingestFromDataEvent()` into activity event processing |
| Create | `server/tests/unit/workers/activity-event-processor-wiki.test.ts` | Tests for wiki integration in activity worker |
| Modify | `server/src/services/langgraph-chatbot.service.ts` | Expand `WIKI_KNOWLEDGE_BASE_PROMPT` with synthesis instructions |
| Modify | `server/src/index.ts` | Register wiki synthesis job at startup |

---

## Task 1: Wiki Synthesis Job — Core Structure + Tests

**Files:**
- Create: `server/tests/unit/jobs/wiki-synthesis.job.test.ts`
- Create: `server/src/jobs/wiki-synthesis.job.ts`

### Context for the implementer

The synthesis job is Mode 2 of the Memory Compiler — a scheduled job that runs every 6 hours (not a BullMQ queue worker). It follows the same interval-based pattern as `server/src/jobs/daily-analysis.job.ts`: a `start()` / `stop()` / `processNow()` lifecycle with `setInterval`, a `STARTUP_DELAY_MS` to stagger from other jobs, batch processing with `Promise.allSettled`, and structured logging.

The job finds users who have wiki activity in the last 24 hours, then for each user: loads all their wiki domain pages, gathers recent data signals (new memories, raw data counts), builds an LLM prompt asking for narrative rewrites, and updates each domain page with the synthesized content.

**Important API contracts:**
- `wikiService.searchPages(userId, query, { limit })` returns `WikiSearchResult[]` — each item has `{ page: WikiPage, similarity: number, matchContext: string | null }`
- `wikiService.getPage(userId, slug)` returns `WikiPageWithLinks | null`
- `wikiService.updatePage(userId, slug, { body?, summary?, confidence?, changeReason })` returns `WikiPage`
- `wikiService.logOperation(userId, { operation: WikiLogOperation, summary, pagesTouched, ... })` returns `void`
- `wikiIndexService.rebuildIndex(userId)` returns `void`
- `modelFactory.getModel({ tier, temperature, maxTokens })` returns `BaseChatModel`
- `WikiLogOperation` is a union: `'ingest' | 'update' | 'create' | 'lint' | 'query_filed' | 'contradiction_detected' | 'stale_marked' | 'archived'`

- [ ] **Step 1: Write the test file**

```typescript
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
    // No pages at all
    mockQuery.mockResolvedValueOnce({ rows: [] }); // domain pages query

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(0);
    expect(mockWikiService.updatePage).not.toHaveBeenCalled();
  });

  it('should skip user when there are no recent data signals', async () => {
    // Return domain pages
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'fitness-profile' }],
    });
    // Return zero recent signals
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '0' }] });

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(0);
    expect(mockLlmInvoke).not.toHaveBeenCalled();
  });

  it('should call LLM and update page when signals exist', async () => {
    // Domain pages
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'fitness-profile' }],
    });
    // Recent signals count
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '5' }] });
    // Recent data signals (for building LLM prompt)
    mockQuery.mockResolvedValueOnce({
      rows: [
        { source_table: 'workout_logs', summary: 'Did 45min HIIT' },
        { source_table: 'workout_logs', summary: 'Morning jog 30min' },
      ],
    });

    // getPage returns full page for the domain slug
    const existingPage = makeFullPage('fitness-profile', 0.6);
    mockWikiService.getPage.mockResolvedValueOnce(existingPage);

    // LLM returns synthesized update
    mockLlmInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        summary: 'Updated fitness summary with HIIT and jogging patterns.',
        body: '## Fitness Profile\n\nUser does HIIT and jogging regularly.',
        confidence: 0.72,
      }),
    });

    // updatePage returns updated page
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
    // 25 domain pages
    const slugs = Array.from({ length: 25 }, (_, i) => ({ slug: `page-${i}` }));
    mockQuery.mockResolvedValueOnce({ rows: slugs });
    // Recent signals
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '10' }] });
    // Data signals (returned for each page)
    mockQuery.mockResolvedValue({
      rows: [{ source_table: 'workout_logs', summary: 'Activity' }],
    });

    // getPage returns full page for each slug
    mockWikiService.getPage.mockImplementation((_uid: string, slug: string) =>
      Promise.resolve(makeFullPage(slug, 0.5))
    );

    // LLM returns valid synthesis for each
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
    // Two domain pages
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'fitness-profile' }, { slug: 'nutrition-profile' }],
    });
    // Signals exist
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '3' }] });
    // Data signals
    mockQuery.mockResolvedValue({
      rows: [{ source_table: 'meal_logs', summary: 'Ate salad' }],
    });

    mockWikiService.getPage
      .mockResolvedValueOnce(makeFullPage('fitness-profile', 0.5))
      .mockResolvedValueOnce(makeFullPage('nutrition-profile', 0.5));

    // First LLM call fails, second succeeds
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

    // Only the second page should have been updated
    expect(result.pagesUpdated).toBe(1);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should skip LLM call when page body has not changed since last synthesis', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ slug: 'sleep-profile' }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ signal_count: '2' }] });
    // No data signals relevant to this page
    mockQuery.mockResolvedValueOnce({ rows: [] });

    mockWikiService.getPage.mockResolvedValueOnce(
      makeFullPage('sleep-profile', 0.8)
    );

    const result = await processWikiSynthesisForUser(userId);

    expect(result.pagesUpdated).toBe(0);
    expect(mockLlmInvoke).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/jobs/wiki-synthesis.job.test.ts --no-coverage`
Expected: FAIL — module `../../../src/jobs/wiki-synthesis.job.js` not found

- [ ] **Step 3: Write the wiki-synthesis.job.ts implementation**

```typescript
// server/src/jobs/wiki-synthesis.job.ts
/**
 * @file Wiki Synthesis Job (Memory Compiler Mode 2)
 * @description Scheduled job that runs every 6 hours. For each user with recent
 * wiki activity, it gathers data signals from the last 24 hours, asks the LLM to
 * rewrite wiki domain page narratives, and persists the updates.
 *
 * Follows the same interval-based lifecycle as daily-analysis.job.ts.
 */

import { query } from '../config/database.config.js';
import { wikiService } from '../services/wiki.service.js';
import { wikiIndexService } from '../services/wiki-index.service.js';
import { modelFactory } from '../services/model-factory.service.js';
import { logger } from '../services/logger.service.js';

// ============================================
// CONFIGURATION
// ============================================

const JOB_INTERVAL_MS = 6 * 60 * 60 * 1000; // Every 6 hours
const STARTUP_DELAY_MS = 1620 * 1000; // 27 minutes — after memory extraction (1500s) + core profile (1560s)
const BATCH_SIZE = 3; // Users per batch (LLM-heavy)
const INTER_BATCH_DELAY_MS = 5000;
const MAX_PAGES_PER_SYNTHESIS = 20;
const MAX_SIGNALS_PER_PAGE = 10;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

// ============================================
// TYPES
// ============================================

export interface SynthesisResult {
  pagesUpdated: number;
  errors: number;
}

interface DataSignal {
  source_table: string;
  summary: string;
}

// ============================================
// PER-USER SYNTHESIS (exported for testing)
// ============================================

export async function processWikiSynthesisForUser(userId: string): Promise<SynthesisResult> {
  const result: SynthesisResult = { pagesUpdated: 0, errors: 0 };

  try {
    // 1. Get user's domain wiki pages (active only)
    const pagesResult = await query<{ slug: string }>(
      `SELECT slug FROM wiki_pages
       WHERE user_id = $1 AND status = 'active'
       ORDER BY confidence DESC
       LIMIT $2`,
      [userId, MAX_PAGES_PER_SYNTHESIS + 5]
    );

    if (pagesResult.rows.length === 0) {
      return result;
    }

    // 2. Check if there are recent data signals (last 24h)
    const signalCountResult = await query<{ signal_count: string }>(
      `SELECT COUNT(*) as signal_count FROM (
        SELECT id FROM wiki_page_sources
          WHERE page_id IN (SELECT id FROM wiki_pages WHERE user_id = $1)
            AND created_at > NOW() - INTERVAL '24 hours'
        UNION ALL
        SELECT id FROM wiki_log
          WHERE user_id = $1
            AND created_at > NOW() - INTERVAL '24 hours'
      ) combined`,
      [userId]
    );

    const signalCount = parseInt(signalCountResult.rows[0]?.signal_count ?? '0', 10);
    if (signalCount === 0) {
      return result;
    }

    // 3. Process each domain page (capped at MAX_PAGES_PER_SYNTHESIS)
    const pageSlugs = pagesResult.rows.slice(0, MAX_PAGES_PER_SYNTHESIS);
    const llm = modelFactory.getModel({
      tier: 'default',
      temperature: 0.4,
      maxTokens: 2000,
    });

    for (const { slug } of pageSlugs) {
      try {
        // Fetch recent data signals relevant to this page's category
        const fullPage = await wikiService.getPage(userId, slug);
        if (!fullPage) continue;

        const signalsResult = await query<DataSignal>(
          `SELECT wps.source_table, wps.extract_summary as summary
           FROM wiki_page_sources wps
           WHERE wps.page_id = $1
             AND wps.created_at > NOW() - INTERVAL '24 hours'
           ORDER BY wps.created_at DESC
           LIMIT $2`,
          [fullPage.id, MAX_SIGNALS_PER_PAGE]
        );

        if (signalsResult.rows.length === 0) {
          continue;
        }

        // Build LLM prompt
        const signalsSummary = signalsResult.rows
          .map((s) => `- [${s.source_table}] ${s.summary}`)
          .join('\n');

        const prompt = `You are updating a wiki page for a health coaching system. Rewrite the page narrative to incorporate new evidence.

CURRENT PAGE:
Title: ${fullPage.title}
Category: ${fullPage.category}
Current Summary: ${fullPage.summary}
Current Body:
${fullPage.body}

Current Confidence: ${fullPage.confidence}

NEW EVIDENCE (last 24 hours):
${signalsSummary}

INSTRUCTIONS:
1. Merge the new evidence into the existing narrative naturally
2. Do NOT delete existing insights — augment them
3. Update the confidence score: bump slightly (+0.02-0.05) if evidence reinforces, or flag contradiction
4. Keep the same markdown structure and [[wiki-link]] references
5. Return ONLY valid JSON with this shape:
{
  "summary": "updated one-line summary (max 500 chars)",
  "body": "updated full markdown body",
  "confidence": 0.XX
}`;

        const response = await llm.invoke(prompt);
        const content = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

        // Parse LLM response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          logger.warn('[WikiSynthesis] LLM returned non-JSON response, skipping page', {
            userId,
            slug,
          });
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]) as {
          summary?: string;
          body?: string;
          confidence?: number;
        };

        if (!parsed.body && !parsed.summary) {
          continue;
        }

        // Update the page
        await wikiService.updatePage(userId, slug, {
          ...(parsed.summary && { summary: parsed.summary }),
          ...(parsed.body && { body: parsed.body }),
          ...(parsed.confidence !== undefined && {
            confidence: Math.min(1.0, Math.max(0, parsed.confidence)),
          }),
          changeReason: `Deep synthesis: incorporated ${signalsResult.rows.length} new signal(s)`,
        });

        result.pagesUpdated++;
      } catch (pageError) {
        result.errors++;
        logger.warn('[WikiSynthesis] Failed to synthesize page', {
          userId,
          slug,
          error: pageError instanceof Error ? pageError.message : String(pageError),
        });
      }
    }

    // 4. Rebuild index if any pages were updated
    if (result.pagesUpdated > 0) {
      await wikiIndexService.rebuildIndex(userId);

      await wikiService.logOperation(userId, {
        operation: 'update',
        summary: `Deep synthesis: updated ${result.pagesUpdated} page(s) from ${signalCount} signal(s)`,
        pagesTouched: result.pagesUpdated,
      });
    }
  } catch (error) {
    logger.error('[WikiSynthesis] processWikiSynthesisForUser failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return result;
}

// ============================================
// JOB PROCESSOR
// ============================================

async function processWikiSynthesis(): Promise<void> {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    // Find users with recent wiki activity
    const usersResult = await query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM wiki_log
       WHERE created_at > NOW() - INTERVAL '24 hours'
       ORDER BY user_id
       LIMIT 50`,
    );

    if (usersResult.rows.length === 0) {
      logger.debug('[WikiSynthesis] No users with recent wiki activity');
      return;
    }

    let totalUpdated = 0;
    let totalErrors = 0;

    for (let i = 0; i < usersResult.rows.length; i += BATCH_SIZE) {
      const batch = usersResult.rows.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((row) => processWikiSynthesisForUser(row.user_id))
      );

      for (const r of results) {
        if (r.status === 'fulfilled') {
          totalUpdated += r.value.pagesUpdated;
          totalErrors += r.value.errors;
        } else {
          totalErrors++;
        }
      }

      if (i + BATCH_SIZE < usersResult.rows.length) {
        await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
      }
    }

    if (totalUpdated > 0 || totalErrors > 0) {
      logger.info('[WikiSynthesis] Processing complete', {
        usersProcessed: usersResult.rows.length,
        totalPagesUpdated: totalUpdated,
        totalErrors,
      });
    }
  } catch (error) {
    logger.error('[WikiSynthesis] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isRunning = false;
  }
}

// ============================================
// JOB LIFECYCLE
// ============================================

export function startWikiSynthesis(): void {
  if (intervalId) {
    logger.warn('[WikiSynthesis] Already running');
    return;
  }

  logger.info('[WikiSynthesis] Starting wiki synthesis job', {
    intervalMs: JOB_INTERVAL_MS,
    startupDelayMs: STARTUP_DELAY_MS,
    batchSize: BATCH_SIZE,
  });

  setTimeout(() => {
    processWikiSynthesis();
    intervalId = setInterval(processWikiSynthesis, JOB_INTERVAL_MS);
  }, STARTUP_DELAY_MS);
}

export function stopWikiSynthesis(): void {
  if (!intervalId) {
    logger.warn('[WikiSynthesis] Not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  logger.info('[WikiSynthesis] Stopped wiki synthesis job');
}

export function isWikiSynthesisRunning(): boolean {
  return intervalId !== null;
}

// ============================================
// EXPORTS
// ============================================

export const wikiSynthesisJob = {
  start: startWikiSynthesis,
  stop: stopWikiSynthesis,
  isRunning: isWikiSynthesisRunning,
  processNow: processWikiSynthesis,
};

export default wikiSynthesisJob;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/jobs/wiki-synthesis.job.test.ts --no-coverage`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/jobs/wiki-synthesis.job.ts server/tests/unit/jobs/wiki-synthesis.job.test.ts
git commit -m "feat(wiki): add wiki synthesis job (Memory Compiler Mode 2)"
```

---

## Task 2: Register Wiki Synthesis Job at Startup

**Files:**
- Modify: `server/src/index.ts` (~line 456, after `coreProfileCalibrationJob`)

### Context for the implementer

All background jobs are registered in `server/src/index.ts` with staggered `setTimeout` calls. The last job is registered at `1560_000` ms (26 minutes). The wiki synthesis job should start at `1620_000` ms (27 minutes) to avoid overlap with memory extraction and core profile jobs.

- [ ] **Step 1: Add the import**

At the top of `server/src/index.ts`, around the other job imports (search for `import.*Job` near lines 20-110), add:

```typescript
import { wikiSynthesisJob } from './jobs/wiki-synthesis.job.js';
```

- [ ] **Step 2: Add the startup registration**

After the `coreProfileCalibrationJob` setTimeout block (around line 456), add:

```typescript
        setTimeout(() => {
          wikiSynthesisJob.start();
          logger.info("Wiki synthesis job started (staggered 1620s)");
        }, 1620_000);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts
git commit -m "feat(wiki): register wiki synthesis job at server startup"
```

---

## Task 3: Data-Event Micro-Ingest — Service Method + Tests

**Files:**
- Create: `server/tests/unit/services/wiki-ingest-data-event.test.ts`
- Modify: `server/src/services/wiki-ingest.service.ts`

### Context for the implementer

The `WikiIngestService` at `server/src/services/wiki-ingest.service.ts` currently has two methods: `initializeDomainPages(userId)` and `ingestFromConversation(userId, conversationId)`. We need to add `ingestFromDataEvent(userId, event)` which takes a lightweight data event (from the activity-event-processor worker) and bumps the confidence of matching wiki domain pages.

This is a micro-ingest — no LLM calls, just semantic page matching and confidence updates. The event has `type` (workout/nutrition/wellbeing/participation), `source`, and `timestamp`. The method maps event types to wiki categories (workout → fitness, nutrition → nutrition, wellbeing → wellbeing/sleep), loads the matching domain page, bumps confidence by 0.01, and adds a source reference.

**Key API contracts (same as wiki-compiler.service.ts):**
- `wikiService.searchPages(userId, queryText, { limit })` returns `WikiSearchResult[]`
- `wikiService.getPage(userId, slug)` returns `WikiPageWithLinks | null`
- `wikiService.updatePage(userId, slug, { confidence, changeReason })` returns `WikiPage`
- `wikiService.addSources(pageId, [{ sourceType, sourceId, sourceTable, extractSummary }])` returns `void`

- [ ] **Step 1: Write the test file**

```typescript
// server/tests/unit/services/wiki-ingest-data-event.test.ts
/**
 * WikiIngestService.ingestFromDataEvent() Unit Tests
 *
 * Tests for data-event micro-ingest — lightweight wiki updates
 * triggered by activity events (workout, nutrition, wellbeing).
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/services/wiki-ingest-data-event.test.ts --no-coverage`
Expected: FAIL — `wikiIngestService.ingestFromDataEvent is not a function`

- [ ] **Step 3: Add the `ingestFromDataEvent` method to WikiIngestService**

In `server/src/services/wiki-ingest.service.ts`, add the following interface above the class definition (after the existing `IngestResult` interface, around line 35):

```typescript
export interface DataEventInput {
  type: 'workout' | 'nutrition' | 'wellbeing' | 'participation';
  eventId: string;
  source: string;
  timestamp: string;
}
```

Then add a constant mapping event types to wiki domain page slugs (after `MAX_PAGES_PER_INGEST`, around line 18):

```typescript
const EVENT_TYPE_TO_SLUG: Record<string, string> = {
  workout: 'fitness-profile',
  nutrition: 'nutrition-profile',
  wellbeing: 'mental-wellbeing',
  participation: 'lifestyle-context',
};

const DATA_EVENT_CONFIDENCE_BUMP = 0.01;
```

Then add this method inside the `WikiIngestService` class, after the `ingestFromConversation` method (after line 284):

```typescript
  // ------------------------------------------
  // ingestFromDataEvent
  // ------------------------------------------

  /**
   * Micro-ingest a single data event (workout, meal, mood, etc.)
   * into the matching wiki domain page. No LLM call — just bumps
   * confidence and adds a source reference.
   */
  async ingestFromDataEvent(
    userId: string,
    event: DataEventInput
  ): Promise<{ pagesUpdated: number }> {
    try {
      const slug = EVENT_TYPE_TO_SLUG[event.type];
      if (!slug) {
        return { pagesUpdated: 0 };
      }

      const page = await wikiService.getPage(userId, slug);
      if (!page) {
        return { pagesUpdated: 0 };
      }

      const newConfidence = Math.min(1.0, (page.confidence ?? 0.1) + DATA_EVENT_CONFIDENCE_BUMP);

      await wikiService.updatePage(userId, slug, {
        confidence: newConfidence,
        changeReason: `Micro-ingest: ${event.type} event (${event.source})`,
      });

      await wikiService.addSources(page.id, [
        {
          sourceType: 'activity_event',
          sourceId: event.eventId,
          sourceTable: 'activity_events',
          extractSummary: `${event.type} event from ${event.source} at ${event.timestamp}`,
        },
      ]);

      return { pagesUpdated: 1 };
    } catch (error) {
      logger.error('[WikiIngest] ingestFromDataEvent failed', {
        userId,
        event,
        error: error instanceof Error ? error.message : String(error),
      });
      return { pagesUpdated: 0 };
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/services/wiki-ingest-data-event.test.ts --no-coverage`
Expected: 5 tests PASS

- [ ] **Step 5: Run ALL wiki ingest tests to verify no regressions**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/services/wiki-ingest --no-coverage`
Expected: All tests PASS (both original 7 + new 5)

- [ ] **Step 6: Commit**

```bash
git add server/src/services/wiki-ingest.service.ts server/tests/unit/services/wiki-ingest-data-event.test.ts
git commit -m "feat(wiki): add data-event micro-ingest to WikiIngestService"
```

---

## Task 4: Wire Data-Event Ingest into Activity Event Processor

**Files:**
- Create: `server/tests/unit/workers/activity-event-processor-wiki.test.ts`
- Modify: `server/src/workers/activity-event-processor.worker.ts`

### Context for the implementer

The activity-event-processor worker at `server/src/workers/activity-event-processor.worker.ts` is a BullMQ `Worker` listening on `QueueNames.ACTIVITY_EVENT_PROCESSING`. When a job arrives, it currently only calls `aiScoringService.calculateDailyScore()`. We need to add a fire-and-forget call to `wikiIngestService.ingestFromDataEvent()` after the scoring update.

The job data has interface: `{ eventId: string; userId: string; type: 'workout' | 'nutrition' | 'wellbeing' | 'participation'; timestamp: string }`.

The wiki ingest call must be non-blocking (`.catch()` pattern) — it should never cause the activity event job to fail.

- [ ] **Step 1: Write the test file**

```typescript
// server/tests/unit/workers/activity-event-processor-wiki.test.ts
/**
 * Activity Event Processor — Wiki Integration Tests
 *
 * Verifies that the activity-event-processor worker calls
 * wikiIngestService.ingestFromDataEvent() for each processed event.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockCalculateDailyScore = jest.fn<any>();
const mockSaveDailyScore = jest.fn<any>();
const mockIngestFromDataEvent = jest.fn<any>();

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/ai-scoring.service.js', () => ({
  aiScoringService: {
    calculateDailyScore: mockCalculateDailyScore,
    saveDailyScore: mockSaveDailyScore,
  },
}));

jest.unstable_mockModule('../../../src/services/wiki-ingest.service.js', () => ({
  wikiIngestService: {
    ingestFromDataEvent: mockIngestFromDataEvent,
  },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/config/queue.config.js', () => ({
  redisConnection: {},
  QueueNames: { ACTIVITY_EVENT_PROCESSING: 'test-activity-processing' },
}));

// Mock BullMQ Worker to capture the processor function
let capturedProcessor: ((job: any) => Promise<void>) | null = null;

jest.unstable_mockModule('bullmq', () => ({
  Worker: class MockWorker {
    constructor(_queueName: string, processor: (job: any) => Promise<void>) {
      capturedProcessor = processor;
    }
    on() { return this; }
    close() { return Promise.resolve(); }
  },
}));

// ============================================
// IMPORT UNDER TEST
// ============================================

await import('../../../src/workers/activity-event-processor.worker.js');

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockIngestFromDataEvent.mockResolvedValue({ pagesUpdated: 1 });
  mockCalculateDailyScore.mockResolvedValue({
    userId: 'user-1',
    date: '2026-05-08',
    totalScore: 75,
  });
  mockSaveDailyScore.mockResolvedValue(undefined);
});

describe('Activity Event Processor — Wiki Integration', () => {
  it('should call wikiIngestService.ingestFromDataEvent after scoring', async () => {
    expect(capturedProcessor).not.toBeNull();

    const job = {
      data: {
        eventId: 'evt-100',
        userId: 'user-abc',
        type: 'workout',
        timestamp: '2026-05-08T10:00:00Z',
      },
    };

    await capturedProcessor!(job);

    expect(mockCalculateDailyScore).toHaveBeenCalledTimes(1);
    expect(mockSaveDailyScore).toHaveBeenCalledTimes(1);

    // Give fire-and-forget a tick to execute
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockIngestFromDataEvent).toHaveBeenCalledWith('user-abc', {
      type: 'workout',
      eventId: 'evt-100',
      source: 'activity_event',
      timestamp: '2026-05-08T10:00:00Z',
    });
  });

  it('should not fail the job when wiki ingest throws', async () => {
    mockIngestFromDataEvent.mockRejectedValueOnce(new Error('Wiki DB down'));

    const job = {
      data: {
        eventId: 'evt-101',
        userId: 'user-abc',
        type: 'nutrition',
        timestamp: '2026-05-08T12:00:00Z',
      },
    };

    // Should NOT throw even though wiki ingest fails
    await expect(capturedProcessor!(job)).resolves.not.toThrow();

    expect(mockCalculateDailyScore).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/workers/activity-event-processor-wiki.test.ts --no-coverage`
Expected: FAIL — `mockIngestFromDataEvent` not called (the worker doesn't call it yet)

- [ ] **Step 3: Modify the activity-event-processor worker**

In `server/src/workers/activity-event-processor.worker.ts`:

**Add import** after the existing imports (around line 4):

```typescript
import { wikiIngestService } from '../services/wiki-ingest.service.js';
```

**Add wiki ingest call** inside the worker processor, after `aiScoringService.saveDailyScore(score)` (around line 58), before the success log message:

```typescript
          // Wiki micro-ingest — fire-and-forget, non-blocking
          wikiIngestService
            .ingestFromDataEvent(data.userId, {
              type: data.type,
              eventId: data.eventId,
              source: 'activity_event',
              timestamp: data.timestamp,
            })
            .catch((error) => {
              logger.warn('[ActivityEventProcessor] Wiki ingest failed (non-critical)', {
                eventId: data.eventId,
                error: error instanceof Error ? error.message : 'Unknown',
              });
            });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest tests/unit/workers/activity-event-processor-wiki.test.ts --no-coverage`
Expected: 2 tests PASS

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add server/src/workers/activity-event-processor.worker.ts server/tests/unit/workers/activity-event-processor-wiki.test.ts
git commit -m "feat(wiki): wire data-event micro-ingest into activity event processor"
```

---

## Task 5: Expand System Prompt with Synthesis Instructions

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts` (lines 381-413)

### Context for the implementer

The `WIKI_KNOWLEDGE_BASE_PROMPT` constant at line 381 of `server/src/services/langgraph-chatbot.service.ts` is already included in the system prompt at two locations (line 2088 and line 2194). We need to expand it with synthesis-specific behavioral instructions that tell the AI Coach how to use the wiki more effectively — when to file synthesis pages, how to handle the daily synthesis updates, and wiki citation conventions.

This is a text-only change — no new functions, no tests needed. The goal is to align the AI Coach's behavior with the Phase 2 capabilities.

- [ ] **Step 1: Expand the WIKI_KNOWLEDGE_BASE_PROMPT constant**

In `server/src/services/langgraph-chatbot.service.ts`, replace the entire `WIKI_KNOWLEDGE_BASE_PROMPT` constant (lines 381-413) with:

```typescript
const WIKI_KNOWLEDGE_BASE_PROMPT = `
## PERSONAL HEALTH WIKI

You maintain a personal wiki for this user — a structured collection of interlinked pages that captures everything you've learned about them. The wiki is your long-term analytical notebook.

### When to use the wiki:
- ALWAYS search the wiki first (search_wiki_pages) before answering complex health questions
- When you discover a new pattern about the user → create a wiki page
- When you notice a contradiction between wiki claims → flag it with flag_wiki_contradiction
- When a user asks a great question and your answer is insightful → file it with file_query_as_wiki_page
- When new data changes what you know → update the relevant wiki page

### Wiki page conventions:
- Use [[slug]] syntax for cross-references to other wiki pages
- Every claim should cite evidence: data table, memory ID, or date range
- Mark confidence honestly (0-1) — don't inflate
- Note contradictions with a ⚠️ prefix
- One topic per page — link to related pages rather than cramming everything in

### Page types:
- **entity**: Things (supplements, exercises, foods, conditions, people)
- **concept**: Ideas (progressive overload, sleep hygiene, caloric deficit)
- **pattern**: User-specific behaviors (morning motivation spike, weekend nutrition drift)
- **journal**: Time summaries (weekly, monthly, quarterly reviews)
- **synthesis**: Cross-cutting analysis (sleep vs performance correlation)
- **source**: Ingested document summaries (articles, podcast notes)

### Quality rules:
- Never delete a wiki page — archive it instead
- Always provide a changeReason when updating
- Prefer updating an existing page over creating a near-duplicate
- Search before creating to avoid duplicates

### Synthesis protocol:
Your wiki pages are updated automatically every few hours by a background synthesis engine. When you notice a page has been recently updated (check the confidence and version), trust the synthesis and build on it rather than re-deriving from scratch.

When answering complex questions:
1. Search the wiki for relevant pages
2. If a wiki page covers the topic, cite it: "Based on your [[page-slug]] profile..."
3. If your answer reveals a new cross-domain insight, file it as a synthesis page
4. If you spot a contradiction between a wiki page and current data, flag it

### Domain hierarchy:
The user has pre-initialized domain pages: fitness-profile, nutrition-profile, sleep-profile, mental-wellbeing, lifestyle-context, goals-strategy, coaching-relationship, behavioral-patterns, and user-index. These are living documents — update them when you learn something new rather than creating separate pages for each fact.
`;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/src/services/langgraph-chatbot.service.ts
git commit -m "feat(wiki): expand system prompt with synthesis protocol and domain hierarchy instructions"
```

---

## Task 6: Run Full Test Suite + TypeScript Verification

**Files:**
- No new files — verification only

### Context for the implementer

Run all wiki-related tests and the TypeScript compiler to verify Phase 2 introduces no regressions.

- [ ] **Step 1: Run all wiki-related tests**

Run: `cd server && npx cross-env NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern="wiki" --no-coverage`
Expected: All tests PASS (28 from Phase 0+1 + 13 new from Phase 2 = ~41 tests)

- [ ] **Step 2: Run TypeScript compiler**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify no lint issues in new files**

Run: `cd server && npx eslint src/jobs/wiki-synthesis.job.ts src/services/wiki-ingest.service.ts src/workers/activity-event-processor.worker.ts --no-error-on-unmatched-pattern`
Expected: No errors (warnings are acceptable)

- [ ] **Step 4: Verify git status is clean**

Run: `git status`
Expected: All changes committed, nothing untracked

---

## Summary

| Task | Component | Tests | Files Changed |
|------|-----------|-------|---------------|
| 1 | Wiki synthesis job | 6 | 2 created |
| 2 | Job startup registration | 0 | 1 modified |
| 3 | Data-event micro-ingest | 5 | 2 (1 created, 1 modified) |
| 4 | Activity worker integration | 2 | 2 (1 created, 1 modified) |
| 5 | System prompt expansion | 0 | 1 modified |
| 6 | Full verification | 0 | 0 |
| **Total** | | **13 new tests** | **5 created, 3 modified** |
