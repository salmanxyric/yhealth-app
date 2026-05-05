-- Normalized cross-source signals for the correlation engine
CREATE TABLE IF NOT EXISTS data_source_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(32) NOT NULL,
  signal_type VARCHAR(48) NOT NULL,
  signal_date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  value JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dss_user_date ON data_source_signals(user_id, signal_date DESC);
CREATE INDEX IF NOT EXISTS idx_dss_user_type_date ON data_source_signals(user_id, source_type, signal_date DESC);
CREATE INDEX IF NOT EXISTS idx_dss_signal_type ON data_source_signals(signal_type, signal_date DESC);
