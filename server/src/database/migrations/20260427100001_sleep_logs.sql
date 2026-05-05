-- Manual sleep logs for users without wearable integrations
-- Supplements health_data_records (integration-sourced sleep data)

CREATE TABLE IF NOT EXISTS sleep_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sleep_date      DATE NOT NULL,
  bedtime         TIMESTAMPTZ,
  wake_time       TIMESTAMPTZ,
  duration_hours  NUMERIC(4,2),
  quality         INT CHECK (quality BETWEEN 1 AND 10),
  notes           TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date
  ON sleep_logs(user_id, sleep_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_logs_user_date_unique
  ON sleep_logs(user_id, sleep_date);
