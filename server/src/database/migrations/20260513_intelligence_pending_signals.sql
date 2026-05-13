-- server/src/database/migrations/20260513_intelligence_pending_signals.sql
-- Stores sub-threshold memory candidates until they accumulate enough evidence (3+ occurrences)

CREATE TABLE IF NOT EXISTS intelligence_pending_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  promoted_memory_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_signals_user_category
  ON intelligence_pending_signals(user_id, category);

CREATE INDEX IF NOT EXISTS idx_pending_signals_user_title
  ON intelligence_pending_signals(user_id, title);

CREATE INDEX IF NOT EXISTS idx_pending_signals_promotable
  ON intelligence_pending_signals(user_id, occurrence_count)
  WHERE promoted_memory_id IS NULL AND occurrence_count >= 3;
