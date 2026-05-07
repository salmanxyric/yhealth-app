-- Add rich content columns to journal_entries for TipTap editor
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS content_html TEXT,
  ADD COLUMN IF NOT EXISTS content_json JSONB;
