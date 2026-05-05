-- Daily prayer times and completion tracking
CREATE TABLE IF NOT EXISTS prayer_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prayer_date DATE NOT NULL,
  prayer_name VARCHAR(32) NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  source VARCHAR(16) DEFAULT 'api',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prayer_date, prayer_name)
);

CREATE INDEX IF NOT EXISTS idx_ps_user_date ON prayer_schedules(user_id, prayer_date DESC);
