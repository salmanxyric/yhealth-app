-- AI Coach call log for scheduling, outcome tracking, and adaptive learning.
-- Safe additive migration: creates table and indexes only.

CREATE TABLE IF NOT EXISTS ai_coach_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_call_id UUID,
  bullmq_job_id VARCHAR(128),
  scheduled_time TIME NOT NULL,
  scheduled_date DATE NOT NULL,
  timezone VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'scheduled',
  skip_reason VARCHAR(128),
  session_type VARCHAR(48) DEFAULT 'quick_checkin',
  pre_call_context TEXT,
  followup_message_id UUID,
  call_duration_seconds INTEGER,
  initiated_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_call_log_user_date
  ON ai_coach_call_log (user_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_coach_call_log_status
  ON ai_coach_call_log (status)
  WHERE status IN ('scheduled', 'initiated');

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_coach_call_log_user_date_time
  ON ai_coach_call_log (user_id, scheduled_date, scheduled_time, session_type)
  WHERE status NOT IN ('cancelled');
