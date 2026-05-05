-- Add health profile visibility settings to user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS health_profile_visibility VARCHAR(20) DEFAULT 'friends'
    CHECK (health_profile_visibility IN ('disabled', 'friends', 'all', 'custom')),
  ADD COLUMN IF NOT EXISTS health_profile_allowed_users TEXT[] DEFAULT '{}';
