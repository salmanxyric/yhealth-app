-- AI Coach product personas (additive). coaching_style enum is unchanged.
-- Wrapped UPDATE in a plpgsql DO block so runMigration() does not split on semicolons inside CASE ... END.

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS ai_coach_persona VARCHAR(32) DEFAULT 'gentle_friend';

DO $$
BEGIN
  UPDATE user_preferences
  SET ai_coach_persona = CASE coaching_style::text
    WHEN 'direct' THEN 'drill_sergeant'
    WHEN 'analytical' THEN 'data_driven_neutral'
    ELSE 'gentle_friend'
  END;
END $$;

ALTER TABLE user_preferences
  ALTER COLUMN ai_coach_persona SET DEFAULT 'gentle_friend';

ALTER TABLE user_preferences
  ALTER COLUMN ai_coach_persona SET NOT NULL;

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_ai_coach_persona_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_ai_coach_persona_check
  CHECK (ai_coach_persona IN ('drill_sergeant', 'gentle_friend', 'data_driven_neutral'));

CREATE INDEX IF NOT EXISTS idx_user_preferences_ai_coach_persona
  ON user_preferences (ai_coach_persona);
