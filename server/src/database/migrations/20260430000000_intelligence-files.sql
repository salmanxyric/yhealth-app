-- ============================================
-- INTELLIGENCE FILES SYSTEM
-- File-based AI memory & intelligence layer
-- ============================================

-- Enums
DO $$ BEGIN CREATE TYPE intelligence_memory_type AS ENUM ('pattern', 'preference', 'context', 'feedback', 'relationship', 'learned_rule'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_category AS ENUM ('fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_memory_status AS ENUM ('active', 'verified', 'rejected', 'expired', 'superseded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_source AS ENUM ('ai', 'user', 'system', 'wearable'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_artifact_type AS ENUM ('chart', 'comparison', 'report', 'heatmap', 'scatter', 'gauge', 'timeline', 'table'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_plan_type AS ENUM ('weekly_training', 'nutrition_cycle', 'habit_formation', 'recovery', 'goal_sprint', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_plan_status AS ENUM ('draft', 'active', 'paused', 'completed', 'abandoned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_analysis_type AS ENUM ('correlation', 'regression', 'anomaly', 'trend', 'comparison', 'multi_factor', 'comprehensive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_analysis_status AS ENUM ('pending', 'running', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_feedback_action AS ENUM ('verify', 'reject', 'correct', 'dismiss', 'expand', 'pin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE intelligence_core_section AS ENUM ('biometrics', 'targets', 'constraints', 'preferences', 'medical', 'lifestyle'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 1. INTELLIGENCE MEMORIES
-- Long-term learned intelligence with evidence
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Classification
    memory_type intelligence_memory_type NOT NULL,
    category intelligence_category NOT NULL,
    subcategory VARCHAR(128),

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    structured_data JSONB NOT NULL DEFAULT '{}',

    -- Evidence & Confidence
    confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    evidence_count INTEGER NOT NULL DEFAULT 0,
    evidence JSONB NOT NULL DEFAULT '[]',
    min_evidence INTEGER NOT NULL DEFAULT 3,
    source intelligence_source NOT NULL DEFAULT 'ai',

    -- Knowledge Graph Links
    kg_node_ids UUID[] DEFAULT '{}',
    related_memory_ids UUID[] DEFAULT '{}',

    -- Lifecycle
    status intelligence_memory_status NOT NULL DEFAULT 'active',
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    superseded_by UUID REFERENCES intelligence_memories(id),

    -- Decay
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_count INTEGER NOT NULL DEFAULT 0,
    decay_rate REAL NOT NULL DEFAULT 0.01,
    expires_at TIMESTAMPTZ,

    -- Embedding for semantic retrieval
    embedding vector(768),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_mem_user_active ON intelligence_memories(user_id, status, updated_at DESC) WHERE status IN ('active', 'verified');
CREATE INDEX IF NOT EXISTS idx_intel_mem_user_category ON intelligence_memories(user_id, category, memory_type) WHERE status IN ('active', 'verified');
CREATE INDEX IF NOT EXISTS idx_intel_mem_confidence ON intelligence_memories(user_id, confidence DESC) WHERE status IN ('active', 'verified');
CREATE INDEX IF NOT EXISTS idx_intel_mem_expires ON intelligence_memories(expires_at) WHERE expires_at IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_intel_mem_last_access ON intelligence_memories(user_id, last_accessed_at) WHERE status = 'active';

-- ============================================
-- 2. INTELLIGENCE ARTIFACTS
-- AI-generated analytical outputs
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Classification
    artifact_type intelligence_artifact_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Content
    chart_config JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '[]',
    insight TEXT,

    -- Provenance
    generated_by VARCHAR(64) NOT NULL DEFAULT 'chat',
    trigger_message_id UUID,
    conversation_id UUID,
    analysis_id UUID,
    memory_ids_used UUID[] DEFAULT '{}',
    data_sources JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_art_user ON intelligence_artifacts(user_id, is_archived, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_art_type ON intelligence_artifacts(user_id, artifact_type) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_intel_art_conv ON intelligence_artifacts(conversation_id) WHERE conversation_id IS NOT NULL;

-- ============================================
-- 3. INTELLIGENCE PLANS
-- Adaptive, executable strategies
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Classification
    plan_type intelligence_plan_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Content
    plan_data JSONB NOT NULL DEFAULT '{}',
    current_phase VARCHAR(64),

    -- Adaptiveness
    version INTEGER NOT NULL DEFAULT 1,
    adaptation_log JSONB NOT NULL DEFAULT '[]',
    adherence_rate REAL,

    -- Lifecycle
    status intelligence_plan_status NOT NULL DEFAULT 'draft',
    starts_at DATE,
    ends_at DATE,
    last_adapted_at TIMESTAMPTZ,

    -- Provenance
    source intelligence_source NOT NULL DEFAULT 'ai',
    memory_ids_used UUID[] DEFAULT '{}',
    goal_ids UUID[] DEFAULT '{}',

    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_plan_user ON intelligence_plans(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_plan_active ON intelligence_plans(user_id) WHERE status = 'active';

-- ============================================
-- 4. INTELLIGENCE CORE PROFILE
-- Foundational user model / calibration kernel
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_core_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Section & Key
    section intelligence_core_section NOT NULL,
    key VARCHAR(128) NOT NULL,

    -- Value
    value JSONB NOT NULL,
    unit VARCHAR(32),

    -- Calibration
    confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_points_used INTEGER NOT NULL DEFAULT 0,
    source intelligence_source NOT NULL DEFAULT 'system',

    -- History
    previous_values JSONB NOT NULL DEFAULT '[]',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, section, key)
);

CREATE INDEX IF NOT EXISTS idx_intel_core_user ON intelligence_core_profile(user_id, section);

-- ============================================
-- 5. INTELLIGENCE LOG REFERENCES
-- Pointers to raw behavioral data
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_log_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    source_table VARCHAR(128) NOT NULL,
    source_id UUID NOT NULL,
    source_date DATE NOT NULL,

    -- Extracted summary
    summary TEXT,
    category intelligence_category NOT NULL,

    -- Links to derived intelligence
    memory_ids UUID[] DEFAULT '{}',
    artifact_ids UUID[] DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, source_table, source_id)
);

CREATE INDEX IF NOT EXISTS idx_intel_log_user_date ON intelligence_log_references(user_id, source_date DESC);
CREATE INDEX IF NOT EXISTS idx_intel_log_category ON intelligence_log_references(user_id, category, source_date DESC);

-- ============================================
-- 6. INTELLIGENCE ANALYSES
-- Deep analysis session tracking
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Request
    analysis_type intelligence_analysis_type NOT NULL,
    query TEXT,
    parameters JSONB NOT NULL DEFAULT '{}',

    -- Execution
    status intelligence_analysis_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Results
    steps JSONB NOT NULL DEFAULT '[]',
    statistical_results JSONB,
    narrative TEXT,

    -- Links
    artifact_ids UUID[] DEFAULT '{}',
    memory_ids_used UUID[] DEFAULT '{}',
    memory_ids_created UUID[] DEFAULT '{}',

    -- Provenance
    trigger VARCHAR(32) NOT NULL DEFAULT 'user',
    conversation_id UUID,
    model_used VARCHAR(128),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_analysis_user ON intelligence_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_analysis_status ON intelligence_analyses(user_id, status) WHERE status IN ('pending', 'running');

-- ============================================
-- 7. INTELLIGENCE SESSION CONTEXT
-- Per-message transparency / explainability
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_session_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    message_id UUID,

    -- What was used
    memories_used JSONB NOT NULL DEFAULT '[]',
    core_profile_used JSONB NOT NULL DEFAULT '[]',
    analyses_used JSONB NOT NULL DEFAULT '[]',

    -- Confidence
    overall_confidence REAL,
    confidence_breakdown JSONB,

    -- User feedback
    was_helpful BOOLEAN,
    correction TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_session_conv ON intelligence_session_context(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_session_msg ON intelligence_session_context(message_id) WHERE message_id IS NOT NULL;

-- ============================================
-- 8. INTELLIGENCE FEEDBACK
-- Feedback loop tracking
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    target_type VARCHAR(32) NOT NULL,
    target_id UUID NOT NULL,

    action intelligence_feedback_action NOT NULL,
    correction_data JSONB,
    comment TEXT,

    -- Impact tracking
    confidence_delta REAL,
    memories_affected UUID[] DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_feedback_user ON intelligence_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_feedback_target ON intelligence_feedback(target_type, target_id);
