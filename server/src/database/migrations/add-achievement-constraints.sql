-- Unique constraint to prevent duplicate dynamic achievements per user+goal+title
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_dynamic_ach_user_goal_title'
  ) THEN
    ALTER TABLE dynamic_achievements
      ADD CONSTRAINT uq_dynamic_ach_user_goal_title
      UNIQUE (user_id, source_goal_id, title);
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Composite index for filtered queries (user + unlocked + ordering)
CREATE INDEX IF NOT EXISTS idx_dynamic_ach_user_unlocked
  ON dynamic_achievements(user_id, unlocked, created_at DESC);

-- Index for goal progress checks (pending achievements lookup)
CREATE INDEX IF NOT EXISTS idx_dynamic_ach_pending
  ON dynamic_achievements(user_id, type, unlocked)
  WHERE unlocked = FALSE AND source_goal_id IS NOT NULL;
