-- Mood-tagged Spotify listening sessions for correlation analysis
CREATE TABLE IF NOT EXISTS spotify_listening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listened_at TIMESTAMPTZ NOT NULL,
  track_name VARCHAR(256),
  artist_name VARCHAR(256),
  genre VARCHAR(64),
  valence REAL,
  energy REAL,
  tempo REAL,
  mood_tag VARCHAR(24),
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slh_user_date ON spotify_listening_history(user_id, listened_at DESC);
