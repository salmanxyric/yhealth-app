-- Ensure AI Coach per-message transparency records can be updated idempotently.

ALTER TABLE intelligence_session_context
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_intel_session_conv_msg_unique
  ON intelligence_session_context(conversation_id, message_id)
  WHERE message_id IS NOT NULL;
