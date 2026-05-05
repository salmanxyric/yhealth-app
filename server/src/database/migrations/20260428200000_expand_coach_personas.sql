-- Expand AI Coach personas from 3 → 4 and rename for consistency.
-- Old: drill_sergeant, gentle_friend, data_driven_neutral
-- New: commander, friend, data_nerd, guardian

-- 1. Migrate existing rows to new names
DO $$
BEGIN
  UPDATE user_preferences
  SET ai_coach_persona = CASE ai_coach_persona
    WHEN 'drill_sergeant'      THEN 'commander'
    WHEN 'gentle_friend'       THEN 'friend'
    WHEN 'data_driven_neutral' THEN 'data_nerd'
    ELSE 'friend'
  END
  WHERE ai_coach_persona IN ('drill_sergeant', 'gentle_friend', 'data_driven_neutral');
END $$;

-- 2. Drop old constraint and add new one with 4 values
ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_ai_coach_persona_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_ai_coach_persona_check
  CHECK (ai_coach_persona IN ('commander', 'friend', 'data_nerd', 'guardian'));

-- 3. Update default
ALTER TABLE user_preferences
  ALTER COLUMN ai_coach_persona SET DEFAULT 'friend';
