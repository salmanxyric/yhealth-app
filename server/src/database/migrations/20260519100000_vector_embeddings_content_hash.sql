-- ============================================
-- ADD CONTENT HASH TO VECTOR_EMBEDDINGS
-- ============================================
-- SHA-256 hash of normalized content, used to skip re-embedding unchanged records.

ALTER TABLE vector_embeddings
  ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);
