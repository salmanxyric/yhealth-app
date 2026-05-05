-- Tool audit log for AI assistant mutations
-- Tracks every create/update/delete action taken by the AI tool system

CREATE TABLE IF NOT EXISTS tool_audit_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL,
  conversation_id UUID,
  tool_name       TEXT NOT NULL,
  mutation_type   TEXT NOT NULL,
  tool_args       JSONB NOT NULL DEFAULT '{}',
  tool_result     TEXT,
  entity_type     TEXT,
  entity_id       TEXT,
  duration_ms     INT,
  success         BOOLEAN NOT NULL DEFAULT true,
  error_message   TEXT,
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_audit_user
  ON tool_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_audit_entity
  ON tool_audit_log(entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tool_audit_idem
  ON tool_audit_log(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
