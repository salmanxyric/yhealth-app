# LLM Wiki Layer — System Design

**Date:** 2026-05-06
**Status:** Draft
**Author:** AI Architect + Salman
**Scope:** Add a persistent, compounding wiki layer to the AI Coach (Aurea)

---

## 1. Problem Statement

The AI Coach currently manages knowledge through three disconnected systems:

| System | What it stores | Limitation |
|--------|---------------|------------|
| **RAG retrieval** | Raw conversation history, health KB chunks, user profile sections | Re-derives synthesis on every query. No accumulation. |
| **Intelligence Memories** | Atomic learned facts (patterns, preferences, rules) | Flat, isolated entries. No cross-referencing or narrative structure. |
| **Knowledge Graph** | Read-only projection of 31 data tables | Visual only. No persistent written synthesis. |

**The gap:** There is no layer where accumulated understanding lives as structured, interlinked documents. When the AI Coach needs to reason about "how does this user's sleep affect their workout consistency over the past 3 months?" — it must re-derive that synthesis from scattered memories, raw data, and conversation history every time. Nothing compounds.

## 2. Solution: The Wiki Layer

Add a **persistent wiki** — a collection of LLM-generated, interlinked pages that the AI Coach writes and maintains automatically. The wiki sits between raw sources (conversations, health data, user inputs) and the AI Coach's responses.

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                         │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  Chat (Aurea) │  │ Wiki Browser   │  │ Intelligence │ │
│  │               │  │ (new)          │  │ Drawer       │ │
│  └──────┬───────┘  └───────┬────────┘  └──────────────┘ │
│         │                  │                              │
├─────────┼──────────────────┼──────────────────────────────┤
│         ▼                  ▼         WIKI LAYER (NEW)     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  wiki_pages                          │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐            │  │
│  │  │ Entity  │ │ Concept  │ │ Synthesis  │ ...        │  │
│  │  │ Pages   │ │ Pages    │ │ Pages      │            │  │
│  │  └────┬────┘ └─────┬────┘ └─────┬─────┘            │  │
│  │       │            │            │                    │  │
│  │  ┌────┴────────────┴────────────┴─────┐             │  │
│  │  │  wiki_index  ←→  wiki_links        │             │  │
│  │  │  wiki_log    ←→  wiki_page_sources │             │  │
│  │  └────────────────────────────────────┘             │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
├─────────────────────────┼──────────────────────────────────┤
│         EXISTING SYSTEMS│                                  │
│  ┌──────┴───────┬───────┴──────┬──────────────────┐       │
│  │ RAG Chat     │ Intelligence │ Knowledge Graph   │       │
│  │ (messages,   │ (memories,   │ (31 data source   │       │
│  │  embeddings) │  artifacts,  │  projections)     │       │
│  │              │  plans, core │                    │       │
│  └──────────────┴──────────────┴──────────────────┘       │
│                         │                                  │
│  ┌──────────────────────┴─────────────────────────┐       │
│  │            RAW DATA LAYER                       │       │
│  │  workouts, meals, mood, sleep, habits, goals,   │       │
│  │  journal, biometrics, streaks, finances, etc.    │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Key Principle

**The wiki is a persistent, compounding artifact.** The AI Coach writes it. The user reads it. Cross-references are maintained. Contradictions are flagged. Synthesis reflects everything learned so far. Every conversation and data point makes the wiki richer.

## 3. Architecture

### 3.1 Three-Layer Model (adapted from Karpathy's LLM Wiki)

| Layer | yHealth Implementation | Owner | Mutability |
|-------|----------------------|-------|------------|
| **Raw Sources** | Existing data tables (31+ sources), conversation history, uploaded documents, wearable data | System / User | Append-only (immutable records) |
| **The Wiki** | `wiki_pages` table — structured, interlinked markdown pages with frontmatter | AI Coach (LLM) | LLM writes; user reads + can flag/correct |
| **The Schema** | `wiki_schema` config — page type definitions, category rules, ingest workflows, lint rules | Co-evolved (system + user preferences) | Configurable per user |

### 3.2 Wiki Page Types

```
wiki/
├── entities/          # People, supplements, exercises, foods, conditions
│   ├── creatine.md
│   ├── morning-hiit.md
│   └── lower-back-pain.md
├── concepts/          # Ideas, frameworks, principles
│   ├── progressive-overload.md
│   ├── sleep-hygiene.md
│   └── caloric-deficit.md
├── patterns/          # User-specific observed patterns
│   ├── monday-motivation-spike.md
│   ├── weekend-nutrition-drift.md
│   └── stress-sleep-cascade.md
├── journals/          # Period summaries (auto-generated)
│   ├── week-2026-18.md
│   ├── month-2026-04.md
│   └── quarter-2026-q1.md
├── syntheses/         # Cross-cutting analysis pages
│   ├── sleep-vs-performance.md
│   ├── nutrition-adherence-analysis.md
│   └── goal-progress-review.md
├── sources/           # One summary page per ingested source
│   ├── article-creatine-meta-analysis.md
│   └── podcast-huberman-sleep.md
└── index.md           # Master index (auto-maintained)
```

### 3.3 Page Structure (Markdown with YAML Frontmatter)

```markdown
---
id: "wp_uuid"
type: "pattern"                          # entity | concept | pattern | journal | synthesis | source
category: "fitness"                      # fitness | nutrition | sleep | wellbeing | lifestyle | cross_domain
title: "Weekend Nutrition Drift"
summary: "User consistently overconsumes calories on weekends, averaging +800 kcal vs weekdays"
confidence: 0.85
evidence_count: 14
sources:
  - { table: "meal_logs", count: 42, date_range: "2026-03-01..2026-05-01" }
  - { table: "intelligence_memories", ids: ["mem_abc", "mem_def"] }
links_to: ["caloric-deficit", "meal-prep-sunday", "weight-loss-goal"]
linked_from: ["month-2026-04", "nutrition-adherence-analysis"]
created_at: "2026-04-15T10:30:00Z"
updated_at: "2026-05-06T14:22:00Z"
version: 3
status: "active"                         # active | stale | contradicted | archived
---

## Weekend Nutrition Drift

User consistently overconsumes on Saturdays and Sundays, averaging **+800 kcal** 
above weekday baseline (2,100 → 2,900 kcal).

### Evidence

- **42 meal logs** (Mar–May 2026): Weekend average 2,870 kcal vs weekday 2,080 kcal
- **Pattern memory** [mem_abc]: "Higher calorie intake on social weekends" (confidence: 0.82)
- **Journal entries**: 6 mentions of "eating out" or "cheat meals" on weekends

### Key Observations

- Friday dinners are the trigger — social eating starts the pattern
- Saturday breakfast is often skipped → compensatory overeating at lunch
- Sunday meal prep partially mitigates (when it happens — see [[meal-prep-sunday]])

### Contradictions & Tensions

- ⚠️ Conflicts with stated goal of [[caloric-deficit]] for weight loss
- User's [[weight-loss-goal]] assumes consistent 500 kcal deficit — weekends erase 2 days of progress

### Recommendations (AI-generated)

1. Pre-log Friday dinner plans to stay within +300 kcal
2. Don't skip Saturday breakfast — see [[intermittent-fasting]] page for why this backfires
3. Increase [[meal-prep-sunday]] adherence (currently 25% — needs to hit 60%+)

### Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-05-06 | v3 | Added May meal data, updated averages |
| 2026-04-22 | v2 | Added contradiction with weight-loss goal |
| 2026-04-15 | v1 | Initial pattern detected from 4 weeks of data |
```

## 4. Database Schema

### 4.1 New Tables

```sql
-- ============================================================
-- LLM WIKI LAYER
-- ============================================================

-- Page type enum
CREATE TYPE wiki_page_type AS ENUM (
  'entity',      -- Things: supplements, exercises, foods, conditions, people
  'concept',     -- Ideas: progressive overload, sleep hygiene, caloric deficit
  'pattern',     -- User-specific: observed behavioral patterns
  'journal',     -- Time-based: weekly/monthly/quarterly summaries
  'synthesis',   -- Cross-cutting: multi-source analysis pages
  'source'       -- Ingested source summaries: articles, podcasts, papers
);

-- Page status enum
CREATE TYPE wiki_page_status AS ENUM (
  'active',        -- Current and maintained
  'stale',         -- Not updated in configured period
  'contradicted',  -- Newer evidence contradicts claims
  'archived',      -- Superseded or no longer relevant
  'draft'          -- Being generated, not yet finalized
);

-- ============================================================
-- 1. WIKI PAGES — The core wiki content
-- ============================================================
CREATE TABLE wiki_pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identity
  slug            VARCHAR(255) NOT NULL,          -- URL-friendly identifier
  page_type       wiki_page_type NOT NULL,
  category        intelligence_category NOT NULL,  -- Reuse existing enum
  
  -- Content
  title           VARCHAR(255) NOT NULL,
  summary         TEXT NOT NULL,                   -- One-line summary (for index)
  body            TEXT NOT NULL,                    -- Full markdown content
  frontmatter     JSONB NOT NULL DEFAULT '{}',     -- Structured metadata
  
  -- Quality signals
  confidence      REAL NOT NULL DEFAULT 0.5,       -- 0-1 aggregate confidence
  evidence_count  INTEGER NOT NULL DEFAULT 0,
  word_count      INTEGER NOT NULL DEFAULT 0,
  
  -- Status & versioning
  status          wiki_page_status NOT NULL DEFAULT 'active',
  version         INTEGER NOT NULL DEFAULT 1,
  
  -- Embeddings (for semantic search)
  summary_embedding  vector(1536),                 -- Summary embedding
  body_embedding     vector(1536),                 -- Full body embedding (chunked if long)
  
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_lint_at    TIMESTAMPTZ,                     -- Last health check
  stale_after     INTERVAL DEFAULT '30 days',      -- When to mark stale
  
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_wiki_pages_user_type ON wiki_pages(user_id, page_type, status);
CREATE INDEX idx_wiki_pages_user_category ON wiki_pages(user_id, category, status);
CREATE INDEX idx_wiki_pages_updated ON wiki_pages(user_id, updated_at DESC);
CREATE INDEX idx_wiki_pages_stale ON wiki_pages(user_id, status, updated_at)
  WHERE status = 'active';

-- ============================================================
-- 2. WIKI LINKS — Cross-references between pages (bidirectional)
-- ============================================================
CREATE TABLE wiki_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_page_id  UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  target_page_id  UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  
  -- Link metadata
  link_type       VARCHAR(32) NOT NULL DEFAULT 'reference',
    -- reference: general cross-reference
    -- contradicts: source contradicts target
    -- supports: source provides evidence for target
    -- supersedes: source replaces target
    -- derived_from: source was generated from target
    -- see_also: weak topical relationship
  context         TEXT,                             -- Sentence where link appears
  anchor_text     VARCHAR(255),                     -- [[anchor_text]] in markdown
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(source_page_id, target_page_id, link_type),
  CHECK(source_page_id != target_page_id)
);

CREATE INDEX idx_wiki_links_source ON wiki_links(source_page_id);
CREATE INDEX idx_wiki_links_target ON wiki_links(target_page_id);
CREATE INDEX idx_wiki_links_type ON wiki_links(user_id, link_type);

-- ============================================================
-- 3. WIKI PAGE SOURCES — Provenance: what raw data feeds each page
-- ============================================================
CREATE TABLE wiki_page_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  
  -- Source reference (polymorphic)
  source_type     VARCHAR(64) NOT NULL,
    -- 'intelligence_memory', 'rag_message', 'meal_log', 'workout_log',
    -- 'mood_log', 'journal_entry', 'health_knowledge_base', 'user_upload',
    -- 'intelligence_artifact', 'intelligence_analysis', 'conversation', etc.
  source_id       UUID NOT NULL,
  source_table    VARCHAR(128) NOT NULL,
  
  -- Context
  date_range_start DATE,
  date_range_end   DATE,
  row_count        INTEGER,
  extract_summary  TEXT,                            -- What was extracted from this source
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(page_id, source_type, source_id)
);

CREATE INDEX idx_wiki_page_sources_page ON wiki_page_sources(page_id);
CREATE INDEX idx_wiki_page_sources_source ON wiki_page_sources(source_type, source_id);

-- ============================================================
-- 4. WIKI LOG — Chronological record of all wiki operations
-- ============================================================
CREATE TABLE wiki_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Operation
  operation       VARCHAR(32) NOT NULL,
    -- 'ingest', 'update', 'create', 'lint', 'query_filed',
    -- 'contradiction_detected', 'stale_marked', 'archived'
  
  -- Context
  page_ids        UUID[] NOT NULL DEFAULT '{}',     -- Pages affected
  source_type     VARCHAR(64),                      -- What triggered this
  source_id       UUID,
  conversation_id UUID,                             -- If triggered from chat
  
  -- Details
  summary         TEXT NOT NULL,                    -- Human-readable description
  details         JSONB DEFAULT '{}',               -- Operation-specific metadata
  pages_touched   INTEGER NOT NULL DEFAULT 0,       -- Count of pages modified
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wiki_log_user_time ON wiki_log(user_id, created_at DESC);
CREATE INDEX idx_wiki_log_operation ON wiki_log(user_id, operation);

-- ============================================================
-- 5. WIKI INDEX — Auto-maintained master index
-- ============================================================
CREATE TABLE wiki_index (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Index content (regenerated on changes)
  content         TEXT NOT NULL,                    -- Rendered markdown index
  page_count      INTEGER NOT NULL DEFAULT 0,
  
  -- Category counts (for quick stats)
  counts_by_type  JSONB NOT NULL DEFAULT '{}',
  counts_by_category JSONB NOT NULL DEFAULT '{}',
  
  -- Health metrics
  orphan_count    INTEGER NOT NULL DEFAULT 0,       -- Pages with no inbound links
  stale_count     INTEGER NOT NULL DEFAULT 0,
  contradicted_count INTEGER NOT NULL DEFAULT 0,
  
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ============================================================
-- 6. WIKI PAGE VERSIONS — Version history for rollback
-- ============================================================
CREATE TABLE wiki_page_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  
  -- Snapshot
  title           VARCHAR(255) NOT NULL,
  summary         TEXT NOT NULL,
  body            TEXT NOT NULL,
  frontmatter     JSONB NOT NULL DEFAULT '{}',
  confidence      REAL NOT NULL,
  evidence_count  INTEGER NOT NULL,
  
  -- Change context
  change_reason   TEXT,                             -- Why this version was created
  trigger_type    VARCHAR(32),                      -- 'ingest', 'lint', 'user_correction', 'scheduled'
  trigger_id      UUID,                             -- Source/conversation that triggered change
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(page_id, version)
);

CREATE INDEX idx_wiki_page_versions_page ON wiki_page_versions(page_id, version DESC);
```

### 4.2 Relationship to Existing Tables

```
┌──────────────────────┐     ┌──────────────────────┐
│  wiki_pages          │────▶│  wiki_links          │
│  (id, slug, body)    │◀────│  (source ↔ target)   │
└──────────┬───────────┘     └──────────────────────┘
           │
           ▼
┌──────────────────────┐     ┌──────────────────────┐
│  wiki_page_sources   │────▶│  EXISTING TABLES     │
│  (polymorphic FK)    │     │  - intelligence_      │
└──────────────────────┘     │    memories           │
                             │  - rag_messages       │
┌──────────────────────┐     │  - meal_logs          │
│  wiki_page_versions  │     │  - workout_logs       │
│  (version history)   │     │  - mood_logs          │
└──────────────────────┘     │  - journal_entries    │
                             │  - health_knowledge_  │
┌──────────────────────┐     │    base               │
│  wiki_log            │     │  - user_goals         │
│  (operation history) │     │  - ...31+ tables      │
└──────────────────────┘     └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  wiki_index          │
│  (master index)      │
└──────────────────────┘
```

## 5. Operations

### 5.1 Ingest — When new data arrives

**Triggers:**
- User sends a message in AI Coach chat
- New health data logged (workout, meal, mood, sleep, etc.)
- User uploads a document (article, lab results, etc.)
- Weekly/monthly time boundary crossed
- User explicitly asks "add this to my wiki"

**Flow:**

```
NEW DATA EVENT (e.g., workout logged, conversation message)
    │
    ▼
┌──────────────────────────────┐
│  WIKI INGEST PIPELINE        │
│                              │
│  1. Classify data type       │
│  2. Find related wiki pages  │
│     (semantic search on      │
│      wiki_pages.summary_     │
│      embedding)              │
│  3. Decide: create new page  │
│     OR update existing?      │
│                              │
│  IF new page needed:         │
│    → Generate page content   │
│    → Extract wiki-links      │
│    → Store page + links      │
│    → Update index            │
│                              │
│  IF existing page update:    │
│    → Save version snapshot   │
│    → Regenerate sections     │
│    → Update cross-references │
│    → Check for contradictions│
│    → Update index            │
│                              │
│  4. Log operation            │
│  5. Queue embedding updates  │
└──────────────────────────────┘
```

**Ingest Modes:**

| Mode | Trigger | LLM Involvement | Pages Touched |
|------|---------|-----------------|---------------|
| **Micro-ingest** | Single data point (meal, mood) | Minimal — update counters, maybe a sentence | 1-2 pages |
| **Conversation ingest** | End of chat session | Medium — extract insights, update pattern pages | 3-8 pages |
| **Source ingest** | User uploads article/document | Full — read source, create summary, cross-reference | 5-15 pages |
| **Periodic synthesis** | Weekly/monthly cron | Full — generate journal page, update syntheses | 10-20 pages |

### 5.2 Query — Using the wiki to answer questions

**Current flow (without wiki):**
```
User question → RAG retrieves raw chunks → LLM synthesizes from scratch
```

**New flow (with wiki):**
```
User question
    │
    ▼
┌──────────────────────────────┐
│  1. Search wiki_index        │
│     (keyword + semantic)     │
│                              │
│  2. Read relevant wiki pages │
│     (follow links 1 level)   │
│                              │
│  3. Check for contradictions │
│     or stale pages           │
│                              │
│  4. Synthesize answer        │
│     with wiki citations      │
│     [[page-slug]]            │
│                              │
│  5. IF answer reveals new    │
│     insight → file it back   │
│     as a synthesis page      │
└──────────────────────────────┘
```

**Context injection change:**

```typescript
// BEFORE: Only memories + raw RAG chunks
const context = [
  formatMemoriesForPrompt(memories),
  formatRAGChunks(ragResults),
  formatUserProfile(profile),
];

// AFTER: Wiki pages as primary context, memories + RAG as supplementary
const context = [
  formatWikiPages(relevantPages),      // NEW: Pre-synthesized knowledge
  formatMemoriesForPrompt(memories),   // Existing: Atomic facts
  formatRAGChunks(ragResults),         // Existing: Raw data fallback
  formatUserProfile(profile),          // Existing: Core profile
];
```

### 5.3 Lint — Periodic health checks

**Scheduled job** (daily or weekly):

```
WIKI LINT PIPELINE
    │
    ├── Stale detection
    │   Find pages where updated_at + stale_after < NOW()
    │   → Mark status = 'stale'
    │   → Queue for refresh
    │
    ├── Orphan detection
    │   Find pages with zero inbound wiki_links
    │   → Flag in wiki_index.orphan_count
    │   → Suggest connections or archival
    │
    ├── Contradiction detection
    │   Compare claims across pages
    │   → Create 'contradicts' links
    │   → Mark older page as 'contradicted'
    │   → Log in wiki_log
    │
    ├── Gap detection
    │   Find concepts mentioned in [[links]] but without pages
    │   → Suggest page creation
    │
    ├── Confidence recalculation
    │   Re-score page confidence based on:
    │   - Source freshness
    │   - Evidence count changes
    │   - Related memory confidence changes
    │
    └── Index regeneration
        Rebuild wiki_index.content from current pages
```

## 6. API Design

### 6.1 New REST Endpoints

```
BASE: /v1/wiki

# Pages
GET    /v1/wiki/pages                    # List pages (filter by type, category, status)
GET    /v1/wiki/pages/:slug              # Get single page with links
POST   /v1/wiki/pages                    # Create page (admin/LLM only)
PATCH  /v1/wiki/pages/:slug              # Update page (LLM writes, user can flag)
DELETE /v1/wiki/pages/:slug              # Archive page (soft delete)

# Search
GET    /v1/wiki/search?q=...            # Semantic + keyword search across pages
GET    /v1/wiki/search/related/:slug    # Find related pages (by links + embeddings)

# Index & Navigation
GET    /v1/wiki/index                    # Get master index
GET    /v1/wiki/graph                    # Get page-link graph (for visualization)
GET    /v1/wiki/stats                    # Wiki health metrics

# Links
GET    /v1/wiki/pages/:slug/links       # Outbound + inbound links for a page
GET    /v1/wiki/orphans                  # Pages with no inbound links

# History
GET    /v1/wiki/pages/:slug/versions    # Version history
GET    /v1/wiki/pages/:slug/versions/:v # Specific version
GET    /v1/wiki/log                      # Operation log (chronological)

# Operations
POST   /v1/wiki/ingest                   # Trigger ingest pipeline for a source
POST   /v1/wiki/lint                     # Trigger lint/health check
POST   /v1/wiki/pages/:slug/flag        # User flags page for review

# User Feedback
POST   /v1/wiki/pages/:slug/feedback    # Verify, correct, or dispute a page
```

### 6.2 New LangGraph Tools (for AI Coach)

```typescript
// Wiki Read Tools
searchWikiPages(query: string, category?: string, limit?: number)
  → Search wiki for relevant pages

getWikiPage(slug: string)
  → Read a specific wiki page with its links

getWikiIndex()
  → Read the master index for navigation

getRelatedPages(slug: string, depth?: number)
  → Get connected pages (follow links N levels)

// Wiki Write Tools
createWikiPage(input: {
  pageType: WikiPageType,
  category: IntelligenceCategory,
  slug: string,
  title: string,
  summary: string,
  body: string,                           // Markdown with [[wiki-links]]
  confidence: number,
  sources: WikiSourceRef[]
})
  → Create a new wiki page

updateWikiPage(slug: string, input: {
  body?: string,
  summary?: string,
  confidence?: number,
  changeReason: string,
  newSources?: WikiSourceRef[]
})
  → Update an existing page (auto-versions)

createWikiLink(sourceSlug: string, targetSlug: string, linkType: string, context?: string)
  → Create a cross-reference between pages

flagContradiction(pageSlug: string, contradictingSlug: string, explanation: string)
  → Flag a contradiction between two pages

// Wiki Maintenance Tools
lintWiki(scope?: 'full' | 'stale' | 'orphans' | 'contradictions')
  → Run health check, return findings

fileQueryAsPage(query: string, answer: string, pageType: WikiPageType)
  → File a valuable Q&A exchange as a new wiki page
```

## 7. Integration with Existing Systems

### 7.1 Memory → Wiki Bridge

Intelligence memories are **atomic facts**. Wiki pages are **narrative documents**. They complement each other:

```
Memory: "User performs best with morning workouts" (confidence: 0.95)
   ↕ linked via wiki_page_sources
Wiki Page: "Morning Workout Pattern"
   - Detailed analysis of WHY mornings work
   - Evidence from 3 months of data
   - Links to [[sleep-quality]], [[cortisol-rhythm]], [[work-schedule]]
   - Recommendations for optimizing morning routine
```

**Sync rules:**
- When a memory is created/updated → check if related wiki page exists → update if so
- When a wiki page is updated → check if underlying memories need confidence adjustment
- Memory verification/rejection → trigger wiki page review

### 7.2 Knowledge Graph → Wiki Bridge

The knowledge graph provides the **visual topology**. The wiki provides the **written narrative**.

```
Knowledge Graph Node: workout_session (2026-05-01, HIIT, 45min)
   ↕ wiki_page_sources
Wiki Pattern Page: "HIIT Training Progression"
   - Tracks how HIIT performance has evolved
   - Links to relevant workout nodes
   - Contains coaching recommendations
```

### 7.3 Conversation → Wiki Bridge

Every conversation can contribute to the wiki:

```
Chat: "Why do I always feel tired on Mondays?"
   ↓ AI Coach answers using wiki context
   ↓ Answer reveals new insight
   ↓ Filed as synthesis page: "Monday Fatigue Pattern"
   ↓ Cross-referenced with [[sleep-quality]], [[weekend-nutrition-drift]]
```

### 7.4 System Prompt Addition

Add to the LangGraph system prompt:

```
## WIKI KNOWLEDGE BASE

You maintain a personal wiki for this user — a structured collection of interlinked 
pages that captures everything you've learned about them. The wiki is your long-term 
memory and analytical notebook combined.

### When to use the wiki:
- ALWAYS search the wiki first before answering complex questions
- When you discover a new pattern → create or update a wiki page
- When you notice a contradiction → flag it with flagContradiction
- When a user asks a great question → consider filing the answer as a synthesis page

### Wiki page conventions:
- Use [[slug]] syntax for cross-references (these become wiki_links)
- Every claim should cite its source: data table, memory ID, or conversation
- Mark confidence level honestly — don't inflate
- Note contradictions explicitly with ⚠️ prefix
- Keep pages focused — one topic per page, link to related pages

### Ingest protocol:
After every significant conversation:
1. Extract new insights
2. Search wiki for related pages
3. Update existing pages OR create new ones
4. Ensure cross-references are current
5. Log the operation

### Quality rules:
- Never delete a page — archive it (status: 'archived')
- Always version before updating (the system does this automatically)
- Flag stale pages rather than guessing — let the lint job verify
- Prefer updating an existing page over creating a near-duplicate
```

## 8. Frontend Integration

### 8.1 Wiki Browser Component (New)

A new panel/drawer in the AI Coach UI for browsing the wiki:

```
┌─────────────────────────────────────────────┐
│  📖 Your Health Wiki              [🔍] [⚙️] │
├─────────────────────────────────────────────┤
│  Stats: 47 pages · 3 stale · 1 contradiction│
├─────────────────────────────────────────────┤
│  📂 Patterns (12)                            │
│  📂 Concepts (8)                             │
│  📂 Entities (15)                            │
│  📂 Journals (7)                             │
│  📂 Syntheses (3)                            │
│  📂 Sources (2)                              │
├─────────────────────────────────────────────┤
│  🔗 Graph View  │  📋 Recent Changes         │
└─────────────────────────────────────────────┘
```

**Page Detail View:**
```
┌─────────────────────────────────────────────┐
│  ← Back    Weekend Nutrition Drift    v3    │
│  🟢 Active  🏋️ Fitness  📊 85% confidence   │
├─────────────────────────────────────────────┤
│                                             │
│  [Rendered markdown with clickable          │
│   [[wiki-links]] that navigate to           │
│   other pages]                              │
│                                             │
├─────────────────────────────────────────────┤
│  📎 Sources (3)  🔗 Links (5)  📜 History   │
│                                             │
│  [✓ Looks right]  [⚠️ Flag issue]           │
└─────────────────────────────────────────────┘
```

### 8.2 Chat Integration

- Wiki citations appear as clickable `[[page-slug]]` links in AI Coach messages
- Clicking opens the wiki page in a side panel
- AI Coach can reference "as noted in your wiki page on [[sleep-hygiene]]..."
- New "📖 Save to Wiki" action on valuable AI responses

### 8.3 Intelligence Drawer Enhancement

Add "Wiki" as a new folder in the existing Intelligence Files Drawer:

```typescript
const FOLDER_CONFIG = {
  memories: { icon: Brain, accent: "text-purple-400" },
  wiki:     { icon: BookOpen, accent: "text-indigo-400" },  // NEW
  artifacts: { icon: Sparkles, accent: "text-cyan-400" },
  plans:    { icon: ClipboardList, accent: "text-blue-400" },
  core:     { icon: Shield, accent: "text-emerald-400" },
  logs:     { icon: FileText, accent: "text-amber-400" },
  notes:    { icon: StickyNote, accent: "text-slate-400" },
};
```

## 9. Wiki Service Architecture (Server)

### 9.1 Service Structure

```
server/src/services/
├── wiki.service.ts              # Core CRUD + search + versioning
├── wiki-ingest.service.ts       # Ingest pipeline (classify → find → create/update)
├── wiki-lint.service.ts         # Health checks (stale, orphans, contradictions)
├── wiki-index.service.ts        # Index maintenance + stats
└── langgraph-tools/domains/
    └── wiki.ts                  # LangGraph tool definitions (8-10 tools)
```

### 9.2 WikiService (Core)

```typescript
class WikiService {
  // CRUD
  createPage(userId: string, input: CreateWikiPageInput): Promise<WikiPage>
  getPage(userId: string, slug: string): Promise<WikiPageWithLinks>
  updatePage(userId: string, slug: string, input: UpdateWikiPageInput): Promise<WikiPage>
  archivePage(userId: string, slug: string): Promise<void>
  
  // Search
  searchPages(userId: string, query: string, filters?: WikiSearchFilters): Promise<WikiSearchResult[]>
  getRelatedPages(userId: string, slug: string, depth?: number): Promise<WikiPage[]>
  
  // Links
  createLink(userId: string, input: CreateWikiLinkInput): Promise<WikiLink>
  getLinks(userId: string, slug: string): Promise<{ outbound: WikiLink[], inbound: WikiLink[] }>
  getOrphans(userId: string): Promise<WikiPage[]>
  
  // Versioning
  getVersions(userId: string, slug: string): Promise<WikiPageVersion[]>
  getVersion(userId: string, slug: string, version: number): Promise<WikiPageVersion>
  
  // User feedback
  flagPage(userId: string, slug: string, reason: string): Promise<void>
  submitFeedback(userId: string, slug: string, action: 'verify' | 'correct' | 'dispute', data?: unknown): Promise<void>
  
  // Internal
  parseWikiLinks(body: string): string[]   // Extract [[slug]] references
  resolveLinks(userId: string, slugs: string[]): Promise<Map<string, UUID>>
  regenerateEmbeddings(pageId: string): Promise<void>
}
```

### 9.3 WikiIngestService

```typescript
class WikiIngestService {
  // Main entry points
  ingestFromConversation(userId: string, conversationId: string): Promise<IngestResult>
  ingestFromDataEvent(userId: string, event: DataEvent): Promise<IngestResult>
  ingestFromUpload(userId: string, documentId: string): Promise<IngestResult>
  synthesizePeriod(userId: string, period: 'week' | 'month' | 'quarter'): Promise<WikiPage>
  
  // Internal pipeline
  private classifySource(source: unknown): SourceClassification
  private findRelatedPages(userId: string, content: string): Promise<WikiPage[]>
  private decideCreateOrUpdate(existing: WikiPage[], source: unknown): 'create' | 'update'
  private generatePageContent(source: unknown, existing?: WikiPage): Promise<PageContent>
  private extractAndResolveLinks(body: string, userId: string): Promise<WikiLink[]>
  private updateIndex(userId: string): Promise<void>
  private logOperation(userId: string, op: WikiLogEntry): Promise<void>
}
```

## 10. Data Flow Diagrams

### 10.1 Ingest Flow (Conversation End)

```
Conversation ends
    │
    ▼
WikiIngestService.ingestFromConversation(userId, conversationId)
    │
    ├── 1. Fetch conversation messages (last 20)
    ├── 2. LLM extracts key insights (structured JSON)
    │       {insights: [{topic, claim, evidence, confidence}]}
    │
    ├── 3. For each insight:
    │       ├── searchPages(query=topic) → existing pages
    │       ├── IF match found (similarity > 0.8):
    │       │     ├── Save version snapshot
    │       │     ├── LLM merges new info into existing page
    │       │     ├── Update wiki_page_sources
    │       │     └── Update wiki_links
    │       └── IF no match:
    │             ├── LLM generates new page
    │             ├── Insert wiki_page + sources + links
    │             └── Queue embedding generation
    │
    ├── 4. Rebuild wiki_index
    ├── 5. Append to wiki_log
    └── 6. Return IngestResult {pagesCreated, pagesUpdated, linksAdded}
```

### 10.2 Query Flow (Chat with Wiki)

```
User: "Why do I always crash after lunch?"
    │
    ▼
LangGraph Agent receives message
    │
    ├── 1. searchWikiPages("post-lunch energy crash", limit=5)
    │       Returns: [
    │         "afternoon-energy-pattern" (0.92 similarity),
    │         "nutrition-timing" (0.78),
    │         "blood-sugar-management" (0.71)
    │       ]
    │
    ├── 2. getWikiPage("afternoon-energy-pattern")
    │       → Full page with evidence, links, recommendations
    │
    ├── 3. getRelatedPages("afternoon-energy-pattern", depth=1)
    │       → [sleep-quality, lunch-composition, caffeine-timing]
    │
    ├── 4. Agent synthesizes answer from wiki context
    │       "Based on your wiki, this is a pattern we've tracked...
    │        Your [[afternoon-energy-pattern]] page shows correlation
    │        with high-carb lunches. See also [[nutrition-timing]]."
    │
    └── 5. IF answer contains new insight:
            fileQueryAsPage("post-lunch-crash-analysis", answer, "synthesis")
```

## 11. Performance Considerations

### 11.1 Scaling Strategy

| Wiki Size | Strategy | Search Method |
|-----------|----------|---------------|
| < 50 pages | Index file sufficient | Keyword + embedding on summaries |
| 50-200 pages | Embedding search primary | pgvector on summary_embedding |
| 200-1000 pages | Chunked body embeddings | pgvector + body_embedding with re-ranking |
| 1000+ pages | External search engine | Dedicated search service (BM25 + vector hybrid) |

### 11.2 LLM Token Budget

Wiki context injection must be token-aware:

```typescript
const WIKI_TOKEN_BUDGET = 4000; // Max tokens for wiki context in prompt

function selectWikiContext(pages: WikiPage[], budget: number): string {
  // 1. Always include summaries of top-5 relevant pages (~500 tokens)
  // 2. Include full body of top-1 most relevant page (~1500 tokens)
  // 3. Include link graph for navigation (~200 tokens)
  // 4. Remaining budget: additional page bodies or excerpts
  // 5. Never exceed budget — truncate gracefully
}
```

### 11.3 Ingest Throttling

Prevent wiki thrashing from rapid data events:

```typescript
const INGEST_DEBOUNCE = {
  micro: 300_000,    // 5 min debounce for single data points
  conversation: 0,   // Immediate on conversation end
  source: 0,         // Immediate on document upload
  periodic: null,    // Cron-scheduled (weekly/monthly)
};
```

## 12. Migration Strategy

### Phase 1: Schema + Core Service (Week 1-2)
- Create database migration
- Implement WikiService (CRUD, search, versioning)
- Implement WikiIngestService (basic ingest pipeline)
- Add LangGraph wiki tools (search, read, create, update)

### Phase 2: Integration (Week 3-4)
- Wire wiki search into RAG context pipeline
- Add conversation-end ingest trigger
- Add data-event micro-ingest for key tables (workouts, meals, mood)
- Update system prompt with wiki instructions
- Add periodic synthesis job (weekly journal pages)

### Phase 3: Frontend (Week 5-6)
- Wiki Browser component in Intelligence Drawer
- Wiki page detail view with markdown rendering
- Clickable [[wiki-link]] references in chat messages
- "Save to Wiki" action on AI responses
- Wiki stats in dashboard

### Phase 4: Polish (Week 7-8)
- Lint service (stale detection, orphan detection, contradiction flagging)
- Wiki graph visualization (D3 force graph)
- User feedback system (verify, correct, dispute)
- Performance optimization (token budgets, ingest throttling)
- Seed wiki from existing memories and conversation history

## 13. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Wiki page count per user (30 days) | > 20 pages | `COUNT(wiki_pages) WHERE created_at > 30d` |
| Response quality improvement | Measurable via feedback | Compare `was_helpful` rates before/after |
| Context retrieval accuracy | > 80% relevant | Sample wiki search results vs RAG baseline |
| Pages updated per conversation | 2-5 avg | `wiki_log` operation counts |
| Stale page ratio | < 15% | `wiki_index.stale_count / page_count` |
| User engagement with wiki | > 30% view rate | Track wiki page views per user |
| Contradiction detection rate | > 90% caught | Manual audit of contradicting claims |

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token cost explosion from wiki reads | High API costs | Token budget cap (4K), summary-first strategy |
| Wiki quality degradation | Bad advice compounds | Confidence scoring, lint jobs, user flagging |
| Ingest latency slows chat | Poor UX | Async ingest, micro-ingest debouncing |
| Duplicate/near-duplicate pages | Confused wiki | Semantic dedup on create, lint orphan detection |
| User never reads wiki | Wasted feature | Integrate citations into chat, make wiki visible |
| Circular contradictions | Trust erosion | Version history, contradiction links, human review |

---

## Appendix A: Comparison with Existing Systems

| Capability | RAG (Current) | Memories (Current) | Wiki (New) |
|-----------|---------------|-------------------|------------|
| Persistence | Conversation-scoped | Permanent (with decay) | Permanent (versioned) |
| Structure | Flat chunks | Flat entries | Interlinked pages |
| Cross-referencing | None | `related_memory_ids` | `[[wiki-links]]` |
| Synthesis | Re-derived each query | Single-sentence facts | Full narrative documents |
| Contradiction handling | None | Supersede mechanism | Explicit contradiction links |
| Time-based analysis | None | Decay rate | Journal pages (week/month/quarter) |
| User browsability | Chat history only | Memory cards in drawer | Full wiki browser |
| Provenance | Embedding similarity | Evidence array | Source references + version history |

## Appendix B: Example Wiki for a New User (After 30 Days)

```
index.md (auto-generated)
├── Patterns (6)
│   ├── morning-workout-preference — Best consistency before 8am
│   ├── weekend-nutrition-drift — +800 kcal weekends vs weekdays
│   ├── stress-sleep-cascade — Work stress → poor sleep → low recovery
│   ├── monday-motivation — Highest workout quality on Mondays
│   ├── hydration-focus-link — Low water intake correlates with afternoon fog
│   └── social-eating-trigger — Restaurant meals 2x over daily target
│
├── Concepts (4)
│   ├── progressive-overload — Systematic strength increase principle
│   ├── caloric-deficit — Energy balance for weight loss
│   ├── sleep-hygiene — Practices for better sleep quality
│   └── habit-stacking — Linking new habits to existing routines
│
├── Entities (5)
│   ├── creatine — Supplement taken daily, 5g monohydrate
│   ├── morning-hiit — Preferred workout type, 30-45 min
│   ├── meal-prep-sunday — Weekly prep routine (25% adherence)
│   ├── lower-back-pain — Recurring issue, affects deadlifts
│   └── whoop-band — Wearable, primary sleep/recovery data source
│
├── Journals (4)
│   ├── week-2026-18 — This week: 4/5 workouts, nutrition improved
│   ├── week-2026-17 — Last week: missed 2 sessions, high stress
│   ├── month-2026-04 — April review: consistency building, sleep improving
│   └── quarter-2026-q1 — Q1 review: established baseline, identified patterns
│
├── Syntheses (2)
│   ├── sleep-vs-performance — Sleep quality predicts next-day workout quality (r=0.72)
│   └── nutrition-adherence-analysis — Weekday discipline eroded by weekends
│
└── Sources (1)
    └── article-creatine-meta-analysis — 2023 meta-analysis, supports current dosing
```
