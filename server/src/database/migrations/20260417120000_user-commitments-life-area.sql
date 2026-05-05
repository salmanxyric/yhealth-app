-- Optional FK from chat-tracked commitments to life_areas (also applied via commitment-tracker ensureTable).
ALTER TABLE user_commitments
  ADD COLUMN IF NOT EXISTS life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_uc_user_life_area
  ON user_commitments(user_id, life_area_id)
  WHERE life_area_id IS NOT NULL;
