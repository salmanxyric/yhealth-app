-- User medications for health coaching context
-- Enables AI to avoid contraindicated recommendations

CREATE TABLE IF NOT EXISTS user_medications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  start_date      DATE,
  end_date        DATE,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_medications_user
  ON user_medications(user_id, is_active);
