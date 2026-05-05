-- Migration: Promo codes + audit log + abuse signals
-- promo_codes:       discount / credit-grant codes redeemable by users
-- promo_redemptions: one-per-user redemption log
-- audit_log:         append-only audit trail (UPDATE/DELETE blocked by trigger)
-- abuse_signals:     fraud / abuse scoring records
--
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 4).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROMO_CODES
-- ============================================

CREATE TABLE IF NOT EXISTS promo_codes (
    id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                  VARCHAR(60)  UNIQUE NOT NULL,
    kind                  VARCHAR(30)  NOT NULL,
    credits_granted       INTEGER      NOT NULL DEFAULT 0,
    discount_percent      SMALLINT     CHECK (discount_percent IS NULL
                                              OR (discount_percent >= 0 AND discount_percent <= 100)),
    discount_cents        INTEGER,
    max_redemptions       INTEGER,
    redemption_count      INTEGER      NOT NULL DEFAULT 0,
    per_user_limit        SMALLINT     NOT NULL DEFAULT 1,
    stripe_coupon_id      VARCHAR(120),
    starts_at             TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    expires_at            TIMESTAMPTZ,
    is_active             BOOLEAN      NOT NULL DEFAULT true,
    metadata              JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_by            UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT promo_codes_kind_chk
        CHECK (kind IN ('credit_grant', 'percent_off', 'fixed_off', 'trial_extend'))
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_active
    ON promo_codes(is_active, expires_at)
    WHERE is_active = true;

-- ============================================
-- PROMO_REDEMPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS promo_redemptions (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id     UUID         NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    redeemed_at       TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    credits_granted   INTEGER      NOT NULL DEFAULT 0,
    metadata          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (promo_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id, redeemed_at DESC);

-- ============================================
-- AUDIT_LOG (append-only)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
    actor_kind        VARCHAR(20)  NOT NULL DEFAULT 'user',
    entity_type       VARCHAR(80)  NOT NULL,
    entity_id         VARCHAR(120),
    action            VARCHAR(80)  NOT NULL,
    before            JSONB,
    after             JSONB,
    ip                INET,
    user_agent        VARCHAR(255),
    request_id        UUID,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT audit_log_actor_kind_chk
        CHECK (actor_kind IN ('user', 'admin', 'system', 'webhook'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);

-- Append-only trigger (same pattern as credit_transactions)
CREATE OR REPLACE FUNCTION deny_modify_audit_log() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only (operation: %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON audit_log;
CREATE TRIGGER trg_audit_log_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION deny_modify_audit_log();

DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON audit_log;
CREATE TRIGGER trg_audit_log_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION deny_modify_audit_log();

-- ============================================
-- ABUSE_SIGNALS
-- ============================================

CREATE TABLE IF NOT EXISTS abuse_signals (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_kind       VARCHAR(40)  NOT NULL,
    score             SMALLINT     NOT NULL CHECK (score >= 0 AND score <= 100),
    evidence          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    reviewed_by       UUID         REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at       TIMESTAMPTZ,
    action_taken      VARCHAR(60),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT abuse_signals_kind_chk
        CHECK (signal_kind IN (
            'burst_rate', 'geo_anomaly', 'plan_cycle',
            'chargeback', 'credit_drain', 'duplicate_signup'
        ))
);

CREATE INDEX IF NOT EXISTS idx_abuse_signals_user_time
    ON abuse_signals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_unreviewed
    ON abuse_signals(score DESC, created_at DESC)
    WHERE reviewed_at IS NULL;

SELECT 'promo_codes + promo_redemptions + audit_log + abuse_signals created' AS status;
