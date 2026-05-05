-- Goal daily tracking — lightweight daily check-ins against active goals

CREATE TABLE IF NOT EXISTS goal_daily_tracking (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id         UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  tracking_date   DATE NOT NULL,
  completed       BOOLEAN NOT NULL DEFAULT false,
  value           NUMERIC(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_daily_tracking_unique
  ON goal_daily_tracking(user_id, goal_id, tracking_date);

CREATE INDEX IF NOT EXISTS idx_goal_daily_tracking_user_date
  ON goal_daily_tracking(user_id, tracking_date DESC);
