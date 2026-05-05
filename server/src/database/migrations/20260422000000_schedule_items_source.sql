-- ============================================
-- Add source tracking to schedule_items
-- ============================================
-- Context: the Wellbeing canvas used to overlay Google Calendar events and
-- prayer times as synthetic React Flow nodes (ids like "google:…"). That
-- broke link creation (UUID parse error on `schedule_links.source_item_id`)
-- and meant those items never had a persistent history.
--
-- This migration upgrades schedule_items to first-class polymorphic rows:
-- every item now has a `source` ('manual' | 'google' | 'prayer') and
-- optional external-identity fields so we can upsert/mark-stale without
-- duplicating. Manual items keep source='manual' (default) — no data change.

-- 1. source discriminator (defaults to 'manual' so existing rows are correct)
ALTER TABLE schedule_items
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual';

-- 2. external identity — nullable for manual items, populated for synced items
ALTER TABLE schedule_items
  ADD COLUMN IF NOT EXISTS external_source VARCHAR(50);

ALTER TABLE schedule_items
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(500);

-- 3. audit: when the external provider last pushed an update for this row
ALTER TABLE schedule_items
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;

-- 4. completion bookkeeping (only meaningful for prayers today, useful for
-- any synced item going forward — avoids a separate table)
ALTER TABLE schedule_items
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE schedule_items
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 5. Enforce source ∈ {manual, google, prayer} (named constraint so we can
--    ALTER it later to add more sources without losing the check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_items_source_check'
  ) THEN
    ALTER TABLE schedule_items
      ADD CONSTRAINT schedule_items_source_check
      CHECK (source IN ('manual', 'google', 'prayer'));
  END IF;
END $$;

-- 6. Prevent duplicates of a given external item inside the same schedule.
--    Partial unique index so manual items (external_id IS NULL) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_items_external_identity
  ON schedule_items (schedule_id, external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

-- 7. Help the sync job find synced rows quickly
CREATE INDEX IF NOT EXISTS idx_schedule_items_source
  ON schedule_items (schedule_id, source)
  WHERE source <> 'manual';
