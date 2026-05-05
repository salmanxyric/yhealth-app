-- Spending tracking for financial stress correlation
-- Uses a separate table from the existing finance module (107-finance.sql)
-- to keep correlation-specific spending signals decoupled
CREATE TABLE IF NOT EXISTS spending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  category VARCHAR(48),
  description VARCHAR(256),
  source VARCHAR(16) DEFAULT 'manual',
  stress_indicator BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_st_user_date ON spending_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_st_user_cat ON spending_transactions(user_id, category);
