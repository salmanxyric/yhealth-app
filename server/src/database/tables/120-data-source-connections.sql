-- Unified data source connections (Google Calendar, Spotify, Prayer Times, Finance, etc.)
CREATE TABLE IF NOT EXISTS data_source_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  credentials JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_type)
);

CREATE INDEX IF NOT EXISTS idx_dsc_user_status ON data_source_connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dsc_next_sync ON data_source_connections(next_sync_at) WHERE status = 'active';
