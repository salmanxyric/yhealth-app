-- Durable chat call records.
-- Additive only: creates a new table and indexes, does not rewrite existing data.

CREATE TABLE IF NOT EXISTS chat_calls (
  id UUID PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_type VARCHAR(16) NOT NULL CHECK (call_type IN ('voice', 'video')),
  status VARCHAR(24) NOT NULL CHECK (status IN ('ringing', 'active', 'ended', 'declined', 'missed', 'cancelled')),
  is_group_call BOOLEAN NOT NULL DEFAULT false,
  invited_user_ids UUID[] NOT NULL DEFAULT '{}',
  accepted_user_ids UUID[] NOT NULL DEFAULT '{}',
  declined_user_ids UUID[] NOT NULL DEFAULT '{}',
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_calls_chat_created
  ON chat_calls(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_calls_initiator_created
  ON chat_calls(initiator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_calls_status_active
  ON chat_calls(status, created_at DESC)
  WHERE status IN ('ringing', 'active');

CREATE INDEX IF NOT EXISTS idx_chat_calls_message
  ON chat_calls(message_id)
  WHERE message_id IS NOT NULL;
