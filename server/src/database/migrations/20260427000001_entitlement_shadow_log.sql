-- Shadow audit log for entitlement denials (Phase 5B)
-- Tracks would-be-denials in shadow mode for monitoring before enforcement rollout

CREATE TABLE IF NOT EXISTS entitlement_shadow_log (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL,
  feature_key   TEXT NOT NULL,
  reason        TEXT NOT NULL,
  path          TEXT,
  method        TEXT,
  extra         JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shadow_log_user_created
  ON entitlement_shadow_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shadow_log_reason_created
  ON entitlement_shadow_log(reason, created_at DESC);
