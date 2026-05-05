-- Performance indexes for AI chat pipeline hot queries
-- Targets: workout_logs, meal_logs, activity_logs (used in retrieveContext and getRecentActivity)

-- workout_logs: getRecentActivity queries by user_id + scheduled_date DESC
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_recent
  ON workout_logs(user_id, scheduled_date DESC);

-- meal_logs: getRecentActivity queries by user_id + eaten_at DESC
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_recent
  ON meal_logs(user_id, eaten_at DESC);

-- activity_logs: retrieveContext queries recent 7-day window per user
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_7d
  ON activity_logs(user_id, scheduled_date DESC);

-- ai_coach_sessions: chat history lookups by user_id + created_at DESC
CREATE INDEX IF NOT EXISTS idx_ai_coach_sessions_user_recent
  ON ai_coach_sessions(user_id, created_at DESC);

-- user_coaching_profiles: getProfileFromCache DB-only fetch by user_id
CREATE INDEX IF NOT EXISTS idx_user_coaching_profiles_user
  ON user_coaching_profiles(user_id);
