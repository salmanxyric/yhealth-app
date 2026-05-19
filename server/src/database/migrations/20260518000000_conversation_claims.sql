-- Separate table for conversation-derived LLM claims.
-- Previously these were written directly into daily_analysis_reports.insights,
-- polluting the deterministic analytics source of truth.
CREATE TABLE IF NOT EXISTS conversation_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  claim TEXT NOT NULL,
  category TEXT,
  evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_claims_user_date
  ON conversation_claims (user_id, claim_date);
