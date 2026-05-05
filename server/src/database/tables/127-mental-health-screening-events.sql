-- Mental health screening audit (hashed user text only; no raw PHI)
CREATE TABLE IF NOT EXISTS mental_health_screening_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lane VARCHAR(40) NOT NULL,
  source VARCHAR(32) NOT NULL,
  content_sha256 CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mh_screening_user_created
  ON mental_health_screening_events (user_id, created_at DESC);
