# LLM Wiki Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, compounding LLM Wiki layer to the AI Coach that incrementally builds structured, interlinked pages from user health data, conversations, and sources — replacing re-derived RAG synthesis with pre-compiled knowledge.

**Architecture:** New wiki layer with 6 database tables, a server-side WikiService + WikiIngestService, 10 LangGraph tools for the AI agent, REST API endpoints, and a Wiki Browser UI integrated into the existing Intelligence Files Drawer. The wiki sits between raw data sources and AI Coach responses, providing pre-synthesized context.

**Tech Stack:** PostgreSQL (pgvector), Express.js, Zod, LangGraph/LangChain, React, Framer Motion, Tailwind CSS, Lucide icons

**Design Spec:** `docs/superpowers/specs/2026-05-06-llm-wiki-layer-design.md`

---

## File Structure

### New Files

```
shared/types/domain/wiki.ts                              # Shared type definitions
server/src/database/migrations/20260506000000_wiki.sql    # Database migration
server/src/validators/wiki.validator.ts                   # Zod validation schemas
server/src/services/wiki.service.ts                       # Core CRUD + search + versioning
server/src/services/wiki-ingest.service.ts                # Ingest pipeline
server/src/services/wiki-lint.service.ts                  # Health check / lint
server/src/services/wiki-index.service.ts                 # Index maintenance
server/src/controllers/wiki.controller.ts                 # REST controller
server/src/routes/wiki.routes.ts                          # Express routes
server/src/services/langgraph-tools/domains/wiki.ts       # LangGraph tool definitions
server/src/__tests__/wiki.service.test.ts                 # Service tests
client/src/shared/services/wiki.service.ts                # Frontend API client
client/app/(pages)/ai-coach/hooks/useWikiBrowser.ts       # Wiki browser state hook
client/app/(pages)/ai-coach/components/WikiBrowserDrawer.tsx  # Wiki browser UI
client/app/(pages)/ai-coach/components/WikiPageCard.tsx   # Page card component
client/app/(pages)/ai-coach/components/WikiPageDetail.tsx # Page detail view
```

### Modified Files

```
server/src/services/index.ts                              # Export new wiki services
server/src/routes/index.ts                                # Mount wiki routes
server/src/services/langgraph-tools/registry.ts           # Register wiki tools
server/src/services/langgraph-chatbot.service.ts          # Add wiki to system prompt + context
shared/types/domain/index.ts                              # Export wiki types
client/app/(pages)/ai-coach/AICoachPageContent.tsx        # Add wiki browser hook + drawer
client/app/(pages)/ai-coach/components/AICoachHeader.tsx  # Add wiki browser button
client/app/(pages)/ai-coach/components/IntelligenceFilesDrawer.tsx  # Add wiki folder
client/src/shared/services/intelligence-files.service.ts  # Re-export wiki folder in getFolders
```

---

## Phase 1: Schema + Core Service

### Task 1: Shared Type Definitions

**Files:**
- Create: `shared/types/domain/wiki.ts`
- Modify: `shared/types/domain/index.ts`

- [ ] **Step 1: Create wiki type definitions**

```typescript
// shared/types/domain/wiki.ts

/**
 * @file Wiki Domain Types
 * @description Type definitions for the LLM Wiki layer
 */

// ============ ENUMS ============

export type WikiPageType = 'entity' | 'concept' | 'pattern' | 'journal' | 'synthesis' | 'source';

export type WikiPageStatus = 'active' | 'stale' | 'contradicted' | 'archived' | 'draft';

export type WikiLinkType = 'reference' | 'contradicts' | 'supports' | 'supersedes' | 'derived_from' | 'see_also';

export type WikiLogOperation =
  | 'ingest'
  | 'update'
  | 'create'
  | 'lint'
  | 'query_filed'
  | 'contradiction_detected'
  | 'stale_marked'
  | 'archived';

// ============ CORE INTERFACES ============

export interface WikiPage {
  id: string;
  userId: string;
  slug: string;
  pageType: WikiPageType;
  category: string;
  title: string;
  summary: string;
  body: string;
  frontmatter: Record<string, unknown>;
  confidence: number;
  evidenceCount: number;
  wordCount: number;
  status: WikiPageStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastLintAt: string | null;
  staleAfterDays: number;
}

export interface WikiPageWithLinks extends WikiPage {
  outboundLinks: WikiLink[];
  inboundLinks: WikiLink[];
}

export interface WikiLink {
  id: string;
  userId: string;
  sourcePageId: string;
  targetPageId: string;
  sourceSlug?: string;
  targetSlug?: string;
  sourceTitle?: string;
  targetTitle?: string;
  linkType: WikiLinkType;
  context: string | null;
  anchorText: string | null;
  createdAt: string;
}

export interface WikiPageSource {
  id: string;
  pageId: string;
  sourceType: string;
  sourceId: string;
  sourceTable: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  rowCount: number | null;
  extractSummary: string | null;
  createdAt: string;
}

export interface WikiLogEntry {
  id: string;
  userId: string;
  operation: WikiLogOperation;
  pageIds: string[];
  sourceType: string | null;
  sourceId: string | null;
  conversationId: string | null;
  summary: string;
  details: Record<string, unknown>;
  pagesTouched: number;
  createdAt: string;
}

export interface WikiIndex {
  id: string;
  userId: string;
  content: string;
  pageCount: number;
  countsByType: Record<WikiPageType, number>;
  countsByCategory: Record<string, number>;
  orphanCount: number;
  staleCount: number;
  contradictedCount: number;
  updatedAt: string;
}

export interface WikiPageVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  summary: string;
  body: string;
  frontmatter: Record<string, unknown>;
  confidence: number;
  evidenceCount: number;
  changeReason: string | null;
  triggerType: string | null;
  triggerId: string | null;
  createdAt: string;
}

// ============ INPUT TYPES ============

export interface CreateWikiPageInput {
  slug: string;
  pageType: WikiPageType;
  category: string;
  title: string;
  summary: string;
  body: string;
  frontmatter?: Record<string, unknown>;
  confidence?: number;
  sources?: CreateWikiPageSourceInput[];
}

export interface UpdateWikiPageInput {
  title?: string;
  summary?: string;
  body?: string;
  frontmatter?: Record<string, unknown>;
  confidence?: number;
  status?: WikiPageStatus;
  changeReason: string;
}

export interface CreateWikiPageSourceInput {
  sourceType: string;
  sourceId: string;
  sourceTable: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  rowCount?: number;
  extractSummary?: string;
}

export interface CreateWikiLinkInput {
  sourceSlug: string;
  targetSlug: string;
  linkType: WikiLinkType;
  context?: string;
  anchorText?: string;
}

// ============ SEARCH & FILTER ============

export interface WikiSearchFilters {
  pageType?: WikiPageType;
  category?: string;
  status?: WikiPageStatus;
  minConfidence?: number;
  page?: number;
  limit?: number;
  sort?: 'updated_at' | 'confidence' | 'title';
  order?: 'asc' | 'desc';
}

export interface WikiSearchResult {
  page: WikiPage;
  similarity: number;
  matchContext: string | null;
}

// ============ STATS ============

export interface WikiStats {
  totalPages: number;
  activePages: number;
  stalePages: number;
  contradictedPages: number;
  orphanPages: number;
  totalLinks: number;
  totalSources: number;
  countsByType: Record<string, number>;
  countsByCategory: Record<string, number>;
  lastIngestAt: string | null;
  lastLintAt: string | null;
}

// ============ INGEST ============

export interface IngestResult {
  pagesCreated: number;
  pagesUpdated: number;
  linksAdded: number;
  logEntryId: string;
  pageIds: string[];
}
```

- [ ] **Step 2: Export from shared types index**

Add to `shared/types/domain/index.ts`:

```typescript
export * from './wiki.js';
```

- [ ] **Step 3: Commit**

```bash
git add shared/types/domain/wiki.ts shared/types/domain/index.ts
git commit -m "feat(wiki): add shared type definitions for LLM Wiki layer"
```

---

### Task 2: Database Migration

**Files:**
- Create: `server/src/database/migrations/20260506000000_wiki.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- ============================================================
-- LLM WIKI LAYER
-- Migration: 20260506000000_wiki.sql
-- Description: Persistent, compounding wiki for AI Coach
-- ============================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ ENUMS ============

DO $$ BEGIN
  CREATE TYPE wiki_page_type AS ENUM (
    'entity', 'concept', 'pattern', 'journal', 'synthesis', 'source'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wiki_page_status AS ENUM (
    'active', 'stale', 'contradicted', 'archived', 'draft'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wiki_link_type AS ENUM (
    'reference', 'contradicts', 'supports', 'supersedes', 'derived_from', 'see_also'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wiki_log_operation AS ENUM (
    'ingest', 'update', 'create', 'lint', 'query_filed',
    'contradiction_detected', 'stale_marked', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============ 1. WIKI PAGES ============

CREATE TABLE IF NOT EXISTS wiki_pages (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug               VARCHAR(255) NOT NULL,
  page_type          wiki_page_type NOT NULL,
  category           VARCHAR(64) NOT NULL,
  title              VARCHAR(255) NOT NULL,
  summary            TEXT NOT NULL,
  body               TEXT NOT NULL,
  frontmatter        JSONB NOT NULL DEFAULT '{}',
  confidence         REAL NOT NULL DEFAULT 0.5,
  evidence_count     INTEGER NOT NULL DEFAULT 0,
  word_count         INTEGER NOT NULL DEFAULT 0,
  status             wiki_page_status NOT NULL DEFAULT 'active',
  version            INTEGER NOT NULL DEFAULT 1,
  summary_embedding  TEXT,
  body_embedding     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_lint_at       TIMESTAMPTZ,
  stale_after_days   INTEGER NOT NULL DEFAULT 30,
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_type
  ON wiki_pages(user_id, page_type, status);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_category
  ON wiki_pages(user_id, category, status);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_updated
  ON wiki_pages(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_stale
  ON wiki_pages(user_id, status, updated_at)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS update_wiki_pages_updated_at ON wiki_pages;
CREATE TRIGGER update_wiki_pages_updated_at
  BEFORE UPDATE ON wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============ 2. WIKI LINKS ============

CREATE TABLE IF NOT EXISTS wiki_links (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_page_id    UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  target_page_id    UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  link_type         wiki_link_type NOT NULL DEFAULT 'reference',
  context           TEXT,
  anchor_text       VARCHAR(255),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_page_id, target_page_id, link_type),
  CHECK(source_page_id != target_page_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_links_source ON wiki_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_target ON wiki_links(target_page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_user_type ON wiki_links(user_id, link_type);

-- ============ 3. WIKI PAGE SOURCES ============

CREATE TABLE IF NOT EXISTS wiki_page_sources (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  source_type       VARCHAR(64) NOT NULL,
  source_id         UUID NOT NULL,
  source_table      VARCHAR(128) NOT NULL,
  date_range_start  DATE,
  date_range_end    DATE,
  row_count         INTEGER,
  extract_summary   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_page_sources_page ON wiki_page_sources(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_page_sources_source ON wiki_page_sources(source_type, source_id);

-- ============ 4. WIKI LOG ============

CREATE TABLE IF NOT EXISTS wiki_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation         wiki_log_operation NOT NULL,
  page_ids          UUID[] NOT NULL DEFAULT '{}',
  source_type       VARCHAR(64),
  source_id         UUID,
  conversation_id   UUID,
  summary           TEXT NOT NULL,
  details           JSONB DEFAULT '{}',
  pages_touched     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wiki_log_user_time ON wiki_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_log_operation ON wiki_log(user_id, operation);

-- ============ 5. WIKI INDEX ============

CREATE TABLE IF NOT EXISTS wiki_index (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content               TEXT NOT NULL DEFAULT '',
  page_count            INTEGER NOT NULL DEFAULT 0,
  counts_by_type        JSONB NOT NULL DEFAULT '{}',
  counts_by_category    JSONB NOT NULL DEFAULT '{}',
  orphan_count          INTEGER NOT NULL DEFAULT 0,
  stale_count           INTEGER NOT NULL DEFAULT 0,
  contradicted_count    INTEGER NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============ 6. WIKI PAGE VERSIONS ============

CREATE TABLE IF NOT EXISTS wiki_page_versions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  version           INTEGER NOT NULL,
  title             VARCHAR(255) NOT NULL,
  summary           TEXT NOT NULL,
  body              TEXT NOT NULL,
  frontmatter       JSONB NOT NULL DEFAULT '{}',
  confidence        REAL NOT NULL,
  evidence_count    INTEGER NOT NULL,
  change_reason     TEXT,
  trigger_type      VARCHAR(32),
  trigger_id        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page_id, version)
);

CREATE INDEX IF NOT EXISTS idx_wiki_page_versions_page
  ON wiki_page_versions(page_id, version DESC);
```

- [ ] **Step 2: Verify migration syntax locally**

Run: `cd server && npx ts-node -e "import { readFileSync } from 'fs'; console.log('Migration file OK:', readFileSync('src/database/migrations/20260506000000_wiki.sql', 'utf8').length, 'bytes')"`

Expected: File size printed without error.

- [ ] **Step 3: Commit**

```bash
git add server/src/database/migrations/20260506000000_wiki.sql
git commit -m "feat(wiki): add database migration for wiki tables"
```

---

### Task 3: Zod Validators

**Files:**
- Create: `server/src/validators/wiki.validator.ts`

- [ ] **Step 1: Create validator schemas**

```typescript
// server/src/validators/wiki.validator.ts

import { z } from 'zod';

const pageTypeEnum = z.enum(['entity', 'concept', 'pattern', 'journal', 'synthesis', 'source']);
const pageStatusEnum = z.enum(['active', 'stale', 'contradicted', 'archived', 'draft']);
const linkTypeEnum = z.enum(['reference', 'contradicts', 'supports', 'supersedes', 'derived_from', 'see_also']);
const categoryEnum = z.enum(['fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain']);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const wikiPageSourceSchema = z.object({
  sourceType: z.string().min(1).max(64),
  sourceId: z.string().uuid(),
  sourceTable: z.string().min(1).max(128),
  dateRangeStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateRangeEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rowCount: z.number().int().min(0).optional(),
  extractSummary: z.string().max(1000).optional(),
});

export const createWikiPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(slugRegex, 'Slug must be lowercase with hyphens only'),
  pageType: pageTypeEnum,
  category: categoryEnum,
  title: z.string().min(1).max(255),
  summary: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  frontmatter: z.record(z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(wikiPageSourceSchema).optional(),
});

export const updateWikiPageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  summary: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(50000).optional(),
  frontmatter: z.record(z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  status: pageStatusEnum.optional(),
  changeReason: z.string().min(1).max(500),
});

export const createWikiLinkSchema = z.object({
  sourceSlug: z.string().min(1).max(255),
  targetSlug: z.string().min(1).max(255),
  linkType: linkTypeEnum,
  context: z.string().max(500).optional(),
  anchorText: z.string().max(255).optional(),
});

export const listWikiPagesQuerySchema = z.object({
  pageType: pageTypeEnum.optional(),
  category: categoryEnum.optional(),
  status: pageStatusEnum.optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(['updated_at', 'confidence', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const searchWikiQuerySchema = z.object({
  q: z.string().min(1).max(500),
  pageType: pageTypeEnum.optional(),
  category: categoryEnum.optional(),
  status: pageStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const flagWikiPageSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const wikiPageFeedbackSchema = z.object({
  action: z.enum(['verify', 'correct', 'dispute']),
  correction: z.string().max(2000).optional(),
  comment: z.string().max(500).optional(),
});

export {
  pageTypeEnum,
  pageStatusEnum,
  linkTypeEnum,
  categoryEnum,
  wikiPageSourceSchema,
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/validators/wiki.validator.ts
git commit -m "feat(wiki): add Zod validation schemas"
```

---

### Task 4: WikiService — Core CRUD

**Files:**
- Create: `server/src/services/wiki.service.ts`

- [ ] **Step 1: Write test file**

Create: `server/src/__tests__/wiki.service.test.ts`

```typescript
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { query } from '../config/database.config.js';
import { wikiService } from '../services/wiki.service.js';

const TEST_USER = '00000000-0000-0000-0000-00000000bb01';

async function insertTestUser(id: string, email: string): Promise<void> {
  await query(
    `INSERT INTO users (id, email, password, first_name, last_name, role_id, onboarding_status, is_email_verified, is_active)
     VALUES ($1, $2, 'x', 'Test', 'User', '11111111-1111-1111-1111-111111111101', 'completed', true, true)
     ON CONFLICT (id) DO NOTHING`,
    [id, email],
  );
}

beforeAll(async () => {
  await insertTestUser(TEST_USER, 'wiki-test@example.com');
});

beforeEach(async () => {
  await query('DELETE FROM wiki_page_versions WHERE page_id IN (SELECT id FROM wiki_pages WHERE user_id = $1)', [TEST_USER]);
  await query('DELETE FROM wiki_page_sources WHERE page_id IN (SELECT id FROM wiki_pages WHERE user_id = $1)', [TEST_USER]);
  await query('DELETE FROM wiki_links WHERE user_id = $1', [TEST_USER]);
  await query('DELETE FROM wiki_log WHERE user_id = $1', [TEST_USER]);
  await query('DELETE FROM wiki_index WHERE user_id = $1', [TEST_USER]);
  await query('DELETE FROM wiki_pages WHERE user_id = $1', [TEST_USER]);
});

afterAll(async () => {
  await query('DELETE FROM wiki_pages WHERE user_id = $1', [TEST_USER]);
  await query('DELETE FROM wiki_index WHERE user_id = $1', [TEST_USER]);
  await query('DELETE FROM wiki_log WHERE user_id = $1', [TEST_USER]);
  await query('DELETE FROM users WHERE id = $1', [TEST_USER]);
});

describe('wikiService', () => {
  describe('createPage', () => {
    it('creates a page with correct fields', async () => {
      const page = await wikiService.createPage(TEST_USER, {
        slug: 'morning-workout',
        pageType: 'pattern',
        category: 'fitness',
        title: 'Morning Workout Pattern',
        summary: 'User performs best with morning workouts before 8am',
        body: '## Morning Workout Pattern\n\nUser consistently performs better...',
      });
      expect(page.id).toBeDefined();
      expect(page.slug).toBe('morning-workout');
      expect(page.pageType).toBe('pattern');
      expect(page.category).toBe('fitness');
      expect(page.version).toBe(1);
      expect(page.status).toBe('active');
      expect(page.confidence).toBe(0.5);
    });

    it('rejects duplicate slug per user', async () => {
      await wikiService.createPage(TEST_USER, {
        slug: 'test-slug',
        pageType: 'concept',
        category: 'fitness',
        title: 'Test',
        summary: 'Test summary',
        body: 'Test body',
      });
      await expect(
        wikiService.createPage(TEST_USER, {
          slug: 'test-slug',
          pageType: 'concept',
          category: 'fitness',
          title: 'Dupe',
          summary: 'Dupe summary',
          body: 'Dupe body',
        }),
      ).rejects.toThrow(/already exists/i);
    });

    it('calculates word count from body', async () => {
      const page = await wikiService.createPage(TEST_USER, {
        slug: 'word-count-test',
        pageType: 'entity',
        category: 'nutrition',
        title: 'Word Count',
        summary: 'Test',
        body: 'one two three four five',
      });
      expect(page.wordCount).toBe(5);
    });
  });

  describe('getPage', () => {
    it('returns page with links', async () => {
      const p1 = await wikiService.createPage(TEST_USER, {
        slug: 'page-a',
        pageType: 'concept',
        category: 'fitness',
        title: 'Page A',
        summary: 'A',
        body: 'Body A',
      });
      const p2 = await wikiService.createPage(TEST_USER, {
        slug: 'page-b',
        pageType: 'concept',
        category: 'fitness',
        title: 'Page B',
        summary: 'B',
        body: 'Body B references [[page-a]]',
      });
      await wikiService.createLink(TEST_USER, {
        sourceSlug: 'page-b',
        targetSlug: 'page-a',
        linkType: 'reference',
        anchorText: 'page-a',
      });

      const result = await wikiService.getPage(TEST_USER, 'page-a');
      expect(result).not.toBeNull();
      expect(result!.inboundLinks.length).toBe(1);
      expect(result!.inboundLinks[0].sourcePageId).toBe(p2.id);
    });

    it('returns null for missing slug', async () => {
      const result = await wikiService.getPage(TEST_USER, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updatePage', () => {
    it('creates a version snapshot before updating', async () => {
      const page = await wikiService.createPage(TEST_USER, {
        slug: 'versioned',
        pageType: 'pattern',
        category: 'sleep',
        title: 'Original Title',
        summary: 'Original',
        body: 'Original body',
      });

      const updated = await wikiService.updatePage(TEST_USER, 'versioned', {
        title: 'Updated Title',
        body: 'Updated body with more content',
        changeReason: 'New data from May',
      });

      expect(updated.version).toBe(2);
      expect(updated.title).toBe('Updated Title');

      const versions = await wikiService.getVersions(TEST_USER, 'versioned');
      expect(versions.length).toBe(1);
      expect(versions[0].version).toBe(1);
      expect(versions[0].title).toBe('Original Title');
    });
  });

  describe('listPages', () => {
    it('filters by page type and category', async () => {
      await wikiService.createPage(TEST_USER, {
        slug: 'pattern-1', pageType: 'pattern', category: 'fitness',
        title: 'P1', summary: 'S1', body: 'B1',
      });
      await wikiService.createPage(TEST_USER, {
        slug: 'concept-1', pageType: 'concept', category: 'fitness',
        title: 'C1', summary: 'S2', body: 'B2',
      });
      await wikiService.createPage(TEST_USER, {
        slug: 'pattern-2', pageType: 'pattern', category: 'nutrition',
        title: 'P2', summary: 'S3', body: 'B3',
      });

      const patterns = await wikiService.listPages(TEST_USER, { pageType: 'pattern' });
      expect(patterns.data.length).toBe(2);

      const fitnessPatterns = await wikiService.listPages(TEST_USER, {
        pageType: 'pattern', category: 'fitness',
      });
      expect(fitnessPatterns.data.length).toBe(1);
      expect(fitnessPatterns.data[0].slug).toBe('pattern-1');
    });
  });

  describe('archivePage', () => {
    it('sets status to archived', async () => {
      await wikiService.createPage(TEST_USER, {
        slug: 'to-archive', pageType: 'entity', category: 'nutrition',
        title: 'Archive Me', summary: 'S', body: 'B',
      });
      await wikiService.archivePage(TEST_USER, 'to-archive');
      const page = await wikiService.getPage(TEST_USER, 'to-archive');
      expect(page!.status).toBe('archived');
    });
  });

  describe('links', () => {
    it('creates bidirectional link lookups', async () => {
      await wikiService.createPage(TEST_USER, {
        slug: 'src', pageType: 'pattern', category: 'fitness',
        title: 'Source', summary: 'S', body: 'B',
      });
      await wikiService.createPage(TEST_USER, {
        slug: 'tgt', pageType: 'concept', category: 'fitness',
        title: 'Target', summary: 'S', body: 'B',
      });
      const link = await wikiService.createLink(TEST_USER, {
        sourceSlug: 'src',
        targetSlug: 'tgt',
        linkType: 'supports',
        context: 'Source supports target claim',
      });
      expect(link.id).toBeDefined();
      expect(link.linkType).toBe('supports');

      const srcLinks = await wikiService.getLinks(TEST_USER, 'src');
      expect(srcLinks.outbound.length).toBe(1);
      expect(srcLinks.inbound.length).toBe(0);

      const tgtLinks = await wikiService.getLinks(TEST_USER, 'tgt');
      expect(tgtLinks.outbound.length).toBe(0);
      expect(tgtLinks.inbound.length).toBe(1);
    });
  });

  describe('getOrphans', () => {
    it('finds pages with no inbound links', async () => {
      await wikiService.createPage(TEST_USER, {
        slug: 'connected', pageType: 'concept', category: 'fitness',
        title: 'Connected', summary: 'S', body: 'B',
      });
      await wikiService.createPage(TEST_USER, {
        slug: 'orphan', pageType: 'concept', category: 'fitness',
        title: 'Orphan', summary: 'S', body: 'B',
      });
      await wikiService.createPage(TEST_USER, {
        slug: 'linker', pageType: 'pattern', category: 'fitness',
        title: 'Linker', summary: 'S', body: 'See [[connected]]',
      });
      await wikiService.createLink(TEST_USER, {
        sourceSlug: 'linker', targetSlug: 'connected', linkType: 'reference',
      });

      const orphans = await wikiService.getOrphans(TEST_USER);
      const slugs = orphans.map((p) => p.slug);
      expect(slugs).toContain('orphan');
      expect(slugs).toContain('linker');
      expect(slugs).not.toContain('connected');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx jest src/__tests__/wiki.service.test.ts --no-coverage 2>&1 | head -30`

Expected: FAIL — `Cannot find module '../services/wiki.service.js'`

- [ ] **Step 3: Implement WikiService**

```typescript
// server/src/services/wiki.service.ts

/**
 * @file Wiki Service
 * @description Core CRUD, search, versioning, and link management for the LLM Wiki layer
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import type {
  WikiPage, WikiPageWithLinks, WikiLink, WikiPageSource, WikiPageVersion,
  WikiSearchFilters, WikiSearchResult, WikiStats, WikiLogEntry,
  CreateWikiPageInput, UpdateWikiPageInput, CreateWikiLinkInput, CreateWikiPageSourceInput,
} from '../../../shared/types/domain/wiki.js';

let wikiTableExistsCache: boolean | null = null;

async function hasWikiTable(): Promise<boolean> {
  if (wikiTableExistsCache !== null) return wikiTableExistsCache;
  try {
    await query('SELECT 1 FROM wiki_pages LIMIT 0');
    wikiTableExistsCache = true;
    return true;
  } catch {
    wikiTableExistsCache = false;
    return false;
  }
}

function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: string }).code;
  return code === '42P01';
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function mapPageRow(row: Record<string, unknown>): WikiPage {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    slug: row.slug as string,
    pageType: row.page_type as WikiPage['pageType'],
    category: row.category as string,
    title: row.title as string,
    summary: row.summary as string,
    body: row.body as string,
    frontmatter: (row.frontmatter as Record<string, unknown>) || {},
    confidence: row.confidence as number,
    evidenceCount: row.evidence_count as number,
    wordCount: row.word_count as number,
    status: row.status as WikiPage['status'],
    version: row.version as number,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    lastLintAt: row.last_lint_at ? (row.last_lint_at as Date).toISOString() : null,
    staleAfterDays: row.stale_after_days as number,
  };
}

function mapLinkRow(row: Record<string, unknown>): WikiLink {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    sourcePageId: row.source_page_id as string,
    targetPageId: row.target_page_id as string,
    sourceSlug: row.source_slug as string | undefined,
    targetSlug: row.target_slug as string | undefined,
    sourceTitle: row.source_title as string | undefined,
    targetTitle: row.target_title as string | undefined,
    linkType: row.link_type as WikiLink['linkType'],
    context: (row.context as string) || null,
    anchorText: (row.anchor_text as string) || null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function mapVersionRow(row: Record<string, unknown>): WikiPageVersion {
  return {
    id: row.id as string,
    pageId: row.page_id as string,
    version: row.version as number,
    title: row.title as string,
    summary: row.summary as string,
    body: row.body as string,
    frontmatter: (row.frontmatter as Record<string, unknown>) || {},
    confidence: row.confidence as number,
    evidenceCount: row.evidence_count as number,
    changeReason: (row.change_reason as string) || null,
    triggerType: (row.trigger_type as string) || null,
    triggerId: (row.trigger_id as string) || null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

class WikiService {
  // ============ PAGES ============

  async createPage(userId: string, input: CreateWikiPageInput): Promise<WikiPage> {
    const existing = await query(
      'SELECT id FROM wiki_pages WHERE user_id = $1 AND slug = $2',
      [userId, input.slug],
    );
    if (existing.rows.length > 0) {
      throw new Error(`Wiki page with slug "${input.slug}" already exists`);
    }

    const wordCount = countWords(input.body);
    const result = await query(
      `INSERT INTO wiki_pages (user_id, slug, page_type, category, title, summary, body, frontmatter, confidence, evidence_count, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10)
       RETURNING *`,
      [
        userId, input.slug, input.pageType, input.category,
        input.title, input.summary, input.body,
        JSON.stringify(input.frontmatter || {}),
        input.confidence ?? 0.5, wordCount,
      ],
    );

    const page = mapPageRow(result.rows[0]);

    if (input.sources && input.sources.length > 0) {
      await this.addSources(page.id, input.sources);
      await query(
        'UPDATE wiki_pages SET evidence_count = $1 WHERE id = $2',
        [input.sources.length, page.id],
      );
      page.evidenceCount = input.sources.length;
    }

    return page;
  }

  async getPage(userId: string, slug: string): Promise<WikiPageWithLinks | null> {
    const result = await query(
      'SELECT * FROM wiki_pages WHERE user_id = $1 AND slug = $2',
      [userId, slug],
    );
    if (result.rows.length === 0) return null;

    const page = mapPageRow(result.rows[0]);
    const links = await this.getLinks(userId, slug);

    return { ...page, outboundLinks: links.outbound, inboundLinks: links.inbound };
  }

  async updatePage(userId: string, slug: string, input: UpdateWikiPageInput): Promise<WikiPage> {
    const current = await query(
      'SELECT * FROM wiki_pages WHERE user_id = $1 AND slug = $2',
      [userId, slug],
    );
    if (current.rows.length === 0) {
      throw new Error(`Wiki page "${slug}" not found`);
    }

    const row = current.rows[0];

    await query(
      `INSERT INTO wiki_page_versions (page_id, version, title, summary, body, frontmatter, confidence, evidence_count, change_reason, trigger_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'update')`,
      [
        row.id, row.version, row.title, row.summary, row.body,
        row.frontmatter, row.confidence, row.evidence_count,
        input.changeReason,
      ],
    );

    const sets: string[] = ['version = version + 1'];
    const values: unknown[] = [];
    let idx = 1;

    if (input.title !== undefined) { sets.push(`title = $${idx}`); values.push(input.title); idx++; }
    if (input.summary !== undefined) { sets.push(`summary = $${idx}`); values.push(input.summary); idx++; }
    if (input.body !== undefined) {
      sets.push(`body = $${idx}`); values.push(input.body); idx++;
      sets.push(`word_count = $${idx}`); values.push(countWords(input.body)); idx++;
    }
    if (input.frontmatter !== undefined) { sets.push(`frontmatter = $${idx}`); values.push(JSON.stringify(input.frontmatter)); idx++; }
    if (input.confidence !== undefined) { sets.push(`confidence = $${idx}`); values.push(input.confidence); idx++; }
    if (input.status !== undefined) { sets.push(`status = $${idx}`); values.push(input.status); idx++; }

    values.push(userId, slug);
    const result = await query(
      `UPDATE wiki_pages SET ${sets.join(', ')} WHERE user_id = $${idx} AND slug = $${idx + 1} RETURNING *`,
      values,
    );

    return mapPageRow(result.rows[0]);
  }

  async archivePage(userId: string, slug: string): Promise<void> {
    const result = await query(
      `UPDATE wiki_pages SET status = 'archived' WHERE user_id = $1 AND slug = $2 RETURNING id`,
      [userId, slug],
    );
    if (result.rows.length === 0) {
      throw new Error(`Wiki page "${slug}" not found`);
    }
  }

  async listPages(
    userId: string,
    filters: WikiSearchFilters = {},
  ): Promise<{ data: WikiPage[]; total: number }> {
    const conditions = ['user_id = $1'];
    const values: unknown[] = [userId];
    let idx = 2;

    if (filters.pageType) { conditions.push(`page_type = $${idx}`); values.push(filters.pageType); idx++; }
    if (filters.category) { conditions.push(`category = $${idx}`); values.push(filters.category); idx++; }
    if (filters.status) { conditions.push(`status = $${idx}`); values.push(filters.status); idx++; }
    else { conditions.push(`status != 'archived'`); }
    if (filters.minConfidence !== undefined) { conditions.push(`confidence >= $${idx}`); values.push(filters.minConfidence); idx++; }

    const where = conditions.join(' AND ');
    const sort = filters.sort || 'updated_at';
    const order = filters.order || 'desc';
    const limit = filters.limit || 50;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM wiki_pages WHERE ${where}`, values),
      query(
        `SELECT * FROM wiki_pages WHERE ${where} ORDER BY ${sort} ${order} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset],
      ),
    ]);

    return {
      data: dataResult.rows.map(mapPageRow),
      total: parseInt(countResult.rows[0].total as string),
    };
  }

  // ============ SEARCH ============

  async searchPages(userId: string, queryText: string, filters: WikiSearchFilters = {}): Promise<WikiSearchResult[]> {
    const limit = filters.limit || 10;
    const keywords = queryText.toLowerCase().split(/\s+/).filter((w) => w.length > 2).slice(0, 5);
    if (keywords.length === 0) return [];

    const conditions = ['user_id = $1', `status != 'archived'`];
    const values: unknown[] = [userId];
    let idx = 2;

    if (filters.pageType) { conditions.push(`page_type = $${idx}`); values.push(filters.pageType); idx++; }
    if (filters.category) { conditions.push(`category = $${idx}`); values.push(filters.category); idx++; }

    const keywordConditions = keywords.map((kw) => {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(summary) LIKE $${idx} OR LOWER(body) LIKE $${idx})`);
      values.push(`%${kw}%`);
      idx++;
      return null;
    });

    const where = conditions.join(' AND ');
    values.push(limit);

    const result = await query(
      `SELECT *, 
        (CASE WHEN LOWER(title) LIKE $${2} THEN 0.9 WHEN LOWER(summary) LIKE $${2} THEN 0.7 ELSE 0.5 END) as similarity
       FROM wiki_pages WHERE ${where} ORDER BY similarity DESC, updated_at DESC LIMIT $${idx}`,
      values,
    );

    return result.rows.map((row) => ({
      page: mapPageRow(row),
      similarity: row.similarity as number,
      matchContext: null,
    }));
  }

  // ============ LINKS ============

  async createLink(userId: string, input: CreateWikiLinkInput): Promise<WikiLink> {
    const [source, target] = await Promise.all([
      query('SELECT id FROM wiki_pages WHERE user_id = $1 AND slug = $2', [userId, input.sourceSlug]),
      query('SELECT id FROM wiki_pages WHERE user_id = $1 AND slug = $2', [userId, input.targetSlug]),
    ]);

    if (source.rows.length === 0) throw new Error(`Source page "${input.sourceSlug}" not found`);
    if (target.rows.length === 0) throw new Error(`Target page "${input.targetSlug}" not found`);

    const sourceId = source.rows[0].id as string;
    const targetId = target.rows[0].id as string;

    const result = await query(
      `INSERT INTO wiki_links (user_id, source_page_id, target_page_id, link_type, context, anchor_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (source_page_id, target_page_id, link_type) DO UPDATE SET context = EXCLUDED.context
       RETURNING *`,
      [userId, sourceId, targetId, input.linkType, input.context || null, input.anchorText || null],
    );

    return mapLinkRow(result.rows[0]);
  }

  async getLinks(userId: string, slug: string): Promise<{ outbound: WikiLink[]; inbound: WikiLink[] }> {
    const pageResult = await query('SELECT id FROM wiki_pages WHERE user_id = $1 AND slug = $2', [userId, slug]);
    if (pageResult.rows.length === 0) return { outbound: [], inbound: [] };

    const pageId = pageResult.rows[0].id as string;

    const [outbound, inbound] = await Promise.all([
      query(
        `SELECT l.*, tp.slug as target_slug, tp.title as target_title
         FROM wiki_links l JOIN wiki_pages tp ON l.target_page_id = tp.id
         WHERE l.source_page_id = $1`,
        [pageId],
      ),
      query(
        `SELECT l.*, sp.slug as source_slug, sp.title as source_title
         FROM wiki_links l JOIN wiki_pages sp ON l.source_page_id = sp.id
         WHERE l.target_page_id = $1`,
        [pageId],
      ),
    ]);

    return {
      outbound: outbound.rows.map(mapLinkRow),
      inbound: inbound.rows.map(mapLinkRow),
    };
  }

  async getOrphans(userId: string): Promise<WikiPage[]> {
    const result = await query(
      `SELECT p.* FROM wiki_pages p
       WHERE p.user_id = $1 AND p.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM wiki_links l WHERE l.target_page_id = p.id)
       ORDER BY p.updated_at DESC`,
      [userId],
    );
    return result.rows.map(mapPageRow);
  }

  // ============ SOURCES ============

  async addSources(pageId: string, sources: CreateWikiPageSourceInput[]): Promise<void> {
    for (const src of sources) {
      await query(
        `INSERT INTO wiki_page_sources (page_id, source_type, source_id, source_table, date_range_start, date_range_end, row_count, extract_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (page_id, source_type, source_id) DO UPDATE SET extract_summary = EXCLUDED.extract_summary`,
        [pageId, src.sourceType, src.sourceId, src.sourceTable, src.dateRangeStart || null, src.dateRangeEnd || null, src.rowCount || null, src.extractSummary || null],
      );
    }
  }

  // ============ VERSIONING ============

  async getVersions(userId: string, slug: string): Promise<WikiPageVersion[]> {
    const pageResult = await query('SELECT id FROM wiki_pages WHERE user_id = $1 AND slug = $2', [userId, slug]);
    if (pageResult.rows.length === 0) return [];

    const result = await query(
      'SELECT * FROM wiki_page_versions WHERE page_id = $1 ORDER BY version DESC',
      [pageResult.rows[0].id],
    );
    return result.rows.map(mapVersionRow);
  }

  async getVersion(userId: string, slug: string, version: number): Promise<WikiPageVersion | null> {
    const pageResult = await query('SELECT id FROM wiki_pages WHERE user_id = $1 AND slug = $2', [userId, slug]);
    if (pageResult.rows.length === 0) return null;

    const result = await query(
      'SELECT * FROM wiki_page_versions WHERE page_id = $1 AND version = $2',
      [pageResult.rows[0].id, version],
    );
    return result.rows.length > 0 ? mapVersionRow(result.rows[0]) : null;
  }

  // ============ LOG ============

  async logOperation(userId: string, entry: Omit<WikiLogEntry, 'id' | 'userId' | 'createdAt'>): Promise<void> {
    await query(
      `INSERT INTO wiki_log (user_id, operation, page_ids, source_type, source_id, conversation_id, summary, details, pages_touched)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId, entry.operation, entry.pageIds, entry.sourceType || null,
        entry.sourceId || null, entry.conversationId || null,
        entry.summary, JSON.stringify(entry.details || {}), entry.pagesTouched,
      ],
    );
  }

  async getLog(userId: string, limit = 20): Promise<WikiLogEntry[]> {
    const result = await query(
      'SELECT * FROM wiki_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return result.rows.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      operation: row.operation as WikiLogEntry['operation'],
      pageIds: (row.page_ids as string[]) || [],
      sourceType: (row.source_type as string) || null,
      sourceId: (row.source_id as string) || null,
      conversationId: (row.conversation_id as string) || null,
      summary: row.summary as string,
      details: (row.details as Record<string, unknown>) || {},
      pagesTouched: row.pages_touched as number,
      createdAt: (row.created_at as Date).toISOString(),
    }));
  }

  // ============ STATS ============

  async getStats(userId: string): Promise<WikiStats> {
    try {
      const [pagesResult, linksResult, sourcesResult, logResult] = await Promise.all([
        query(
          `SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'active') as active,
            COUNT(*) FILTER (WHERE status = 'stale') as stale,
            COUNT(*) FILTER (WHERE status = 'contradicted') as contradicted,
            json_object_agg(COALESCE(page_type::text, 'unknown'), type_count) as by_type,
            json_object_agg(COALESCE(category, 'unknown'), cat_count) as by_category
           FROM wiki_pages
           LEFT JOIN (SELECT page_type as pt, COUNT(*) as type_count FROM wiki_pages WHERE user_id = $1 GROUP BY page_type) t ON TRUE
           LEFT JOIN (SELECT category as cat, COUNT(*) as cat_count FROM wiki_pages WHERE user_id = $1 GROUP BY category) c ON TRUE
           WHERE user_id = $1`,
          [userId],
        ),
        query('SELECT COUNT(*) as total FROM wiki_links WHERE user_id = $1', [userId]),
        query('SELECT COUNT(*) as total FROM wiki_page_sources WHERE page_id IN (SELECT id FROM wiki_pages WHERE user_id = $1)', [userId]),
        query(`SELECT MAX(created_at) as last_ingest FROM wiki_log WHERE user_id = $1 AND operation = 'ingest'`, [userId]),
      ]);

      const orphans = await this.getOrphans(userId);

      const pr = pagesResult.rows[0] || {};
      return {
        totalPages: parseInt((pr.total as string) || '0'),
        activePages: parseInt((pr.active as string) || '0'),
        stalePages: parseInt((pr.stale as string) || '0'),
        contradictedPages: parseInt((pr.contradicted as string) || '0'),
        orphanPages: orphans.length,
        totalLinks: parseInt((linksResult.rows[0]?.total as string) || '0'),
        totalSources: parseInt((sourcesResult.rows[0]?.total as string) || '0'),
        countsByType: (pr.by_type as Record<string, number>) || {},
        countsByCategory: (pr.by_category as Record<string, number>) || {},
        lastIngestAt: logResult.rows[0]?.last_ingest ? (logResult.rows[0].last_ingest as Date).toISOString() : null,
        lastLintAt: null,
      };
    } catch (error) {
      if (isMissingTable(error)) {
        return {
          totalPages: 0, activePages: 0, stalePages: 0, contradictedPages: 0,
          orphanPages: 0, totalLinks: 0, totalSources: 0,
          countsByType: {}, countsByCategory: {},
          lastIngestAt: null, lastLintAt: null,
        };
      }
      throw error;
    }
  }

  // ============ HELPERS ============

  parseWikiLinks(body: string): string[] {
    const regex = /\[\[([a-z0-9-]+)\]\]/g;
    const slugs: string[] = [];
    let match;
    while ((match = regex.exec(body)) !== null) {
      if (!slugs.includes(match[1])) slugs.push(match[1]);
    }
    return slugs;
  }

  async resolveLinks(userId: string, slugs: string[]): Promise<Map<string, string>> {
    if (slugs.length === 0) return new Map();
    const placeholders = slugs.map((_, i) => `$${i + 2}`).join(', ');
    const result = await query(
      `SELECT id, slug FROM wiki_pages WHERE user_id = $1 AND slug IN (${placeholders})`,
      [userId, ...slugs],
    );
    const map = new Map<string, string>();
    for (const row of result.rows) {
      map.set(row.slug as string, row.id as string);
    }
    return map;
  }
}

export const wikiService = new WikiService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx jest src/__tests__/wiki.service.test.ts --no-coverage`

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/wiki.service.ts server/src/__tests__/wiki.service.test.ts
git commit -m "feat(wiki): implement WikiService with CRUD, links, versioning, and search"
```

---

### Task 5: Controller + Routes

**Files:**
- Create: `server/src/controllers/wiki.controller.ts`
- Create: `server/src/routes/wiki.routes.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Create wiki controller**

```typescript
// server/src/controllers/wiki.controller.ts

/**
 * @file Wiki Controller
 * @description REST controller for the LLM Wiki layer
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { wikiService } from '../services/wiki.service.js';
import {
  createWikiPageSchema, updateWikiPageSchema, createWikiLinkSchema,
  listWikiPagesQuerySchema, searchWikiQuerySchema, flagWikiPageSchema,
  wikiPageFeedbackSchema,
} from '../validators/wiki.validator.js';

class WikiController {
  listPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const filters = listWikiPagesQuerySchema.parse(req.query);
    const result = await wikiService.listPages(userId, filters);

    ApiResponse.success(res, result, 'Wiki pages retrieved', undefined, req);
  });

  getPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const page = await wikiService.getPage(userId, req.params.slug);
    if (!page) throw ApiError.notFound('Wiki page not found');

    ApiResponse.success(res, { page }, 'Wiki page retrieved', undefined, req);
  });

  createPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const input = createWikiPageSchema.parse(req.body);
    const page = await wikiService.createPage(userId, input);

    ApiResponse.success(res, { page }, 'Wiki page created', 201, req);
  });

  updatePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const input = updateWikiPageSchema.parse(req.body);
    const page = await wikiService.updatePage(userId, req.params.slug, input);

    ApiResponse.success(res, { page }, 'Wiki page updated', undefined, req);
  });

  archivePage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    await wikiService.archivePage(userId, req.params.slug);
    ApiResponse.success(res, null, 'Wiki page archived', undefined, req);
  });

  searchPages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const params = searchWikiQuerySchema.parse(req.query);
    const results = await wikiService.searchPages(userId, params.q, {
      pageType: params.pageType,
      category: params.category,
      status: params.status,
      limit: params.limit,
    });

    ApiResponse.success(res, { results }, 'Search complete', undefined, req);
  });

  getRelated = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const links = await wikiService.getLinks(userId, req.params.slug);
    ApiResponse.success(res, { links }, 'Related pages retrieved', undefined, req);
  });

  getStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const stats = await wikiService.getStats(userId);
    ApiResponse.success(res, { stats }, 'Wiki stats retrieved', undefined, req);
  });

  getOrphans = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const orphans = await wikiService.getOrphans(userId);
    ApiResponse.success(res, { orphans }, 'Orphan pages retrieved', undefined, req);
  });

  getVersions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const versions = await wikiService.getVersions(userId, req.params.slug);
    ApiResponse.success(res, { versions }, 'Version history retrieved', undefined, req);
  });

  getVersion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const version = await wikiService.getVersion(userId, req.params.slug, parseInt(req.params.version));
    if (!version) throw ApiError.notFound('Version not found');

    ApiResponse.success(res, { version }, 'Version retrieved', undefined, req);
  });

  getLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const limit = parseInt((req.query.limit as string) || '20');
    const log = await wikiService.getLog(userId, limit);

    ApiResponse.success(res, { log }, 'Wiki log retrieved', undefined, req);
  });

  createLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const input = createWikiLinkSchema.parse(req.body);
    const link = await wikiService.createLink(userId, input);

    ApiResponse.success(res, { link }, 'Link created', 201, req);
  });

  getPageLinks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const links = await wikiService.getLinks(userId, req.params.slug);
    ApiResponse.success(res, links, 'Page links retrieved', undefined, req);
  });

  flagPage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { reason } = flagWikiPageSchema.parse(req.body);
    await wikiService.logOperation(userId, {
      operation: 'lint',
      pageIds: [],
      sourceType: 'user_flag',
      sourceId: null,
      conversationId: null,
      summary: `User flagged page "${req.params.slug}": ${reason}`,
      details: { slug: req.params.slug, reason },
      pagesTouched: 1,
    });

    ApiResponse.success(res, null, 'Page flagged for review', undefined, req);
  });

  submitFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const feedback = wikiPageFeedbackSchema.parse(req.body);
    await wikiService.logOperation(userId, {
      operation: 'update',
      pageIds: [],
      sourceType: 'user_feedback',
      sourceId: null,
      conversationId: null,
      summary: `User ${feedback.action} page "${req.params.slug}"`,
      details: { slug: req.params.slug, ...feedback },
      pagesTouched: 1,
    });

    ApiResponse.success(res, null, 'Feedback submitted', undefined, req);
  });
}

export const wikiController = new WikiController();
```

- [ ] **Step 2: Create wiki routes**

```typescript
// server/src/routes/wiki.routes.ts

/**
 * @file Wiki Routes
 * @description API routes for the LLM Wiki layer
 * Mounted at /api/v1/wiki
 */

import { Router } from 'express';
import { wikiController } from '../controllers/wiki.controller.js';

const router = Router();

// Pages
router.get('/pages', wikiController.listPages);
router.post('/pages', wikiController.createPage);
router.get('/pages/:slug', wikiController.getPage);
router.patch('/pages/:slug', wikiController.updatePage);
router.delete('/pages/:slug', wikiController.archivePage);

// Page sub-resources
router.get('/pages/:slug/links', wikiController.getPageLinks);
router.get('/pages/:slug/versions', wikiController.getVersions);
router.get('/pages/:slug/versions/:version', wikiController.getVersion);
router.post('/pages/:slug/flag', wikiController.flagPage);
router.post('/pages/:slug/feedback', wikiController.submitFeedback);

// Search & navigation
router.get('/search', wikiController.searchPages);
router.get('/search/related/:slug', wikiController.getRelated);
router.get('/orphans', wikiController.getOrphans);

// Index & stats
router.get('/stats', wikiController.getStats);
router.get('/log', wikiController.getLog);

// Links
router.post('/links', wikiController.createLink);

export default router;
```

- [ ] **Step 3: Mount wiki routes in main router**

Find the routes index file and add the wiki routes. Add these lines following the existing pattern:

```typescript
import wikiRoutes from './wiki.routes.js';

// Add with other route mounts:
router.use('/v1/wiki', wikiRoutes);
```

- [ ] **Step 4: Export wiki service from services index**

Add to `server/src/services/index.ts`:

```typescript
export { wikiService } from './wiki.service.js';
```

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/wiki.controller.ts server/src/routes/wiki.routes.ts server/src/routes/index.ts server/src/services/index.ts
git commit -m "feat(wiki): add REST controller and routes for wiki API"
```

---

### Task 6: LangGraph Wiki Tools

**Files:**
- Create: `server/src/services/langgraph-tools/domains/wiki.ts`
- Modify: `server/src/services/langgraph-tools/registry.ts`

- [ ] **Step 1: Create wiki tool definitions**

```typescript
// server/src/services/langgraph-tools/domains/wiki.ts

import { z } from 'zod';
import { wikiService } from '../../wiki.service.js';
import type { ToolDefinition } from '../types.js';

const PAGE_TYPES = ['entity', 'concept', 'pattern', 'journal', 'synthesis', 'source'] as const;
const CATEGORIES = ['fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain'] as const;
const LINK_TYPES = ['reference', 'contradicts', 'supports', 'supersedes', 'derived_from', 'see_also'] as const;

const SearchWikiSchema = z.object({
  query: z.string().min(1).describe('Search query for wiki pages'),
  category: z.enum(CATEGORIES).optional().describe('Filter by category'),
  pageType: z.enum(PAGE_TYPES).optional().describe('Filter by page type'),
  limit: z.number().int().min(1).max(20).optional().describe('Max results (default 10)'),
});

const GetWikiPageSchema = z.object({
  slug: z.string().min(1).describe('Page slug (URL-friendly identifier)'),
});

const CreateWikiPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('URL-friendly page identifier'),
  pageType: z.enum(PAGE_TYPES).describe('Type of wiki page'),
  category: z.enum(CATEGORIES).describe('Page category'),
  title: z.string().min(1).max(255).describe('Page title'),
  summary: z.string().min(1).max(500).describe('One-line summary for the index'),
  body: z.string().min(1).max(50000).describe('Full markdown content. Use [[slug]] for cross-references'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score (0-1, default 0.5)'),
});

const UpdateWikiPageSchema = z.object({
  slug: z.string().min(1).describe('Page slug to update'),
  title: z.string().min(1).max(255).optional().describe('New title'),
  summary: z.string().min(1).max(500).optional().describe('New summary'),
  body: z.string().min(1).max(50000).optional().describe('New body content'),
  confidence: z.number().min(0).max(1).optional().describe('New confidence score'),
  changeReason: z.string().min(1).max(500).describe('Why this update is being made'),
});

const CreateWikiLinkSchema = z.object({
  sourceSlug: z.string().min(1).describe('Source page slug'),
  targetSlug: z.string().min(1).describe('Target page slug'),
  linkType: z.enum(LINK_TYPES).describe('Type of relationship between pages'),
  context: z.string().max(500).optional().describe('Sentence where the link appears'),
});

const FlagContradictionSchema = z.object({
  pageSlug: z.string().min(1).describe('Page containing the claim'),
  contradictingSlug: z.string().min(1).describe('Page with contradicting information'),
  explanation: z.string().min(1).max(500).describe('What specifically contradicts'),
});

const FileQueryAsPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('Page slug'),
  title: z.string().min(1).max(255).describe('Page title'),
  summary: z.string().min(1).max(500).describe('One-line summary'),
  body: z.string().min(1).max(50000).describe('Analysis content as markdown'),
  category: z.enum(CATEGORIES).describe('Category'),
});

async function searchWikiPages(userId: string, params: z.infer<typeof SearchWikiSchema>): Promise<string> {
  const results = await wikiService.searchPages(userId, params.query, {
    category: params.category,
    pageType: params.pageType,
    limit: params.limit || 10,
  });

  if (results.length === 0) {
    return JSON.stringify({ message: 'No matching wiki pages found', pages: [] });
  }

  const formatted = results.map((r) => ({
    slug: r.page.slug,
    type: r.page.pageType,
    category: r.page.category,
    title: r.page.title,
    summary: r.page.summary,
    confidence: r.page.confidence,
    similarity: r.similarity,
    updatedAt: r.page.updatedAt,
  }));

  return JSON.stringify({ pages: formatted, count: formatted.length }, null, 2);
}

async function getWikiPage(userId: string, params: z.infer<typeof GetWikiPageSchema>): Promise<string> {
  const page = await wikiService.getPage(userId, params.slug);
  if (!page) {
    return JSON.stringify({ message: `Wiki page "${params.slug}" not found` });
  }

  return JSON.stringify({
    slug: page.slug,
    type: page.pageType,
    category: page.category,
    title: page.title,
    summary: page.summary,
    body: page.body,
    confidence: page.confidence,
    version: page.version,
    status: page.status,
    updatedAt: page.updatedAt,
    outboundLinks: page.outboundLinks.map((l) => ({
      slug: l.targetSlug, title: l.targetTitle, type: l.linkType,
    })),
    inboundLinks: page.inboundLinks.map((l) => ({
      slug: l.sourceSlug, title: l.sourceTitle, type: l.linkType,
    })),
  }, null, 2);
}

async function createWikiPage(userId: string, params: z.infer<typeof CreateWikiPageSchema>): Promise<string> {
  const page = await wikiService.createPage(userId, {
    slug: params.slug,
    pageType: params.pageType,
    category: params.category,
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: params.confidence,
  });

  const linkedSlugs = wikiService.parseWikiLinks(params.body);
  for (const targetSlug of linkedSlugs) {
    try {
      await wikiService.createLink(userId, {
        sourceSlug: params.slug,
        targetSlug,
        linkType: 'reference',
        anchorText: targetSlug,
      });
    } catch {
      // Target page may not exist yet — skip
    }
  }

  await wikiService.logOperation(userId, {
    operation: 'create',
    pageIds: [page.id],
    sourceType: 'agent',
    sourceId: null,
    conversationId: null,
    summary: `Created wiki page: ${params.title}`,
    details: { slug: params.slug, pageType: params.pageType, category: params.category },
    pagesTouched: 1,
  });

  return JSON.stringify({
    message: `Wiki page "${params.title}" created`,
    slug: page.slug,
    id: page.id,
    linksCreated: linkedSlugs.length,
  }, null, 2);
}

async function updateWikiPage(userId: string, params: z.infer<typeof UpdateWikiPageSchema>): Promise<string> {
  const page = await wikiService.updatePage(userId, params.slug, {
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: params.confidence,
    changeReason: params.changeReason,
  });

  if (params.body) {
    const linkedSlugs = wikiService.parseWikiLinks(params.body);
    for (const targetSlug of linkedSlugs) {
      try {
        await wikiService.createLink(userId, {
          sourceSlug: params.slug,
          targetSlug,
          linkType: 'reference',
          anchorText: targetSlug,
        });
      } catch {
        // Skip if target doesn't exist
      }
    }
  }

  await wikiService.logOperation(userId, {
    operation: 'update',
    pageIds: [page.id],
    sourceType: 'agent',
    sourceId: null,
    conversationId: null,
    summary: `Updated wiki page: ${page.title} — ${params.changeReason}`,
    details: { slug: params.slug, version: page.version },
    pagesTouched: 1,
  });

  return JSON.stringify({
    message: `Wiki page "${page.title}" updated to v${page.version}`,
    slug: page.slug,
    version: page.version,
  }, null, 2);
}

async function createWikiLink(userId: string, params: z.infer<typeof CreateWikiLinkSchema>): Promise<string> {
  const link = await wikiService.createLink(userId, {
    sourceSlug: params.sourceSlug,
    targetSlug: params.targetSlug,
    linkType: params.linkType,
    context: params.context,
  });

  return JSON.stringify({
    message: `Link created: ${params.sourceSlug} → ${params.targetSlug} (${params.linkType})`,
    linkId: link.id,
  }, null, 2);
}

async function flagContradiction(userId: string, params: z.infer<typeof FlagContradictionSchema>): Promise<string> {
  await wikiService.createLink(userId, {
    sourceSlug: params.pageSlug,
    targetSlug: params.contradictingSlug,
    linkType: 'contradicts',
    context: params.explanation,
  });

  await wikiService.updatePage(userId, params.contradictingSlug, {
    status: 'contradicted',
    changeReason: `Contradicted by [[${params.pageSlug}]]: ${params.explanation}`,
  });

  await wikiService.logOperation(userId, {
    operation: 'contradiction_detected',
    pageIds: [],
    sourceType: 'agent',
    sourceId: null,
    conversationId: null,
    summary: `Contradiction: "${params.pageSlug}" contradicts "${params.contradictingSlug}"`,
    details: { explanation: params.explanation },
    pagesTouched: 2,
  });

  return JSON.stringify({
    message: `Contradiction flagged between "${params.pageSlug}" and "${params.contradictingSlug}"`,
    explanation: params.explanation,
  }, null, 2);
}

async function fileQueryAsPage(userId: string, params: z.infer<typeof FileQueryAsPageSchema>): Promise<string> {
  const page = await wikiService.createPage(userId, {
    slug: params.slug,
    pageType: 'synthesis',
    category: params.category,
    title: params.title,
    summary: params.summary,
    body: params.body,
    confidence: 0.7,
  });

  const linkedSlugs = wikiService.parseWikiLinks(params.body);
  for (const targetSlug of linkedSlugs) {
    try {
      await wikiService.createLink(userId, {
        sourceSlug: params.slug,
        targetSlug,
        linkType: 'derived_from',
        anchorText: targetSlug,
      });
    } catch {
      // Skip
    }
  }

  await wikiService.logOperation(userId, {
    operation: 'query_filed',
    pageIds: [page.id],
    sourceType: 'agent',
    sourceId: null,
    conversationId: null,
    summary: `Filed query answer as wiki page: ${params.title}`,
    details: { slug: params.slug },
    pagesTouched: 1,
  });

  return JSON.stringify({
    message: `Answer filed as wiki page "${params.title}"`,
    slug: page.slug,
    id: page.id,
  }, null, 2);
}

export function registerWikiTools(): ToolDefinition[] {
  return [
    {
      name: 'search_wiki_pages',
      description: 'Search the user\'s personal health wiki for relevant pages. Use this BEFORE answering complex questions to leverage pre-synthesized knowledge.',
      schema: SearchWikiSchema,
      handler: searchWikiPages,
    },
    {
      name: 'get_wiki_page',
      description: 'Read a specific wiki page by slug. Returns full content with outbound and inbound cross-references.',
      schema: GetWikiPageSchema,
      handler: getWikiPage,
    },
    {
      name: 'create_wiki_page',
      description: 'Create a new wiki page. Use [[slug]] in the body for cross-references. Page types: entity (things), concept (ideas), pattern (user behaviors), journal (time summaries), synthesis (analysis), source (ingested document).',
      schema: CreateWikiPageSchema,
      handler: createWikiPage,
    },
    {
      name: 'update_wiki_page',
      description: 'Update an existing wiki page with new information. Automatically versions the old content. Always provide a changeReason explaining what new data prompted the update.',
      schema: UpdateWikiPageSchema,
      handler: updateWikiPage,
    },
    {
      name: 'create_wiki_link',
      description: 'Create a typed cross-reference between two wiki pages. Link types: reference (general), contradicts, supports, supersedes, derived_from, see_also.',
      schema: CreateWikiLinkSchema,
      handler: createWikiLink,
    },
    {
      name: 'flag_wiki_contradiction',
      description: 'Flag that one wiki page contradicts another. Marks the older page as contradicted and creates a contradiction link.',
      schema: FlagContradictionSchema,
      handler: flagContradiction,
    },
    {
      name: 'file_query_as_wiki_page',
      description: 'File a valuable Q&A exchange as a permanent synthesis page in the wiki. Use when your answer contains insights worth preserving.',
      schema: FileQueryAsPageSchema,
      handler: fileQueryAsPage,
    },
  ];
}
```

- [ ] **Step 2: Register wiki tools in the tool registry**

Find `server/src/services/langgraph-tools/registry.ts` and add the wiki domain. Follow the existing registration pattern:

```typescript
import { registerWikiTools } from './domains/wiki.js';

// Add to the tool registration section:
const wikiTools = registerWikiTools();
allTools.push(...wikiTools);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/services/langgraph-tools/domains/wiki.ts server/src/services/langgraph-tools/registry.ts
git commit -m "feat(wiki): add LangGraph wiki tools (search, create, update, link, flag)"
```

---

### Task 7: System Prompt Wiki Instructions

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts`

- [ ] **Step 1: Add wiki instructions to the system prompt**

Find the system prompt assembly section in `langgraph-chatbot.service.ts` (the `BASE_HUMAN_LIKE_PROMPT` constant or system prompt builder). Add this wiki section after the existing memory instructions:

```typescript
const WIKI_SYSTEM_PROMPT_SECTION = `
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
`;
```

- [ ] **Step 2: Inject wiki section into system prompt assembly**

Find where the system prompt is assembled (the function that builds the full system message) and add `WIKI_SYSTEM_PROMPT_SECTION` to the prompt string, after the memory section and before the tool instructions.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/langgraph-chatbot.service.ts
git commit -m "feat(wiki): add wiki instructions to AI Coach system prompt"
```

---

## Phase 2: Integration (Summary — detailed in follow-up)

### Task 8: Wiki Context Injection into RAG Pipeline
- Modify `rag-chatbot.service.ts` to search wiki pages and inject top results into context
- Add wiki pages as a new context section alongside memories and RAG chunks
- Token budget management (4K max for wiki context)

### Task 9: Conversation-End Ingest Trigger
- Hook into conversation completion in `langgraph-chatbot.service.ts`
- Extract insights from the conversation
- Call WikiIngestService to create/update pages
- Debounce to avoid thrashing

### Task 10: WikiIngestService
- Create `server/src/services/wiki-ingest.service.ts`
- Implement classify → find related → create/update pipeline
- Micro-ingest for single data events (workout logged, meal logged)
- Full ingest for conversation summaries

### Task 11: Periodic Synthesis Job
- Weekly journal page generation (cron or triggered)
- Monthly summary generation
- Stale page detection and marking

---

## Phase 3: Frontend (Summary — detailed in follow-up)

### Task 12: Frontend Wiki API Service
- Create `client/src/shared/services/wiki.service.ts`
- Mirror server endpoints with typed API client

### Task 13: useWikiBrowser Hook
- Create `client/app/(pages)/ai-coach/hooks/useWikiBrowser.ts`
- Drawer state, page navigation, search, folder browsing

### Task 14: WikiBrowserDrawer Component
- Create drawer with folder grid → page list → page detail navigation
- Match existing Intelligence Files Drawer styling exactly

### Task 15: WikiPageCard + WikiPageDetail Components
- Card with type badge, confidence bar, link count, staleness indicator
- Detail view with rendered markdown, clickable [[wiki-links]], sources, version history

### Task 16: AI Coach Integration
- Add wiki button to AICoachHeader
- Add wiki folder to IntelligenceFilesDrawer
- Wire up useWikiBrowser hook in AICoachPageContent

---

## Phase 4: Polish (Summary — detailed in follow-up)

### Task 17: WikiLintService
- Stale detection, orphan detection, contradiction scanning
- Gap detection (mentioned slugs without pages)
- Index regeneration

### Task 18: Wiki Graph Visualization
- D3 force graph of page-link relationships
- Category color coding, link type styling

### Task 19: Embedding-Based Search
- Replace keyword search with pgvector similarity
- Embed summaries on create/update via embedding queue

### Task 20: Seed Wiki from Existing Data
- Migrate existing intelligence memories into wiki pattern pages
- Generate initial entity pages from user's most-used exercises, foods, supplements
- Create first synthesis pages from conversation history
