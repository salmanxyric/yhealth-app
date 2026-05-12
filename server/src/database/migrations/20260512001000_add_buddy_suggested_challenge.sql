-- Add cached AI challenge metadata for buddy suggestions.
-- Safe additive migration: no existing rows are modified or deleted.

ALTER TABLE buddy_suggestions_cache
  ADD COLUMN IF NOT EXISTS suggested_challenge JSONB;
