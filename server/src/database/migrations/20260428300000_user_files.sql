-- User-visible files: goals, training plans, nutrition targets, constraints, patterns, artifacts
-- These are AI-generated or user-created documents that persist across conversations.

CREATE TABLE IF NOT EXISTS user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  source VARCHAR(16) NOT NULL DEFAULT 'ai',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_files_file_type_check
    CHECK (file_type IN ('goal', 'training_plan', 'nutrition_targets', 'constraint', 'artifact', 'pattern', 'note')),
  CONSTRAINT user_files_source_check
    CHECK (source IN ('ai', 'user'))
);

CREATE INDEX IF NOT EXISTS idx_user_files_user_active
  ON user_files (user_id, is_archived, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_files_user_type
  ON user_files (user_id, file_type) WHERE NOT is_archived;
