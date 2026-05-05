-- ============================================================================
-- Competition Invitations (Shared Challenges)
-- ============================================================================

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
