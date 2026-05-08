-- ============================================
-- WIKI SYSTEM
-- LLM-driven per-user knowledge wiki layer
-- ============================================

-- Enums
DO $$ BEGIN CREATE TYPE wiki_page_type AS ENUM ('entity', 'concept', 'pattern', 'journal', 'synthesis', 'source'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wiki_page_status AS ENUM ('active', 'stale', 'contradicted', 'archived', 'draft'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wiki_link_type AS ENUM ('reference', 'contradicts', 'supports', 'supersedes', 'derived_from', 'see_also'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wiki_log_operation AS ENUM ('ingest', 'update', 'create', 'lint', 'query_filed', 'contradiction_detected', 'stale_marked', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Wiki Pages
CREATE TABLE IF NOT EXISTS wiki_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL,
    page_type wiki_page_type NOT NULL,
    category VARCHAR(64),
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    frontmatter JSONB NOT NULL DEFAULT '{}',
    confidence REAL NOT NULL DEFAULT 0.5,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    word_count INTEGER NOT NULL DEFAULT 0,
    status wiki_page_status NOT NULL DEFAULT 'active',
    version INTEGER NOT NULL DEFAULT 1,
    summary_embedding TEXT,
    body_embedding TEXT,
    parent_slug VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_lint_at TIMESTAMPTZ,
    stale_after_days INTEGER NOT NULL DEFAULT 30,
    UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_type ON wiki_pages(user_id, page_type);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_category ON wiki_pages(user_id, category);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_updated ON wiki_pages(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_stale ON wiki_pages(user_id, updated_at, stale_after_days) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_type_status ON wiki_pages(user_id, page_type, status);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_category_status ON wiki_pages(user_id, category, status);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_user_status_updated ON wiki_pages(user_id, status, updated_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_wiki_pages_parent ON wiki_pages(user_id, parent_slug) WHERE parent_slug IS NOT NULL;

-- pgvector embedding columns (optional — only if pgvector extension is available)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS summary_embedding_vec vector(1536);
        ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS body_embedding_vec vector(1536);
        CREATE INDEX IF NOT EXISTS idx_wiki_pages_summary_emb
            ON wiki_pages USING ivfflat (summary_embedding_vec vector_cosine_ops) WITH (lists = 100);
    END IF;
END $$;

-- 2. Wiki Links
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

CREATE INDEX IF NOT EXISTS idx_wiki_links_source ON wiki_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_target ON wiki_links(target_page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_links_user_type ON wiki_links(user_id, link_type);

-- 3. Wiki Page Sources
CREATE TABLE IF NOT EXISTS wiki_page_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    source_type VARCHAR(64) NOT NULL,
    source_id UUID,
    source_table VARCHAR(128),
    date_range_start DATE,
    date_range_end DATE,
    row_count INTEGER,
    extract_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (page_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_page_sources_page ON wiki_page_sources(page_id);
CREATE INDEX IF NOT EXISTS idx_wiki_page_sources_source ON wiki_page_sources(source_type, source_id);

-- 4. Wiki Log
CREATE TABLE IF NOT EXISTS wiki_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation wiki_log_operation NOT NULL,
    page_ids UUID[] NOT NULL DEFAULT '{}',
    source_type VARCHAR(64),
    source_id UUID,
    conversation_id UUID,
    summary TEXT NOT NULL DEFAULT '',
    details JSONB NOT NULL DEFAULT '{}',
    pages_touched INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wiki_log_user_time ON wiki_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiki_log_operation ON wiki_log(user_id, operation);

-- 5. Wiki Index
CREATE TABLE IF NOT EXISTS wiki_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    page_count INTEGER NOT NULL DEFAULT 0,
    counts_by_type JSONB NOT NULL DEFAULT '{}',
    counts_by_category JSONB NOT NULL DEFAULT '{}',
    orphan_count INTEGER NOT NULL DEFAULT 0,
    stale_count INTEGER NOT NULL DEFAULT 0,
    contradicted_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- 6. Wiki Page Versions
CREATE TABLE IF NOT EXISTS wiki_page_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    frontmatter JSONB NOT NULL DEFAULT '{}',
    confidence REAL NOT NULL DEFAULT 0.5,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    change_reason TEXT,
    trigger_type VARCHAR(32),
    trigger_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (page_id, version)
);

CREATE INDEX IF NOT EXISTS idx_wiki_page_versions_page ON wiki_page_versions(page_id, version DESC);
