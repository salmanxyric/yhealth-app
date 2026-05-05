-- Reasoning Graph: Per-user feature state and edges for the
-- Knowledge Graph–driven AI Coaching Architecture.
-- AI Coach is the root node; every feature is a connected node.

-- Per-user feature state (hydrated from data sources, cached)
CREATE TABLE IF NOT EXISTS user_feature_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_node_id VARCHAR(30) NOT NULL,
  health_score SMALLINT NOT NULL DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  last_activity_at TIMESTAMPTZ,
  activity_count_7d INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(15) NOT NULL DEFAULT 'never_used'
    CHECK (status IN ('active', 'dormant', 'never_used')),
  alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, feature_node_id)
);

CREATE INDEX IF NOT EXISTS idx_user_feature_state_user
  ON user_feature_state(user_id);

CREATE INDEX IF NOT EXISTS idx_user_feature_state_status
  ON user_feature_state(user_id, status);

-- Per-user reasoning edges (seeded from correlations, evolved over time)
CREATE TABLE IF NOT EXISTS reasoning_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_node_id VARCHAR(30) NOT NULL,
  target_node_id VARCHAR(30) NOT NULL,
  edge_type VARCHAR(20) NOT NULL
    CHECK (edge_type IN (
      'coach_manages', 'feeds_data', 'user_correlates',
      'conflicts_with', 'supports', 'requires'
    )),
  weight REAL NOT NULL DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),
  direction VARCHAR(15) NOT NULL DEFAULT 'bidirectional'
    CHECK (direction IN ('unidirectional', 'bidirectional')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_node_id, target_node_id, edge_type)
);

CREATE INDEX IF NOT EXISTS idx_reasoning_edges_user
  ON reasoning_edges(user_id);

CREATE INDEX IF NOT EXISTS idx_reasoning_edges_source
  ON reasoning_edges(user_id, source_node_id);

CREATE INDEX IF NOT EXISTS idx_reasoning_edges_target
  ON reasoning_edges(user_id, target_node_id);
