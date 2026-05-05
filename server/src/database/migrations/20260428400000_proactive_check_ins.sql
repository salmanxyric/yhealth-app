-- Proactive check-in state tracking
-- Tracks user responses to event-driven proactive messages (snooze, respond, dismiss)

CREATE TABLE IF NOT EXISTS proactive_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_type VARCHAR(64) NOT NULL,
  trigger_data JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  snooze_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_checkin_status CHECK (status IN ('pending', 'responded', 'snoozed', 'dismissed', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_proactive_check_ins_user_type
  ON proactive_check_ins(user_id, check_in_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proactive_check_ins_pending
  ON proactive_check_ins(user_id, status)
  WHERE status = 'pending';
