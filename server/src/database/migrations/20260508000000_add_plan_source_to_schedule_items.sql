-- ============================================
-- Add 'plan' to schedule_items source CHECK constraint
-- ============================================
-- Context: the plan-schedule-sync service upserts workout and diet plan
-- entries into schedule_items with source='plan'. The existing CHECK
-- constraint only allows ('manual', 'google', 'prayer').

-- Drop the old constraint and recreate with the expanded set.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_items_source_check'
  ) THEN
    ALTER TABLE schedule_items
      DROP CONSTRAINT schedule_items_source_check;
  END IF;

  ALTER TABLE schedule_items
    ADD CONSTRAINT schedule_items_source_check
    CHECK (source IN ('manual', 'google', 'prayer', 'plan'));
END $$;
