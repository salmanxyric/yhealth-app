-- Tool operations table for agentic execution timeline
-- Tracks every tool invocation within an agent turn with undo support

CREATE TABLE IF NOT EXISTS tool_operations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID,
  agent_turn_id   UUID NOT NULL,
  tool_name       VARCHAR(128) NOT NULL,
  mutation_type   VARCHAR(16) NOT NULL,
  args            JSONB NOT NULL DEFAULT '{}',
  result          JSONB,
  semantic_delta  TEXT,
  label           TEXT,
  icon            VARCHAR(64),
  undoable        BOOLEAN NOT NULL DEFAULT false,
  status          VARCHAR(16) NOT NULL DEFAULT 'pending',
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  undone_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tool_ops_user
  ON tool_operations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_ops_turn
  ON tool_operations(agent_turn_id);

CREATE INDEX IF NOT EXISTS idx_tool_ops_conversation
  ON tool_operations(conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tool_ops_undoable
  ON tool_operations(user_id, status)
  WHERE undoable = true AND status = 'completed';
