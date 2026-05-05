-- Performance indexes for accountability system at 100K+ users

-- Active triggers filtered by cooldown eligibility (used in trigger evaluation job)
CREATE INDEX IF NOT EXISTS idx_acc_triggers_active_cooldown
  ON accountability_triggers (user_id, last_triggered_at)
  WHERE is_active = TRUE;

-- Contract evaluation: only active/at_risk contracts not recently checked
CREATE INDEX IF NOT EXISTS idx_contracts_eval_pending
  ON accountability_contracts (status, last_checked_at NULLS FIRST, start_date, end_date)
  WHERE status IN ('active', 'at_risk');

-- Contract checks streak calculation (ordered by date for window queries)
CREATE INDEX IF NOT EXISTS idx_contract_checks_streak
  ON accountability_contract_checks (contract_id, checked_at DESC, passed);

-- Consent lookup (hot path — cached in service but index helps cold starts)
CREATE INDEX IF NOT EXISTS idx_consent_user_enabled
  ON accountability_consent (user_id)
  WHERE enabled = TRUE;

-- Violation lookups by penalty status (for stats and dashboard)
CREATE INDEX IF NOT EXISTS idx_violations_penalty_status
  ON accountability_contract_violations (user_id, penalty_status);
