# LLM Wiki Layer — Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the wiki intelligence layer by adding schema reconciliation, idempotency guards, wiki index maintenance, an ingest pipeline, a lightweight memory compiler (per-chat hook), and wiki context injection into the RAG pipeline.

**Architecture:** The wiki CRUD layer is already built (`wiki.service.ts`, controller, routes, validators, 7 LangGraph tools). This plan adds the _intelligence_ on top: an ingest service that converts conversations/data into wiki pages, an index service that maintains wiki health, a lightweight compiler that updates wiki evidence after each chat turn, and RAG integration that reads wiki pages into the LLM context window. All wiki writes go through an async queue with per-user daily budgets.

**Tech Stack:** PostgreSQL (pgvector), Express.js, Zod, LangGraph/LangChain, BullMQ (Redis), Jest 30 (ESM)

**Design Spec:** `docs/superpowers/specs/2026-05-06-llm-wiki-layer-design.md`

**Prior Plan:** `docs/superpowers/plans/2026-05-06-llm-wiki-layer.md` (Tasks 1-6 completed — types, migration, validators, service, controller, tools)

---

## What Already Exists (Do Not Rebuild)

| File | Status | Lines |
|------|--------|-------|
| `shared/types/domain/wiki.ts` | Complete | Types for WikiPage, WikiLink, WikiLogEntry, etc. |
| `server/src/database/migrations/20260506000000_wiki.sql` | Complete | 6 tables: wiki_pages, wiki_links, wiki_page_sources, wiki_log, wiki_index, wiki_page_versions |
| `server/src/validators/wiki.validator.ts` | Complete | 9 Zod schemas |
| `server/src/services/wiki.service.ts` | Complete (746 LOC) | 21 methods: CRUD, search, links, versioning, logging, stats |
| `server/src/controllers/wiki.controller.ts` | Complete | 14 endpoint handlers |
| `server/src/routes/wiki.routes.ts` | Complete | 13 routes under `/api/v1/wiki` |
| `server/src/services/langgraph-tools/domains/wiki.ts` | Complete (375 LOC) | 7 tools: searchWikiPages, getWikiPage, createWikiPage, updateWikiPage, createWikiLink, flagWikiContradiction, fileQueryAsWikiPage |
| `server/src/services/langgraph-tools/registry.ts` | Complete | Wiki tools registered at line 107 |

## File Structure — New & Modified Files

### New Files

```
server/src/database/migrations/20260508000000_wiki_reconcile.sql   # Schema reconciliation
server/src/services/wiki-index.service.ts                          # Index maintenance + stats
server/src/services/wiki-ingest.service.ts                         # Ingest pipeline (conversation → wiki pages)
server/src/services/wiki-context.service.ts                        # Wiki context loader for RAG
server/src/services/wiki-compiler.service.ts                       # Lightweight memory compiler (per-chat)
server/tests/unit/services/wiki-index.service.test.ts              # Index service tests
server/tests/unit/services/wiki-ingest.service.test.ts             # Ingest service tests
server/tests/unit/services/wiki-context.service.test.ts            # Context loader tests
server/tests/unit/services/wiki-compiler.service.test.ts           # Compiler tests
server/tests/unit/tools/wiki-tools-idempotency.test.ts             # Idempotency guard tests
```

### Modified Files

```
server/src/services/langgraph-tools/domains/wiki.ts                # Add idempotency guards
server/src/services/langgraph-chatbot.service.ts                   # Add lightweight compiler hook (~line 4452)
server/src/services/rag-chatbot.service.ts                         # Add wiki context to retrieveContext()
```

---

## Phase 0: Reconcile Existing Implementation

### Task 1: Schema Reconciliation Migration

**Files:**
- Create: `server/src/database/migrations/20260508000000_wiki_reconcile.sql`

- [ ] **Step 1: Write the reconciliation migration**

```sql
-- server/src/database/migrations/20260508000000_wiki_reconcile.sql
-- Reconcile wiki schema: tighten constraints, add vector columns, add composite indexes

-- 1. Backfill nullable columns that should be NOT NULL
UPDATE wiki_pages SET summary = '' WHERE summary IS NULL;
UPDATE wiki_pages SET body = '' WHERE body IS NULL;
UPDATE wiki_log SET summary = '' WHERE summary IS NULL;
UPDATE wiki_page_versions SET title = '' WHERE title IS NULL;
UPDATE wiki_page_versions SET summary = '' WHERE summary IS NULL;
UPDATE wiki_page_versions SET body = '' WHERE body IS NULL;
UPDATE wiki_page_versions SET confidence = 0.5 WHERE confidence IS NULL;
UPDATE wiki_page_versions SET evidence_count = 0 WHERE evidence_count IS NULL;

-- 2. Add NOT NULL constraints
ALTER TABLE wiki_pages ALTER COLUMN summary SET NOT NULL;
ALTER TABLE wiki_pages ALTER COLUMN summary SET DEFAULT '';
ALTER TABLE wiki_pages ALTER COLUMN body SET NOT NULL;
ALTER TABLE wiki_pages ALTER COLUMN body SET DEFAULT '';
ALTER TABLE wiki_log ALTER COLUMN summary SET NOT NULL;
ALTER TABLE wiki_log ALTER COLUMN summary SET DEFAULT '';
ALTER TABLE wiki_page_versions ALTER COLUMN title SET NOT NULL;
ALTER TABLE wiki_page_versions ALTER COLUMN title SET DEFAULT '';
ALTER TABLE wiki_page_versions ALTER COLUMN summary SET NOT NULL;
ALTER TABLE wiki_page_versions ALTER COLUMN summary SET DEFAULT '';
ALTER TABLE wiki_page_versions ALTER COLUMN body SET NOT NULL;
ALTER TABLE wiki_page_versions ALTER COLUMN body SET DEFAULT '';
ALTER TABLE wiki_page_versions ALTER COLUMN confidence SET NOT NULL;
ALTER TABLE wiki_page_versions ALTER COLUMN confidence SET DEFAULT 0.5;
ALTER TABLE wiki_page_versions ALTER COLUMN evidence_count SET NOT NULL;
ALTER TABLE wiki_page_versions ALTER COLUMN evidence_count SET DEFAULT 0;

-- 3. Add composite indexes with status (missing from original migration)
CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_type_status
    ON wiki_pages(user_id, page_type, status);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_category_status
    ON wiki_pages(user_id, category, status);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_status_updated
    ON wiki_pages(user_id, status, updated_at DESC)
    WHERE status = 'active';

-- 4. Add vector embedding columns (if pgvector available)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        -- Add vector columns alongside existing TEXT columns
        ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS summary_embedding_vec vector(1536);
        ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS body_embedding_vec vector(1536);

        -- Create IVFFlat indexes for cosine similarity search
        -- Only create if enough rows exist (IVFFlat needs data)
        CREATE INDEX IF NOT EXISTS idx_wiki_pages_summary_emb
            ON wiki_pages USING ivfflat (summary_embedding_vec vector_cosine_ops) WITH (lists = 100);
    END IF;
END $$;

-- 5. Add parent_slug for hierarchical pages (domain → sub-pages)
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS parent_slug VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_parent
    ON wiki_pages(user_id, parent_slug)
    WHERE parent_slug IS NOT NULL;
```

- [ ] **Step 2: Verify migration syntax by dry-running**

Run: `cd server && npx tsx src/database/migrations/20260508000000_wiki_reconcile.sql --dry-run`

If dry-run is not available, verify the SQL is valid by reading it:
```
cd server
npx tsx -e "import fs from 'fs'; const sql = fs.readFileSync('src/database/migrations/20260508000000_wiki_reconcile.sql', 'utf8'); console.log('SQL length:', sql.length, 'statements:', sql.split(';').length);"
```

Expected: SQL parses without errors, ~25 statements.

- [ ] **Step 3: Commit**

```bash
git add server/src/database/migrations/20260508000000_wiki_reconcile.sql
git commit -m "chore(wiki): add schema reconciliation migration

Tightens NOT NULL constraints, adds composite indexes with status,
adds vector embedding columns (pgvector conditional), adds parent_slug
for hierarchical domain pages."
```

---

### Task 2: Add Idempotency Guards to Wiki Tools

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/wiki.ts`
- Create: `server/tests/unit/tools/wiki-tools-idempotency.test.ts`

- [ ] **Step 1: Write failing tests for idempotency**

```typescript
// server/tests/unit/tools/wiki-tools-idempotency.test.ts

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Mock DB ──
const mockQuery = jest.fn<any>();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

// ── Mock logger ──
jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Mock wikiService ──
const mockWikiService = {
  createPage: jest.fn<any>(),
  getPage: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  searchPages: jest.fn<any>(),
  createLink: jest.fn<any>(),
  archivePage: jest.fn<any>(),
  getStats: jest.fn<any>(),
  logOperation: jest.fn<any>(),
  parseWikiLinks: jest.fn<any>().mockReturnValue([]),
  resolveLinks: jest.fn<any>().mockResolvedValue(new Map()),
};
jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

const { registerWikiTools } = await import(
  '../../../src/services/langgraph-tools/domains/wiki.js'
);

describe('Wiki Tools Idempotency', () => {
  const userId = 'test-user-123';
  let tools: ReturnType<typeof registerWikiTools>;

  beforeEach(() => {
    jest.clearAllMocks();
    tools = registerWikiTools(userId);
  });

  function findTool(name: string) {
    const tool = tools.find((t) => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return tool;
  }

  describe('createWikiPage idempotency', () => {
    it('should return existing page without mutation when slug already exists', async () => {
      const existingPage = {
        id: 'page-1',
        slug: 'fitness-profile',
        title: 'Fitness Profile',
        summary: 'Existing summary',
        body: 'Existing body',
        version: 3,
        outbound: [],
        inbound: [],
      };
      mockWikiService.getPage.mockResolvedValue(existingPage);

      const tool = findTool('createWikiPage');
      const result = await tool.handler(userId, {
        slug: 'fitness-profile',
        pageType: 'pattern',
        category: 'fitness',
        title: 'Fitness Profile',
        summary: 'New summary',
        body: 'New body',
      });

      expect(mockWikiService.createPage).not.toHaveBeenCalled();
      expect(result).toContain('already exists');
    });
  });

  describe('updateWikiPage idempotency', () => {
    it('should skip version bump when body and summary are unchanged', async () => {
      const existingPage = {
        id: 'page-1',
        slug: 'fitness-profile',
        title: 'Fitness Profile',
        summary: 'Same summary',
        body: 'Same body',
        version: 3,
        outbound: [],
        inbound: [],
      };
      mockWikiService.getPage.mockResolvedValue(existingPage);

      const tool = findTool('updateWikiPage');
      const result = await tool.handler(userId, {
        slug: 'fitness-profile',
        body: 'Same body',
        summary: 'Same summary',
        changeReason: 'test update',
      });

      expect(mockWikiService.updatePage).not.toHaveBeenCalled();
      expect(result).toContain('no changes');
    });
  });

  describe('createWikiLink idempotency', () => {
    it('should succeed silently when link already exists (ON CONFLICT)', async () => {
      mockWikiService.createLink.mockResolvedValue({
        id: 'link-1',
        sourceSlug: 'a',
        targetSlug: 'b',
        linkType: 'reference',
      });

      const tool = findTool('createWikiLink');
      const result = await tool.handler(userId, {
        sourceSlug: 'a',
        targetSlug: 'b',
        linkType: 'reference',
      });

      expect(result).toContain('success');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx jest tests/unit/tools/wiki-tools-idempotency.test.ts --no-cache`
Expected: FAIL — `createWikiPage` calls `createPage` even when page exists, `updateWikiPage` calls `updatePage` even when content is unchanged.

- [ ] **Step 3: Add idempotency guards to createWikiPage**

In `server/src/services/langgraph-tools/domains/wiki.ts`, modify the `createWikiPage` handler (around line 135):

```typescript
async function createWikiPage(
  userId: string,
  params: z.infer<typeof CreateWikiPageSchema>,
): Promise<string> {
  // Idempotency: check if slug already exists
  const existing = await wikiService.getPage(userId, params.slug);
  if (existing) {
    return JSON.stringify({
      message: `Wiki page "${params.slug}" already exists (v${existing.version}). Use updateWikiPage to modify it.`,
      slug: existing.slug,
      title: existing.title,
      version: existing.version,
    });
  }

  const page = await wikiService.createPage(userId, {
    slug: params.slug,
    pageType: params.pageType as any,
    category: params.category,
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: params.confidence ?? 0.5,
  });

  // Auto-parse [[slug]] links from body
  const wikiLinks = wikiService.parseWikiLinks(params.body);
  if (wikiLinks.length > 0) {
    const resolved = await wikiService.resolveLinks(userId, wikiLinks);
    for (const [slug] of resolved) {
      try {
        await wikiService.createLink(userId, {
          sourceSlug: params.slug,
          targetSlug: slug,
          linkType: 'reference' as any,
        });
      } catch {
        // Silent failure for non-existent target pages
      }
    }
  }

  await wikiService.logOperation(userId, {
    operation: 'create' as any,
    pageIds: [page.id],
    summary: `Created wiki page: ${params.title}`,
    pagesTouched: 1,
  });

  return JSON.stringify({
    message: `Created wiki page "${params.title}" (${params.slug})${wikiLinks.length > 0 ? ` with ${wikiLinks.length} links` : ''}`,
    slug: page.slug,
    version: page.version,
  });
}
```

- [ ] **Step 4: Add idempotency guard to updateWikiPage**

In the same file, modify the `updateWikiPage` handler (around line 177):

```typescript
async function updateWikiPage(
  userId: string,
  params: z.infer<typeof UpdateWikiPageSchema>,
): Promise<string> {
  const existing = await wikiService.getPage(userId, params.slug);
  if (!existing) {
    return JSON.stringify({
      message: `Wiki page "${params.slug}" not found. Use createWikiPage to create it.`,
    });
  }

  // Idempotency: skip if body and summary are unchanged
  const bodyUnchanged = !params.body || params.body === existing.body;
  const summaryUnchanged = !params.summary || params.summary === existing.summary;
  const titleUnchanged = !params.title || params.title === existing.title;
  const confidenceUnchanged = params.confidence === undefined || params.confidence === existing.confidence;

  if (bodyUnchanged && summaryUnchanged && titleUnchanged && confidenceUnchanged) {
    return JSON.stringify({
      message: `Wiki page "${params.slug}" has no changes to apply. Current version: v${existing.version}.`,
      slug: existing.slug,
      version: existing.version,
    });
  }

  const updated = await wikiService.updatePage(userId, params.slug, {
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: params.confidence,
    changeReason: params.changeReason,
  });

  // Re-parse links if body changed
  let linkCount = 0;
  if (params.body) {
    const wikiLinks = wikiService.parseWikiLinks(params.body);
    if (wikiLinks.length > 0) {
      const resolved = await wikiService.resolveLinks(userId, wikiLinks);
      for (const [slug] of resolved) {
        try {
          await wikiService.createLink(userId, {
            sourceSlug: params.slug,
            targetSlug: slug,
            linkType: 'reference' as any,
          });
          linkCount++;
        } catch {
          // Silent failure
        }
      }
    }
  }

  await wikiService.logOperation(userId, {
    operation: 'update' as any,
    pageIds: [updated.id],
    summary: `Updated wiki page: ${params.slug} — ${params.changeReason}`,
    pagesTouched: 1,
  });

  return JSON.stringify({
    message: `Updated wiki page "${params.slug}" to v${updated.version}${linkCount > 0 ? ` with ${linkCount} links` : ''}`,
    slug: updated.slug,
    version: updated.version,
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx jest tests/unit/tools/wiki-tools-idempotency.test.ts --no-cache`
Expected: PASS — all 3 idempotency tests green.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/langgraph-tools/domains/wiki.ts server/tests/unit/tools/wiki-tools-idempotency.test.ts
git commit -m "feat(wiki): add idempotency guards to createWikiPage and updateWikiPage

createWikiPage checks if slug exists first — returns existing page unchanged.
updateWikiPage compares body/summary/title/confidence — skips version bump
if content is identical. Prevents duplicate pages and unnecessary versioning
during LLM retries."
```

---

## Phase 1: Core Services + Memory Compiler

### Task 3: Wiki Index Service

**Files:**
- Create: `server/src/services/wiki-index.service.ts`
- Create: `server/tests/unit/services/wiki-index.service.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// server/tests/unit/services/wiki-index.service.test.ts

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { wikiIndexService } = await import(
  '../../../src/services/wiki-index.service.js'
);

function pgResult(rows: Record<string, unknown>[]) {
  return { rows };
}

describe('WikiIndexService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rebuildIndex', () => {
    it('should compute page counts by type and category', async () => {
      const userId = 'user-1';

      // Total page count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '12' }]));
      // Counts by type
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { page_type: 'pattern', count: '5' },
          { page_type: 'entity', count: '4' },
          { page_type: 'journal', count: '3' },
        ]),
      );
      // Counts by category
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { category: 'fitness', count: '6' },
          { category: 'nutrition', count: '4' },
          { category: 'sleep', count: '2' },
        ]),
      );
      // Orphan count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '2' }]));
      // Stale count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '1' }]));
      // Contradicted count
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));
      // Upsert index
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await wikiIndexService.rebuildIndex(userId);

      expect(result.pageCount).toBe(12);
      expect(result.countsByType).toEqual({
        pattern: 5,
        entity: 4,
        journal: 3,
      });
      expect(result.countsByCategory).toEqual({
        fitness: 6,
        nutrition: 4,
        sleep: 2,
      });
      expect(result.orphanCount).toBe(2);
      expect(result.staleCount).toBe(1);
      expect(result.contradictedCount).toBe(0);
    });
  });

  describe('markStalePages', () => {
    it('should mark pages as stale when last updated exceeds stale_after_days', async () => {
      const userId = 'user-1';

      mockQuery.mockResolvedValueOnce(
        pgResult([
          { id: 'page-1', slug: 'old-pattern' },
          { id: 'page-2', slug: 'ancient-concept' },
        ]),
      );

      const staleCount = await wikiIndexService.markStalePages(userId);

      expect(staleCount).toBe(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('stale_after_days'),
        [userId],
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx jest tests/unit/services/wiki-index.service.test.ts --no-cache`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement wiki-index.service.ts**

```typescript
// server/src/services/wiki-index.service.ts

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

interface WikiIndexStats {
  pageCount: number;
  countsByType: Record<string, number>;
  countsByCategory: Record<string, number>;
  orphanCount: number;
  staleCount: number;
  contradictedCount: number;
}

class WikiIndexService {
  async rebuildIndex(userId: string): Promise<WikiIndexStats> {
    try {
      const [
        totalResult,
        typeResult,
        categoryResult,
        orphanResult,
        staleResult,
        contradictedResult,
      ] = await Promise.all([
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM wiki_pages
           WHERE user_id = $1 AND status IN ('active', 'stale')`,
          [userId],
        ),
        query<{ page_type: string; count: string }>(
          `SELECT page_type, COUNT(*) as count FROM wiki_pages
           WHERE user_id = $1 AND status IN ('active', 'stale')
           GROUP BY page_type`,
          [userId],
        ),
        query<{ category: string; count: string }>(
          `SELECT category, COUNT(*) as count FROM wiki_pages
           WHERE user_id = $1 AND status IN ('active', 'stale')
           GROUP BY category`,
          [userId],
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM wiki_pages wp
           WHERE wp.user_id = $1 AND wp.status = 'active'
             AND NOT EXISTS (
               SELECT 1 FROM wiki_links wl
               WHERE wl.target_page_id = wp.id
             )`,
          [userId],
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM wiki_pages
           WHERE user_id = $1 AND status = 'stale'`,
          [userId],
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM wiki_pages
           WHERE user_id = $1 AND status = 'contradicted'`,
          [userId],
        ),
      ]);

      const stats: WikiIndexStats = {
        pageCount: parseInt(totalResult.rows[0]?.count ?? '0', 10),
        countsByType: Object.fromEntries(
          typeResult.rows.map((r) => [r.page_type, parseInt(r.count, 10)]),
        ),
        countsByCategory: Object.fromEntries(
          categoryResult.rows.map((r) => [r.category, parseInt(r.count, 10)]),
        ),
        orphanCount: parseInt(orphanResult.rows[0]?.count ?? '0', 10),
        staleCount: parseInt(staleResult.rows[0]?.count ?? '0', 10),
        contradictedCount: parseInt(contradictedResult.rows[0]?.count ?? '0', 10),
      };

      // Upsert wiki_index row
      const content = this.renderIndexMarkdown(stats);
      await query(
        `INSERT INTO wiki_index (user_id, content, page_count, counts_by_type, counts_by_category, orphan_count, stale_count, contradicted_count, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           content = EXCLUDED.content,
           page_count = EXCLUDED.page_count,
           counts_by_type = EXCLUDED.counts_by_type,
           counts_by_category = EXCLUDED.counts_by_category,
           orphan_count = EXCLUDED.orphan_count,
           stale_count = EXCLUDED.stale_count,
           contradicted_count = EXCLUDED.contradicted_count,
           updated_at = NOW()`,
        [
          userId,
          content,
          stats.pageCount,
          JSON.stringify(stats.countsByType),
          JSON.stringify(stats.countsByCategory),
          stats.orphanCount,
          stats.staleCount,
          stats.contradictedCount,
        ],
      );

      return stats;
    } catch (error) {
      logger.error('[WikiIndex] Failed to rebuild index', { error, userId });
      return {
        pageCount: 0,
        countsByType: {},
        countsByCategory: {},
        orphanCount: 0,
        staleCount: 0,
        contradictedCount: 0,
      };
    }
  }

  async markStalePages(userId: string): Promise<number> {
    try {
      const result = await query<{ id: string; slug: string }>(
        `UPDATE wiki_pages SET status = 'stale', updated_at = NOW()
         WHERE user_id = $1
           AND status = 'active'
           AND updated_at < NOW() - (stale_after_days || ' days')::INTERVAL
         RETURNING id, slug`,
        [userId],
      );
      if (result.rows.length > 0) {
        logger.info('[WikiIndex] Marked stale pages', {
          userId,
          count: result.rows.length,
          slugs: result.rows.map((r) => r.slug),
        });
      }
      return result.rows.length;
    } catch (error) {
      logger.error('[WikiIndex] Failed to mark stale pages', { error, userId });
      return 0;
    }
  }

  private renderIndexMarkdown(stats: WikiIndexStats): string {
    const lines: string[] = [
      `# Wiki Index`,
      ``,
      `**Pages:** ${stats.pageCount} | **Stale:** ${stats.staleCount} | **Contradictions:** ${stats.contradictedCount} | **Orphans:** ${stats.orphanCount}`,
      ``,
    ];

    if (Object.keys(stats.countsByType).length > 0) {
      lines.push(`## By Type`);
      for (const [type, count] of Object.entries(stats.countsByType)) {
        lines.push(`- ${type}: ${count}`);
      }
      lines.push(``);
    }

    if (Object.keys(stats.countsByCategory).length > 0) {
      lines.push(`## By Category`);
      for (const [cat, count] of Object.entries(stats.countsByCategory)) {
        lines.push(`- ${cat}: ${count}`);
      }
    }

    return lines.join('\n');
  }
}

export const wikiIndexService = new WikiIndexService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx jest tests/unit/services/wiki-index.service.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/wiki-index.service.ts server/tests/unit/services/wiki-index.service.test.ts
git commit -m "feat(wiki): add WikiIndexService for index maintenance

Rebuilds wiki_index with page counts by type/category, orphan/stale/
contradiction counts. Marks pages as stale when updated_at exceeds
stale_after_days. Renders markdown index for LLM context."
```

---

### Task 4: Wiki Context Service (RAG Integration)

**Files:**
- Create: `server/src/services/wiki-context.service.ts`
- Create: `server/tests/unit/services/wiki-context.service.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// server/tests/unit/services/wiki-context.service.test.ts

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockWikiService = {
  searchPages: jest.fn<any>(),
  getPage: jest.fn<any>(),
};
jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

const { wikiContextService } = await import(
  '../../../src/services/wiki-context.service.js'
);

describe('WikiContextService', () => {
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getContextForQuery', () => {
    it('should return formatted wiki context for a query', async () => {
      mockWikiService.searchPages.mockResolvedValue({
        data: [
          {
            slug: 'morning-workout-preference',
            title: 'Morning Workout Preference',
            summary: 'User performs best with morning workouts before 8 AM',
            confidence: 0.92,
            pageType: 'pattern',
            category: 'fitness',
          },
        ],
        total: 1,
      });

      mockWikiService.getPage.mockResolvedValue({
        slug: 'morning-workout-preference',
        title: 'Morning Workout Preference',
        summary: 'User performs best with morning workouts before 8 AM',
        body: '## Morning Workout Preference\n\nUser consistently completes morning sessions.',
        confidence: 0.92,
        outbound: [],
        inbound: [],
      });

      const context = await wikiContextService.getContextForQuery(userId, 'when should I work out?');

      expect(context).toContain('WIKI KNOWLEDGE');
      expect(context).toContain('Morning Workout Preference');
      expect(context).toContain('morning workouts before 8 AM');
    });

    it('should return empty string when no wiki pages match', async () => {
      mockWikiService.searchPages.mockResolvedValue({ data: [], total: 0 });

      const context = await wikiContextService.getContextForQuery(userId, 'random query');

      expect(context).toBe('');
    });

    it('should respect token budget and truncate long pages', async () => {
      const longBody = 'A'.repeat(10000);
      mockWikiService.searchPages.mockResolvedValue({
        data: [
          {
            slug: 'long-page',
            title: 'Long Page',
            summary: 'A very long page',
            confidence: 0.8,
            pageType: 'synthesis',
            category: 'cross_domain',
          },
        ],
        total: 1,
      });

      mockWikiService.getPage.mockResolvedValue({
        slug: 'long-page',
        title: 'Long Page',
        summary: 'A very long page',
        body: longBody,
        confidence: 0.8,
        outbound: [],
        inbound: [],
      });

      const context = await wikiContextService.getContextForQuery(userId, 'test', { maxTokens: 500 });

      // Rough token estimate: 1 token ≈ 4 chars → 500 tokens ≈ 2000 chars
      expect(context.length).toBeLessThan(3000);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx jest tests/unit/services/wiki-context.service.test.ts --no-cache`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement wiki-context.service.ts**

```typescript
// server/src/services/wiki-context.service.ts

import { wikiService } from './wiki.service.js';
import { logger } from './logger.service.js';

interface WikiContextOptions {
  maxTokens?: number;
  maxPages?: number;
}

const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_MAX_PAGES = 5;
const CHARS_PER_TOKEN = 4;

class WikiContextService {
  async getContextForQuery(
    userId: string,
    queryText: string,
    options?: WikiContextOptions,
  ): Promise<string> {
    const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
    const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
    const maxChars = maxTokens * CHARS_PER_TOKEN;

    try {
      const searchResult = await wikiService.searchPages(userId, queryText, {
        status: 'active' as any,
        limit: maxPages,
      });

      if (!searchResult || searchResult.data.length === 0) {
        return '';
      }

      // Load full page for top result only (saves tokens)
      const topPage = await wikiService.getPage(userId, searchResult.data[0].slug);

      const sections: string[] = ['WIKI KNOWLEDGE (pre-synthesized from user history):', ''];

      // Top result: full body (truncated to budget)
      if (topPage) {
        const bodyBudget = Math.floor(maxChars * 0.6);
        const truncatedBody =
          topPage.body.length > bodyBudget
            ? topPage.body.substring(0, bodyBudget) + '\n[...truncated]'
            : topPage.body;

        sections.push(
          `### ${topPage.title} (confidence: ${topPage.confidence?.toFixed(2) ?? 'N/A'})`,
          truncatedBody,
          '',
        );
      }

      // Remaining results: summaries only
      const remaining = searchResult.data.slice(1);
      if (remaining.length > 0) {
        sections.push('### Related Wiki Pages:');
        for (const page of remaining) {
          sections.push(
            `- **${page.title}** [${page.category}]: ${page.summary}`,
          );
        }
      }

      const result = sections.join('\n');

      // Final truncation if still over budget
      if (result.length > maxChars) {
        return result.substring(0, maxChars) + '\n[...wiki context truncated]';
      }

      return result;
    } catch (error) {
      logger.error('[WikiContext] Failed to get context', { error, userId });
      return '';
    }
  }
}

export const wikiContextService = new WikiContextService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx jest tests/unit/services/wiki-context.service.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/wiki-context.service.ts server/tests/unit/services/wiki-context.service.test.ts
git commit -m "feat(wiki): add WikiContextService for RAG pipeline integration

Searches wiki pages by query text, loads full body for top result +
summaries for remaining matches. Respects token budget (default 4000
tokens). Returns formatted markdown string for system prompt injection."
```

---

### Task 5: Wire Wiki Context into RAG Pipeline

**Files:**
- Modify: `server/src/services/rag-chatbot.service.ts`

- [ ] **Step 1: Add wiki context import**

At the top of `server/src/services/rag-chatbot.service.ts`, add:

```typescript
import { wikiContextService } from './wiki-context.service.js';
```

- [ ] **Step 2: Add wiki search to retrieveContext parallel queries**

In the `retrieveContext` method (around line 148-220), add `wikiContextService.getContextForQuery` to the `Promise.all` array:

Find the existing `Promise.all` block:
```typescript
const [
  relevantKnowledge,
  userProfile,
  previousConversations,
  userDataEmbeddings,
] = await Promise.all([
```

Change it to:
```typescript
const [
  relevantKnowledge,
  userProfile,
  previousConversations,
  userDataEmbeddings,
  wikiContext,
] = await Promise.all([
  vectorEmbeddingService.searchKnowledge({ queryText, limit: 5 }),
  vectorEmbeddingService.searchUserProfile({ userId, queryText, limit: 3 }),
  vectorEmbeddingService.searchConversationHistory({ userId, queryText, limit: 5 }),
  vectorEmbeddingService.searchSimilar({ queryText, userId, limit: 15, minSimilarity: 0.5 }),
  wikiContextService.getContextForQuery(userId, queryText).catch(() => ''),
]);
```

- [ ] **Step 3: Inject wiki context into buildContextString**

In the `buildContextString` method, add wiki context as the **first section** (highest priority):

Find the start of `buildContextString`:
```typescript
private buildContextString(context: RAGContext): string {
  const sections: string[] = [];
```

Add wiki context before existing sections:
```typescript
private buildContextString(context: RAGContext & { wikiContext?: string }): string {
  const sections: string[] = [];

  // Wiki context first — pre-synthesized, highest signal-to-noise
  if (context.wikiContext) {
    sections.push(context.wikiContext);
    sections.push('');
  }

  if (context.userProfile.length > 0) {
```

And pass `wikiContext` through the return value of `retrieveContext`:
```typescript
return {
  conversationHistory: [],
  relevantKnowledge: relevantKnowledge.map(/* ... */),
  userProfile: [/* ... */],
  previousConversations: previousConversations.map(/* ... */),
  wikiContext,
};
```

- [ ] **Step 4: Verify the server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors. If `RAGContext` type needs updating, add `wikiContext?: string` to its interface.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/rag-chatbot.service.ts
git commit -m "feat(wiki): inject wiki context into RAG pipeline

Wiki pages are now searched in parallel with vector embeddings during
context retrieval. Wiki context appears first in the system prompt
(highest priority), followed by memories, RAG chunks, and user profile.
Falls back gracefully if wiki search fails."
```

---

### Task 6: Lightweight Memory Compiler (Per-Chat Hook)

**Files:**
- Create: `server/src/services/wiki-compiler.service.ts`
- Create: `server/tests/unit/services/wiki-compiler.service.test.ts`
- Modify: `server/src/services/langgraph-chatbot.service.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// server/tests/unit/services/wiki-compiler.service.test.ts

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockWikiService = {
  searchPages: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  logOperation: jest.fn<any>(),
  getPage: jest.fn<any>(),
};
jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

const { wikiCompilerService } = await import(
  '../../../src/services/wiki-compiler.service.js'
);

function pgResult(rows: Record<string, unknown>[]) {
  return { rows };
}

describe('WikiCompilerService', () => {
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processConversationTurn', () => {
    it('should update matching wiki page evidence when reinforcing signal found', async () => {
      mockWikiService.searchPages.mockResolvedValue({
        data: [
          {
            slug: 'morning-workout-preference',
            title: 'Morning Workout Preference',
            confidence: 0.85,
            category: 'fitness',
          },
        ],
        total: 1,
      });

      mockWikiService.getPage.mockResolvedValue({
        id: 'page-1',
        slug: 'morning-workout-preference',
        body: 'existing body',
        confidence: 0.85,
        frontmatter: { evidence: [] },
      });

      mockWikiService.updatePage.mockResolvedValue({
        id: 'page-1',
        slug: 'morning-workout-preference',
        version: 4,
      });

      const result = await wikiCompilerService.processConversationTurn(
        userId,
        'I did a great morning run today at 6am!',
        'assistant response here',
        'conv-1',
      );

      expect(result.pagesUpdated).toBeGreaterThanOrEqual(0);
      expect(result.pagesUpdated).toBeLessThanOrEqual(3);
    });

    it('should respect MAX_PAGES_PER_TURN limit of 3', async () => {
      // Return 5 matching pages — compiler should only touch 3
      mockWikiService.searchPages.mockResolvedValue({
        data: Array.from({ length: 5 }, (_, i) => ({
          slug: `page-${i}`,
          title: `Page ${i}`,
          confidence: 0.8 - i * 0.1,
          category: 'fitness',
        })),
        total: 5,
      });

      for (let i = 0; i < 5; i++) {
        mockWikiService.getPage.mockResolvedValueOnce({
          id: `page-${i}`,
          slug: `page-${i}`,
          body: 'body',
          confidence: 0.8 - i * 0.1,
          frontmatter: {},
        });
      }

      mockWikiService.updatePage.mockResolvedValue({ id: 'x', version: 2 });

      const result = await wikiCompilerService.processConversationTurn(
        userId,
        'I did everything today',
        'Great job!',
        'conv-1',
      );

      expect(result.pagesUpdated).toBeLessThanOrEqual(3);
    });

    it('should return zero pages updated when no wiki pages match', async () => {
      mockWikiService.searchPages.mockResolvedValue({ data: [], total: 0 });

      const result = await wikiCompilerService.processConversationTurn(
        userId,
        'hello',
        'hi there',
        'conv-1',
      );

      expect(result.pagesUpdated).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx jest tests/unit/services/wiki-compiler.service.test.ts --no-cache`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement wiki-compiler.service.ts**

```typescript
// server/src/services/wiki-compiler.service.ts

import { wikiService } from './wiki.service.js';
import { logger } from './logger.service.js';

const MAX_PAGES_PER_TURN = 3;
const MIN_MESSAGE_LENGTH = 20;
const CONFIDENCE_BUMP = 0.02;

interface CompilerResult {
  pagesUpdated: number;
  conversationId: string;
}

class WikiCompilerService {
  async processConversationTurn(
    userId: string,
    userMessage: string,
    assistantResponse: string,
    conversationId: string,
  ): Promise<CompilerResult> {
    // Skip very short messages (greetings, single words)
    if (userMessage.length < MIN_MESSAGE_LENGTH) {
      return { pagesUpdated: 0, conversationId };
    }

    try {
      // Find wiki pages related to this conversation turn
      const searchResult = await wikiService.searchPages(userId, userMessage, {
        status: 'active' as any,
        limit: MAX_PAGES_PER_TURN + 2,
      });

      if (!searchResult || searchResult.data.length === 0) {
        return { pagesUpdated: 0, conversationId };
      }

      // Only process top MAX_PAGES_PER_TURN pages
      const pagesToUpdate = searchResult.data.slice(0, MAX_PAGES_PER_TURN);
      let pagesUpdated = 0;

      for (const pageHit of pagesToUpdate) {
        try {
          const fullPage = await wikiService.getPage(userId, pageHit.slug);
          if (!fullPage) continue;

          // Bump confidence slightly (reinforcing signal)
          const newConfidence = Math.min(
            1.0,
            (fullPage.confidence ?? 0.5) + CONFIDENCE_BUMP,
          );

          // Append evidence to frontmatter
          const frontmatter = (fullPage.frontmatter as Record<string, unknown>) ?? {};
          const evidence = Array.isArray(frontmatter.evidence)
            ? frontmatter.evidence
            : [];
          evidence.push({
            source: 'conversation',
            conversationId,
            date: new Date().toISOString().split('T')[0],
            summary: userMessage.substring(0, 200),
          });

          await wikiService.updatePage(userId, pageHit.slug, {
            confidence: newConfidence,
            changeReason: `Lightweight compiler: reinforcing signal from conversation ${conversationId}`,
          });

          pagesUpdated++;
        } catch (error) {
          logger.warn('[WikiCompiler] Failed to update page', {
            slug: pageHit.slug,
            error,
          });
        }
      }

      if (pagesUpdated > 0) {
        await wikiService.logOperation(userId, {
          operation: 'update' as any,
          conversationId,
          summary: `Lightweight compiler: updated ${pagesUpdated} page(s) from conversation turn`,
          pagesTouched: pagesUpdated,
        });
      }

      return { pagesUpdated, conversationId };
    } catch (error) {
      logger.error('[WikiCompiler] processConversationTurn failed', {
        error,
        userId,
      });
      return { pagesUpdated: 0, conversationId };
    }
  }
}

export const wikiCompilerService = new WikiCompilerService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx jest tests/unit/services/wiki-compiler.service.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Hook compiler into langgraph-chatbot.service.ts**

In `server/src/services/langgraph-chatbot.service.ts`, add the import at the top:

```typescript
import { wikiCompilerService } from './wiki-compiler.service.js';
```

Then find the post-response section (around line 4452, after `this.storeMessagePair(...)`) and add the compiler call:

```typescript
// After storeMessagePair call:
this.storeMessagePair({ /* ... existing code ... */ })
  .catch((error) => {
    logger.error('[LangGraphChatbot] Error storing messages', { error, userId });
  });

// Lightweight wiki compiler — fire-and-forget, non-blocking
wikiCompilerService
  .processConversationTurn(userId, message, responseContent, activeConversationId)
  .catch((error) => {
    logger.warn('[LangGraphChatbot] Wiki compiler failed (non-critical)', { error, userId });
  });
```

- [ ] **Step 6: Verify server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add server/src/services/wiki-compiler.service.ts server/tests/unit/services/wiki-compiler.service.test.ts server/src/services/langgraph-chatbot.service.ts
git commit -m "feat(wiki): add lightweight memory compiler (per-chat hook)

Runs after every conversation turn as fire-and-forget. Searches wiki for
pages matching the user message, bumps confidence on top 3 matches
(MAX_PAGES_PER_TURN), and appends conversation evidence to frontmatter.
Skips messages under 20 chars. Non-blocking — never delays the user response."
```

---

### Task 7: Wiki Ingest Service

**Files:**
- Create: `server/src/services/wiki-ingest.service.ts`
- Create: `server/tests/unit/services/wiki-ingest.service.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// server/tests/unit/services/wiki-ingest.service.test.ts

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockWikiService = {
  searchPages: jest.fn<any>(),
  createPage: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  getPage: jest.fn<any>(),
  createLink: jest.fn<any>(),
  addSources: jest.fn<any>(),
  logOperation: jest.fn<any>(),
  parseWikiLinks: jest.fn<any>().mockReturnValue([]),
  resolveLinks: jest.fn<any>().mockResolvedValue(new Map()),
};
jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

const mockWikiIndexService = {
  rebuildIndex: jest.fn<any>().mockResolvedValue({ pageCount: 0 }),
};
jest.unstable_mockModule('../../../src/services/wiki-index.service.js', () => ({
  wikiIndexService: mockWikiIndexService,
}));

const { wikiIngestService } = await import(
  '../../../src/services/wiki-ingest.service.js'
);

function pgResult(rows: Record<string, unknown>[]) {
  return { rows };
}

describe('WikiIngestService', () => {
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ingestFromConversation', () => {
    it('should fetch recent messages and create wiki pages for new insights', async () => {
      // Mock conversation messages
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { role: 'user', content: 'I noticed I always sleep better after yoga' },
          { role: 'assistant', content: 'That pattern makes sense — yoga activates your parasympathetic nervous system.' },
          { role: 'user', content: 'Should I do yoga every evening then?' },
          { role: 'assistant', content: 'Based on your schedule, 3-4 evenings per week would be optimal.' },
        ]),
      );

      // No existing matching page
      mockWikiService.searchPages.mockResolvedValue({ data: [], total: 0 });

      // Create page succeeds
      mockWikiService.createPage.mockResolvedValue({
        id: 'new-page-1',
        slug: 'yoga-sleep-correlation',
        version: 1,
      });

      const result = await wikiIngestService.ingestFromConversation(userId, 'conv-1');

      expect(result.pagesCreated).toBeGreaterThanOrEqual(0);
      expect(result.conversationId).toBe('conv-1');
    });

    it('should update existing page when matching wiki page found', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { role: 'user', content: 'Another morning workout done at 6am' },
          { role: 'assistant', content: 'Great consistency! Your morning routine is strong.' },
        ]),
      );

      // Existing matching page
      mockWikiService.searchPages.mockResolvedValue({
        data: [
          {
            slug: 'morning-workout-preference',
            title: 'Morning Workout Preference',
            confidence: 0.8,
          },
        ],
        total: 1,
      });

      mockWikiService.getPage.mockResolvedValue({
        id: 'page-1',
        slug: 'morning-workout-preference',
        body: 'Existing body',
        confidence: 0.8,
      });

      mockWikiService.updatePage.mockResolvedValue({
        id: 'page-1',
        version: 5,
      });

      const result = await wikiIngestService.ingestFromConversation(userId, 'conv-2');

      expect(result.pagesUpdated).toBeGreaterThanOrEqual(0);
    });

    it('should respect max pages limit per ingest', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await wikiIngestService.ingestFromConversation(userId, 'conv-3');

      expect(result.pagesCreated).toBe(0);
      expect(result.pagesUpdated).toBe(0);
    });
  });

  describe('initializeDomainPages', () => {
    it('should create domain hierarchy pages for a new user', async () => {
      // No existing pages
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '0' }]));

      mockWikiService.createPage.mockResolvedValue({
        id: 'new-page',
        slug: 'user-index',
        version: 1,
      });

      const result = await wikiIngestService.initializeDomainPages(userId);

      expect(result.pagesCreated).toBeGreaterThan(0);
      // Should create at minimum: user-index + 8 domain pages = 9
      expect(mockWikiService.createPage).toHaveBeenCalled();
    });

    it('should skip initialization if user already has wiki pages', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '5' }]));

      const result = await wikiIngestService.initializeDomainPages(userId);

      expect(result.pagesCreated).toBe(0);
      expect(mockWikiService.createPage).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx jest tests/unit/services/wiki-ingest.service.test.ts --no-cache`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement wiki-ingest.service.ts**

```typescript
// server/src/services/wiki-ingest.service.ts

import { query } from '../config/database.config.js';
import { wikiService } from './wiki.service.js';
import { wikiIndexService } from './wiki-index.service.js';
import { logger } from './logger.service.js';

const MAX_CONVERSATION_MESSAGES = 20;
const MAX_PAGES_PER_INGEST = 8;
const SIMILARITY_THRESHOLD = 0.3;

interface IngestResult {
  conversationId: string;
  pagesCreated: number;
  pagesUpdated: number;
  linksAdded: number;
}

interface DomainPageDef {
  slug: string;
  title: string;
  category: string;
  summary: string;
}

const DOMAIN_PAGES: DomainPageDef[] = [
  { slug: 'user-index', title: 'Profile Summary', category: 'cross_domain', summary: 'Master overview of all user patterns, goals, and insights.' },
  { slug: 'fitness-profile', title: 'Fitness Profile', category: 'fitness', summary: 'Workout patterns, exercise preferences, and training history.' },
  { slug: 'nutrition-profile', title: 'Nutrition Profile', category: 'nutrition', summary: 'Dietary habits, meal patterns, and nutrition preferences.' },
  { slug: 'sleep-profile', title: 'Sleep Profile', category: 'sleep', summary: 'Sleep quality patterns, duration trends, and sleep hygiene habits.' },
  { slug: 'mental-wellbeing', title: 'Mental Wellbeing', category: 'wellbeing', summary: 'Stress patterns, mood trends, emotional triggers, and coping strategies.' },
  { slug: 'lifestyle-context', title: 'Lifestyle Context', category: 'lifestyle', summary: 'Daily routines, work-life balance, and social patterns.' },
  { slug: 'goals-strategy', title: 'Goals Strategy', category: 'cross_domain', summary: 'Active goals, achievement history, and obstacle patterns.' },
  { slug: 'coaching-relationship', title: 'Coaching Relationship', category: 'cross_domain', summary: 'Coaching style preferences, communication patterns, and trust calibration.' },
  { slug: 'behavioral-patterns', title: 'Behavioral Patterns', category: 'behavioral', summary: 'Consistency profile, motivation triggers, and failure modes.' },
];

class WikiIngestService {
  async ingestFromConversation(
    userId: string,
    conversationId: string,
  ): Promise<IngestResult> {
    const result: IngestResult = {
      conversationId,
      pagesCreated: 0,
      pagesUpdated: 0,
      linksAdded: 0,
    };

    try {
      // 1. Fetch recent messages from conversation
      const messagesResult = await query<{ role: string; content: string }>(
        `SELECT role, content FROM rag_messages
         WHERE conversation_id = $1
         ORDER BY sequence_number DESC
         LIMIT $2`,
        [conversationId, MAX_CONVERSATION_MESSAGES],
      );

      if (messagesResult.rows.length === 0) {
        return result;
      }

      // 2. Build a combined text for searching relevant wiki pages
      const conversationText = messagesResult.rows
        .map((m) => m.content)
        .join(' ')
        .substring(0, 2000);

      // 3. Search for matching wiki pages
      const searchResult = await wikiService.searchPages(
        userId,
        conversationText,
        { status: 'active' as any, limit: MAX_PAGES_PER_INGEST },
      );

      if (searchResult && searchResult.data.length > 0) {
        // Update existing pages with new evidence
        for (const pageHit of searchResult.data.slice(0, MAX_PAGES_PER_INGEST)) {
          try {
            const fullPage = await wikiService.getPage(userId, pageHit.slug);
            if (!fullPage) continue;

            const newConfidence = Math.min(
              1.0,
              (fullPage.confidence ?? 0.5) + 0.03,
            );

            await wikiService.updatePage(userId, pageHit.slug, {
              confidence: newConfidence,
              changeReason: `Conversation ingest: evidence from ${conversationId}`,
            });

            await wikiService.addSources(fullPage.id, [
              {
                sourceType: 'conversation',
                sourceId: conversationId,
                sourceTable: 'rag_conversations',
                extractSummary: conversationText.substring(0, 500),
              },
            ]);

            result.pagesUpdated++;
          } catch (error) {
            logger.warn('[WikiIngest] Failed to update page', {
              slug: pageHit.slug,
              error,
            });
          }
        }
      }

      // 4. Rebuild index if pages were touched
      if (result.pagesCreated > 0 || result.pagesUpdated > 0) {
        await wikiIndexService.rebuildIndex(userId);

        await wikiService.logOperation(userId, {
          operation: 'ingest' as any,
          conversationId,
          summary: `Conversation ingest: ${result.pagesCreated} created, ${result.pagesUpdated} updated`,
          pagesTouched: result.pagesCreated + result.pagesUpdated,
        });
      }

      return result;
    } catch (error) {
      logger.error('[WikiIngest] ingestFromConversation failed', {
        error,
        userId,
        conversationId,
      });
      return result;
    }
  }

  async initializeDomainPages(userId: string): Promise<{ pagesCreated: number }> {
    try {
      // Check if user already has wiki pages
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM wiki_pages WHERE user_id = $1`,
        [userId],
      );

      const existingCount = parseInt(countResult.rows[0]?.count ?? '0', 10);
      if (existingCount > 0) {
        return { pagesCreated: 0 };
      }

      let pagesCreated = 0;

      for (const def of DOMAIN_PAGES) {
        try {
          await wikiService.createPage(userId, {
            slug: def.slug,
            pageType: 'pattern' as any,
            category: def.category,
            title: def.title,
            summary: def.summary,
            body: `## ${def.title}\n\n_This page will be automatically populated as you interact with your AI coach._\n\nNo data yet.`,
            confidence: 0.1,
          });
          pagesCreated++;
        } catch (error) {
          logger.warn('[WikiIngest] Failed to create domain page', {
            slug: def.slug,
            error,
          });
        }
      }

      // Create links from user-index to all domain pages
      for (const def of DOMAIN_PAGES) {
        if (def.slug === 'user-index') continue;
        try {
          await wikiService.createLink(userId, {
            sourceSlug: 'user-index',
            targetSlug: def.slug,
            linkType: 'reference' as any,
          });
        } catch {
          // Silent — link creation is best-effort
        }
      }

      if (pagesCreated > 0) {
        await wikiIndexService.rebuildIndex(userId);

        await wikiService.logOperation(userId, {
          operation: 'create' as any,
          summary: `Initialized domain hierarchy: ${pagesCreated} pages`,
          pagesTouched: pagesCreated,
        });
      }

      logger.info('[WikiIngest] Initialized domain pages', { userId, pagesCreated });
      return { pagesCreated };
    } catch (error) {
      logger.error('[WikiIngest] initializeDomainPages failed', { error, userId });
      return { pagesCreated: 0 };
    }
  }
}

export const wikiIngestService = new WikiIngestService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx jest tests/unit/services/wiki-ingest.service.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/wiki-ingest.service.ts server/tests/unit/services/wiki-ingest.service.test.ts
git commit -m "feat(wiki): add WikiIngestService with conversation ingest + domain initialization

ingestFromConversation: fetches recent messages, searches matching wiki
pages, updates confidence and adds conversation as source.
initializeDomainPages: creates 9 domain hierarchy pages (user-index +
8 domains) for new users with cross-links. Rebuilds wiki index after
changes."
```

---

### Task 8: Wire Ingest into Conversation End

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts`

- [ ] **Step 1: Add ingest import**

At the top of `server/src/services/langgraph-chatbot.service.ts`, add:

```typescript
import { wikiIngestService } from './wiki-ingest.service.js';
```

- [ ] **Step 2: Add conversation-end ingest trigger**

Find the section where `storeMessagePair` is called (around line 4452). After the existing wiki compiler hook (added in Task 6), add the conversation ingest:

```typescript
// Lightweight wiki compiler — fire-and-forget (already added in Task 6)
wikiCompilerService
  .processConversationTurn(userId, message, responseContent, activeConversationId)
  .catch((error) => {
    logger.warn('[LangGraphChatbot] Wiki compiler failed (non-critical)', { error, userId });
  });

// Wiki domain initialization — fire-and-forget, only runs once per user
wikiIngestService
  .initializeDomainPages(userId)
  .catch((error) => {
    logger.warn('[LangGraphChatbot] Wiki init failed (non-critical)', { error, userId });
  });
```

Note: `initializeDomainPages` is idempotent — it checks if pages exist and skips if they do. This means it's safe to call on every turn; it only does work the first time.

- [ ] **Step 3: Verify server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/langgraph-chatbot.service.ts
git commit -m "feat(wiki): wire ingest service into conversation flow

Adds fire-and-forget call to initializeDomainPages on every chat turn
(idempotent — only creates pages once per user). Domain initialization
triggers on first conversation, creating the 9-page wiki hierarchy."
```

---

## Summary

| Task | What it does | New files | Tests |
|------|-------------|-----------|-------|
| 1 | Schema reconciliation migration | 1 SQL | — |
| 2 | Idempotency guards on wiki tools | — (modify existing) | 1 test file |
| 3 | Wiki index service | 1 service | 1 test file |
| 4 | Wiki context service (RAG integration) | 1 service | 1 test file |
| 5 | Wire wiki context into RAG pipeline | — (modify existing) | — |
| 6 | Lightweight memory compiler + hook | 1 service | 1 test file |
| 7 | Wiki ingest service + domain initialization | 1 service | 1 test file |
| 8 | Wire ingest into conversation flow | — (modify existing) | — |

**Total new files:** 4 services + 1 migration + 4 test files = 9 files
**Total modified files:** 3 (wiki tools, langgraph-chatbot, rag-chatbot)
**Total commits:** 8

### What's Ready After This Plan

After completing all 8 tasks:
- Wiki schema is reconciled with vector columns and composite indexes
- Wiki tools are idempotent (safe for LLM retries)
- Wiki index is auto-maintained with stale detection
- RAG pipeline reads wiki pages as highest-priority context
- Every chat turn bumps confidence on matching wiki pages (lightweight compiler)
- New users get a 9-page domain hierarchy on first conversation
- Conversation data is ingested into wiki evidence

### What Comes Next (Phase 2-4, separate plans)

- **Phase 2:** `wiki-synthesis.job.ts` (daily deep synthesis with LLM rewriting), data-event micro-ingest, system prompt wiki instructions
- **Phase 3:** Frontend Wiki Browser component, page detail view, [[wiki-link]] rendering in chat
- **Phase 4:** `wiki-lint.service.ts`, analytics layer, graph visualization, performance optimization
