-- Precomputed daily correlation snapshots for fast AI Coach & dashboard reads
CREATE TABLE IF NOT EXISTS user_daily_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correlation_date DATE NOT NULL,
  stress_score SMALLINT NOT NULL DEFAULT 50,
  energy_score SMALLINT NOT NULL DEFAULT 50,
  mood_score SMALLINT NOT NULL DEFAULT 50,
  availability_score SMALLINT NOT NULL DEFAULT 80,
  calendar_load SMALLINT DEFAULT 0,
  music_mood VARCHAR(24),
  prayer_adherence SMALLINT DEFAULT 0,
  spending_stress SMALLINT DEFAULT 0,
  correlations JSONB NOT NULL DEFAULT '[]',
  recommended_mode VARCHAR(16) DEFAULT 'normal',
  tone_adjustment VARCHAR(24) DEFAULT 'motivational',
  signals_summary JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, correlation_date)
);

CREATE INDEX IF NOT EXISTS idx_udc_user_date ON user_daily_correlations(user_id, correlation_date DESC);
