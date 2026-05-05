-- ============================================
-- MIGRATION: Add mood_rating column to mood_logs
-- ============================================
-- The cross-domain correlator queries AVG(mood_rating) but the table
-- was created with only per-dimension ratings (happiness, energy, stress,
-- anxiety) plus a light-mode emoji. This adds a single composite
-- mood_rating (1-10) column and backfills it from existing data.
-- Safe to run multiple times.
-- Date: 2026-04-21
-- ============================================

-- 1. Add the column (nullable, 1-10 scale) idempotently
ALTER TABLE mood_logs
    ADD COLUMN IF NOT EXISTS mood_rating INTEGER
        CHECK (mood_rating >= 1 AND mood_rating <= 10);

-- 2. Backfill from existing data where possible
--    Deep mode: prefer happiness_rating; fall back to energy or
--               invert stress/anxiety so higher = better mood.
UPDATE mood_logs
SET mood_rating = CASE
        WHEN happiness_rating IS NOT NULL THEN happiness_rating
        WHEN energy_rating IS NOT NULL AND stress_rating IS NOT NULL
            THEN GREATEST(1, LEAST(10, ROUND(((energy_rating + (11 - stress_rating)) / 2.0))::INT))
        WHEN energy_rating IS NOT NULL THEN energy_rating
        WHEN stress_rating IS NOT NULL THEN (11 - stress_rating)
        WHEN anxiety_rating IS NOT NULL THEN (11 - anxiety_rating)
        ELSE NULL
    END
WHERE mood_rating IS NULL AND mode = 'deep';

-- 3. Light-mode backfill: map emoji to a 1-10 rating
--    Best-effort (ignores unknown emoji values silently).
UPDATE mood_logs
SET mood_rating = CASE mood_emoji::text
        WHEN 'amazing'  THEN 10
        WHEN 'great'    THEN 9
        WHEN 'good'     THEN 8
        WHEN 'okay'     THEN 6
        WHEN 'meh'      THEN 5
        WHEN 'bad'      THEN 4
        WHEN 'terrible' THEN 2
        ELSE NULL
    END
WHERE mood_rating IS NULL AND mode = 'light' AND mood_emoji IS NOT NULL;

-- 4. Useful index for correlator/date-range queries
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_rating
    ON mood_logs(user_id, logged_at DESC)
    WHERE mood_rating IS NOT NULL;
