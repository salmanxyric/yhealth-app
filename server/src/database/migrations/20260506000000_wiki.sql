-- ============================================
-- WIKI SYSTEM
-- LLM-driven per-user knowledge wiki layer
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN CREATE TYPE wiki_page_type AS ENUM ('entity', 'concept', 'pattern', 'journal', 'synthesis', 'source'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wiki_page_status AS ENUM ('active', 'stale', 'contradicted', 'archived', 'draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wiki_link_type AS ENUM ('reference', 'contradicts', 'supports', 'supersedes', 'derived_from', 'see_also'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wiki_log_operation AS ENUM ('ingest', 'update', 'create', 'lint', 'query_filed', 'contradiction_detected', 'stale_marked', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 1. WIKI PAGES
-- Core content table — one page per topic per user
-- ============================================

CREATE TABLE IF NOT EXISTS wiki_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Identity
    slug VARCHAR(255) NOT NULL,
    page_type wiki_page_type NOT NULL,
    category VARCHAR(64),
    title VARCHAR(255) NOT NULL,

    -- Content
    summary TEXT,
    body TEXT,
    frontmatter JSONB NOT NULL DEFAULT '{}',

    -- Confidence & Evidence
    confidence REAL NOT NULL DEFAULT 0.5,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,

    -- Lifecycle
    status wiki_page_status NOT NULL DEFAULT 'active',
    version INTEGER NOT NULL DEFAULT 1,

    -- Embeddings (TEXT fallback — pgvector optional)
    summary_embedding TEXT,
    body_embedding TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_lint_at TIMESTAMPTZ,
    stale_after_days INTEGER NOT NULL DEFAULT 30,

    UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_type
    ON wiki_pages(user_id, page_type);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_category
    ON wiki_pages(user_id, category);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_updated
    ON wiki_pages(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_stale
    ON wiki_pages(user_id, updated_at, stale_after_days)
    WHERE status = 'active';

CREATE TRIGGER update_wiki_pages_updated_at
    BEFORE UPDATE ON wiki_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. WIKI LINKS
-- Cross-references between pages
-- ============================================

CREATE TABLE IF NOT EXISTS wiki_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    target_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,

    link_type wiki_link_type NOT NULL DEFAULT 'reference',
    context TEXT,
    anchor_text VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (source_page_id, target_page_id, link_type),
    CHECK (source_page_id != target_page_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_links_source
    ON wiki_links(source_page_id);

CREATE INDEX IF NOT EXISTS idx_wiki_links_target
    ON wiki_links(target_page_id);

CREATE INDEX IF NOT EXISTS idx_wiki_links_user_type
    ON wiki_links(user_id, link_type);

-- ============================================
-- 3. WIKI PAGE SOURCES
-- Provenance tracking — what data produced each page
-- ============================================

CREATE TABLE IF NOT EXISTS wiki_page_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,

    source_type VARCHAR(64) NOT NULL,
    source_id UUID,
    source_table VARCHAR(128),

    -- Date range covered by this source
    date_range_start DATE,
    date_range_end DATE,

    row_count INTEGER,
    extract_summary TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (page_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_page_sources_page
    ON wiki_page_sources(page_id);

CREATE INDEX IF NOT EXISTS idx_wiki_page_sources_source
    ON wiki_page_sources(source_type, source_id);

-- ============================================
-- 4. WIKI LOG
-- Operation history for the wiki system
-- ============================================

CREATE TABLE IF NOT EXISTS wiki_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    operation wiki_log_operation NOT NULL,

    -- Affected pages
    page_ids UUID[] NOT NULL DEFAULT '{}',

    -- Source context
    source_type VARCHAR(64),
    source_id UUID,
    conversation_id UUID,

    -- Result summary
    summary TEXT,
    details JSONB NOT NULL DEFAULT '{}',
    pages_touched INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wiki_log_user_time
    ON wiki_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wiki_log_operation
    ON wiki_log(user_id, operation);

-- ============================================
-- 5. WIKI INDEX
-- Master index per user — precomputed summary
-- ============================================

CREATE TABLE IF NOT EXISTS wiki_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Full-text index content (for LLM retrieval)
    content TEXT NOT NULL DEFAULT '',

    -- Aggregate counts
    page_count INTEGER NOT NULL DEFAULT 0,
    counts_by_type JSONB NOT NULL DEFAULT '{}',
    counts_by_category JSONB NOT NULL DEFAULT '{}',

    -- Health indicators
    orphan_count INTEGER NOT NULL DEFAULT 0,
    stale_count INTEGER NOT NULL DEFAULT 0,
    contradicted_count INTEGER NOT NULL DEFAULT 0,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id)
);

-- ============================================
-- 6. WIKI PAGE VERSIONS
-- Version history — snapshot on every update
-- ============================================

CREATE TABLE IF NOT EXISTS wiki_page_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,

    version INTEGER NOT NULL,

    -- Snapshot of content at this version
    title VARCHAR(255),
    summary TEXT,
    body TEXT,
    frontmatter JSONB NOT NULL DEFAULT '{}',
    confidence REAL,
    evidence_count INTEGER,

    -- Why this version was created
    change_reason TEXT,
    trigger_type VARCHAR(32),
    trigger_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (page_id, version)
);

CREATE INDEX IF NOT EXISTS idx_wiki_page_versions_page
    ON wiki_page_versions(page_id, version DESC);
