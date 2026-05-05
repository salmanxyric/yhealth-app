-- Migration: Credit tables
-- credit_wallets:      per-user balance (plan bucket + bonus bucket), atomic UPDATE target
-- credit_transactions: append-only ledger (UPDATE/DELETE blocked by trigger)
-- usage_events:        per AI call detail (provider, model, tokens, cost) — mirrors ledger consumption
--
-- Concurrency protocol is documented on consumeCredits() in credit.service.ts.
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 1).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREDIT_WALLETS
-- ============================================

CREATE TABLE IF NOT EXISTS credit_wallets (
    user_id                UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan_credits_balance   INTEGER     NOT NULL DEFAULT 0 CHECK (plan_credits_balance >= 0),
    bonus_credits_balance  INTEGER     NOT NULL DEFAULT 0 CHECK (bonus_credits_balance >= 0),
    currency               CHAR(3)     NOT NULL DEFAULT 'usd',
    lifetime_granted       BIGINT      NOT NULL DEFAULT 0,
    lifetime_consumed      BIGINT      NOT NULL DEFAULT 0,
    last_reset_at          TIMESTAMPTZ,
    next_reset_at          TIMESTAMPTZ,
    version                INTEGER     NOT NULL DEFAULT 1,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ============================================
-- CREDIT_TRANSACTIONS (append-only ledger)
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta               INTEGER      NOT NULL,
    bucket              VARCHAR(10)  NOT NULL,
    kind                VARCHAR(20)  NOT NULL,
    reason              VARCHAR(120) NOT NULL,
    feature_key         VARCHAR(80)  REFERENCES feature_catalog(feature_key) ON DELETE SET NULL,
    endpoint            VARCHAR(200),
    request_id          UUID,
    idempotency_key     VARCHAR(160) UNIQUE,
    balance_after_plan  INTEGER      NOT NULL,
    balance_after_bonus INTEGER      NOT NULL,
    metadata            JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT credit_transactions_bucket_chk
        CHECK (bucket IN ('plan', 'bonus')),
    CONSTRAINT credit_transactions_kind_chk
        CHECK (kind IN ('grant', 'consume', 'reserve', 'settle', 'release', 'refund', 'expire', 'rollover', 'adjustment'))
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_request
    ON credit_transactions(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_tx_feature
    ON credit_transactions(feature_key, created_at DESC);

-- ============================================
-- APPEND-ONLY ENFORCEMENT
-- ============================================
-- Deny all UPDATE and DELETE on credit_transactions.
-- The only writer is INSERT; balance history is immutable by design.

CREATE OR REPLACE FUNCTION deny_modify_credit_transactions() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'credit_transactions is append-only (operation: %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_tx_no_update ON credit_transactions;
CREATE TRIGGER trg_credit_tx_no_update
    BEFORE UPDATE ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION deny_modify_credit_transactions();

DROP TRIGGER IF EXISTS trg_credit_tx_no_delete ON credit_transactions;
CREATE TRIGGER trg_credit_tx_no_delete
    BEFORE DELETE ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION deny_modify_credit_transactions();

-- ============================================
-- USAGE_EVENTS
-- ============================================
-- One row per AI invocation with provider-level metadata.
-- Linked to credit_transactions by request_id.
-- Also UNIQUE on idempotency_key for at-most-once semantics.

CREATE TABLE IF NOT EXISTS usage_events (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_key         VARCHAR(80)  NOT NULL REFERENCES feature_catalog(feature_key),
    endpoint            VARCHAR(200) NOT NULL,
    provider            VARCHAR(40),
    model               VARCHAR(80),
    input_tokens        INTEGER,
    output_tokens       INTEGER,
    audio_seconds       NUMERIC(10,3),
    image_count         INTEGER,
    cost_usd_estimated  NUMERIC(10,6),
    credits_reserved    INTEGER      NOT NULL DEFAULT 0,
    credits_charged     INTEGER      NOT NULL DEFAULT 0,
    request_id          UUID         NOT NULL,
    idempotency_key     VARCHAR(160) UNIQUE,
    status              VARCHAR(20)  NOT NULL,
    error_code          VARCHAR(80),
    metadata            JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT usage_events_status_chk
        CHECK (status IN ('reserved', 'settled', 'refunded', 'failed', 'released'))
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_time ON usage_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_feature_time ON usage_events(feature_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_request ON usage_events(request_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_status ON usage_events(status);

SELECT 'credit_wallets, credit_transactions (append-only), usage_events created' AS status;
