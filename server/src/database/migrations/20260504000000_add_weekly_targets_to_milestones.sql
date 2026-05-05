-- Add weekly target and daily breakdown columns to life_goal_milestones
-- Supports the SMART goal refinement pipeline (Phase 3 of AI Coaching Intelligence Engine)

ALTER TABLE life_goal_milestones
  ADD COLUMN IF NOT EXISTS week_number integer,
  ADD COLUMN IF NOT EXISTS daily_breakdown jsonb;

-- Index for efficient weekly target lookups per goal
CREATE INDEX IF NOT EXISTS idx_life_goal_milestones_week
  ON life_goal_milestones (life_goal_id, week_number)
  WHERE week_number IS NOT NULL;
