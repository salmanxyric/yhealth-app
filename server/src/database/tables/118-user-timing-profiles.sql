-- ============================================
-- USER TIMING PROFILES TABLE
-- ============================================
-- Stores per-user 24-hour engagement histograms mined from
-- chat messages, check-ins, reminder actions, and activity completions.
-- Feature: Contextual Timing — learns the user's peak engagement hours
-- to bias proactive message delivery toward optimal windows.

CREATE TABLE IF NOT EXISTS user_timing_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 24-slot histogram (index 0 = midnight, 23 = 11 PM in user's local tz)
    hour_histogram INTEGER[24] NOT NULL DEFAULT '{0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}',

    -- Computed peaks
    peak_hour SMALLINT NOT NULL DEFAULT 9 CHECK (peak_hour >= 0 AND peak_hour <= 23),
    secondary_hour SMALLINT NOT NULL DEFAULT 18 CHECK (secondary_hour >= 0 AND secondary_hour <= 23),

    -- Quality indicators
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
    event_count INTEGER NOT NULL DEFAULT 0,

    -- Lifecycle
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_timing_profiles_user
    ON user_timing_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_timing_profiles_last_computed
    ON user_timing_profiles(last_computed_at);
