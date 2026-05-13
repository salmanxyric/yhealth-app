-- Communication delivery tables used by push registration and check-in preferences.
-- Safe additive migration: creates missing tables/indexes only.

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(24) NOT NULL,
  active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active
  ON push_tokens (user_id)
  WHERE active = true;

CREATE TABLE IF NOT EXISTS user_communication_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  checkin_push_enabled BOOLEAN DEFAULT true,
  quiet_hours_start SMALLINT,
  quiet_hours_end SMALLINT,
  workdays_only BOOLEAN DEFAULT false,
  max_checkins_per_day SMALLINT DEFAULT 1,
  missed_followup_hours SMALLINT DEFAULT 24,
  push_achievements BOOLEAN DEFAULT true,
  push_streaks BOOLEAN DEFAULT true,
  push_nudges BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT true,
  email_urgent_only BOOLEAN DEFAULT false,
  checkin_miss_count_by_hour JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
