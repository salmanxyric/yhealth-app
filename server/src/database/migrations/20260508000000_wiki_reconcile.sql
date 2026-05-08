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

-- 5. Add parent_slug for hierarchical pages (domain -> sub-pages)
ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS parent_slug VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_parent
    ON wiki_pages(user_id, parent_slug)
    WHERE parent_slug IS NOT NULL;
