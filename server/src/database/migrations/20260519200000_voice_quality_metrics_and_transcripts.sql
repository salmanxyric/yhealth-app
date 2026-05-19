-- ============================================
-- Add quality_metrics column to voice_calls
-- and create call_transcripts table
-- ============================================

-- Quality metrics: JSONB array of periodic WebRTC stats snapshots
ALTER TABLE voice_calls
  ADD COLUMN IF NOT EXISTS quality_metrics JSONB DEFAULT '[]'::jsonb;

-- Extend call_event_type enum with new values
DO $$
BEGIN
  ALTER TYPE call_event_type ADD VALUE IF NOT EXISTS 'quality_report';
  ALTER TYPE call_event_type ADD VALUE IF NOT EXISTS 'transcript_segment';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- CALL TRANSCRIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
  speaker VARCHAR(10) NOT NULL CHECK (speaker IN ('user', 'ai')),
  content TEXT NOT NULL,
  spoken_at TIMESTAMP NOT NULL,
  confidence REAL,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_transcripts_call ON call_transcripts(call_id, spoken_at);
CREATE INDEX IF NOT EXISTS idx_call_transcripts_speaker ON call_transcripts(call_id, speaker);
