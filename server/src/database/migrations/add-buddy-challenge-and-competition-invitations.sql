-- ============================================================================
-- Buddy Challenge & Competition Invitations
-- ============================================================================

-- 1. Add suggested_challenge column to buddy_suggestions_cache
ALTER TABLE buddy_suggestions_cache
  ADD COLUMN IF NOT EXISTS suggested_challenge JSONB DEFAULT NULL;

-- 2. Competition invitations for shared challenges
CREATE TABLE IF NOT EXISTS competition_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_ci_invitee_pending
  ON competition_invitations(invitee_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ci_competition
  ON competition_invitations(competition_id);

-- 3. Add ai_targeted to competition_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ai_targeted'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'competition_type')) THEN
    ALTER TYPE competition_type ADD VALUE IF NOT EXISTS 'ai_targeted';
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;
