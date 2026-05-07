-- AI Coach no-pgvector fallbacks.
-- Local/dev PostgreSQL instances may not have the pgvector extension installed.
-- The chat and memory services can still operate with text-ranked memories.
-- Keep the same table contracts and store embeddings as TEXT until pgvector is added.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN CREATE TYPE intelligence_memory_type AS ENUM ('pattern', 'preference', 'context', 'feedback', 'relationship', 'learned_rule'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_category AS ENUM ('fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_memory_status AS ENUM ('active', 'verified', 'rejected', 'expired', 'superseded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_source AS ENUM ('ai', 'user', 'system', 'wearable'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS intelligence_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memory_type intelligence_memory_type NOT NULL,
    category intelligence_category NOT NULL,
    subcategory VARCHAR(128),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    structured_data JSONB NOT NULL DEFAULT '{}',
    confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    evidence_count INTEGER NOT NULL DEFAULT 0,
    evidence JSONB NOT NULL DEFAULT '[]',
    min_evidence INTEGER NOT NULL DEFAULT 3,
    source intelligence_source NOT NULL DEFAULT 'ai',
    kg_node_ids UUID[] DEFAULT '{}',
    related_memory_ids UUID[] DEFAULT '{}',
    status intelligence_memory_status NOT NULL DEFAULT 'active',
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    superseded_by UUID REFERENCES intelligence_memories(id),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_count INTEGER NOT NULL DEFAULT 0,
    decay_rate REAL NOT NULL DEFAULT 0.01,
    expires_at TIMESTAMPTZ,
    embedding TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_mem_user_active ON intelligence_memories(user_id, status, updated_at DESC) WHERE status IN ('active', 'verified');
CREATE INDEX IF NOT EXISTS idx_intel_mem_user_category ON intelligence_memories(user_id, category, memory_type) WHERE status IN ('active', 'verified');
CREATE INDEX IF NOT EXISTS idx_intel_mem_confidence ON intelligence_memories(user_id, confidence DESC) WHERE status IN ('active', 'verified');
CREATE INDEX IF NOT EXISTS idx_intel_mem_expires ON intelligence_memories(expires_at) WHERE expires_at IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_intel_mem_last_access ON intelligence_memories(user_id, last_accessed_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS user_life_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIMESTAMPTZ DEFAULT NOW(),
  entry_type VARCHAR(30) NOT NULL,
  category VARCHAR(30) NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT,
  metadata JSONB DEFAULT '{}',
  source_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_life_history_daily_digest_unique
  ON user_life_history (user_id, event_date)
  WHERE entry_type = 'daily_digest';
CREATE INDEX IF NOT EXISTS idx_user_life_history_user_date
  ON user_life_history (user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_life_history_user_category_date
  ON user_life_history (user_id, category, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_life_history_user_type_date
  ON user_life_history (user_id, entry_type, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_life_history_metadata
  ON user_life_history USING GIN (metadata);
