-- ============================================
-- ADD UNIQUE CONSTRAINT TO VECTOR_EMBEDDINGS
-- ============================================
-- Enables proper UPSERT (ON CONFLICT DO UPDATE) for embedding storage.
-- Keeps the most recently updated row per (source_type, source_id) pair.

-- Step 1: Remove duplicate rows (keep the most recently updated per natural key)
DELETE FROM vector_embeddings a
USING vector_embeddings b
WHERE a.id < b.id
  AND a.source_type = b.source_type
  AND a.source_id = b.source_id;

-- Step 2: Drop the old non-unique index (replaced by the unique one below)
DROP INDEX IF EXISTS idx_vector_embeddings_source;

-- Step 3: Create unique index for deduplication and UPSERT support
CREATE UNIQUE INDEX IF NOT EXISTS idx_vector_embeddings_source_unique
  ON vector_embeddings(source_type, source_id);
