-- Migration: Admin overrides + enterprise contracts
-- admin_overrides:              per-user escape hatch (suspend, comp_plan, grant_credits, extend_trial)
-- enterprise_contracts:         custom plan contracts for orgs (overlays plan_features/limits)
-- enterprise_contract_seats:    user ↔ contract mapping
--
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 4).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ADMIN_OVERRIDES
-- ============================================

CREATE TABLE IF NOT EXISTS admin_overrides (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind              VARCHAR(40)  NOT NULL,
    plan_id           UUID         REFERENCES subscription_plans(id) ON DELETE SET NULL,
    credits_delta     INTEGER,
    days              INTEGER,
    reason            TEXT         NOT NULL,
    effective_at      TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    expires_at        TIMESTAMPTZ,
    revoked_at        TIMESTAMPTZ,
    revoked_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
    metadata          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT admin_overrides_kind_chk
        CHECK (kind IN (
            'suspend', 'unsuspend',
            'comp_plan', 'comp_plan_revoke',
            'grant_credits', 'deduct_credits',
            'extend_trial', 'refund'
        ))
);

CREATE INDEX IF NOT EXISTS idx_admin_overrides_user_active
    ON admin_overrides(user_id)
    WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_overrides_kind
    ON admin_overrides(kind);
CREATE INDEX IF NOT EXISTS idx_admin_overrides_created_at
    ON admin_overrides(created_at DESC);

-- ============================================
-- ENTERPRISE_CONTRACTS
-- ============================================

CREATE TABLE IF NOT EXISTS enterprise_contracts (
    id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                  VARCHAR(80)  UNIQUE NOT NULL,
    org_name              VARCHAR(200) NOT NULL,
    account_manager_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    base_plan_id          UUID         REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    seat_count            INTEGER      NOT NULL DEFAULT 1 CHECK (seat_count >= 1),
    credits_per_seat      INTEGER      NOT NULL DEFAULT 0,
    custom_features       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    custom_limits         JSONB        NOT NULL DEFAULT '{}'::jsonb,
    monthly_amount_cents  INTEGER      NOT NULL DEFAULT 0,
    currency              CHAR(3)      NOT NULL DEFAULT 'usd',
    starts_at             TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    ends_at               TIMESTAMPTZ,
    status                VARCHAR(20)  NOT NULL DEFAULT 'active',
    notes                 TEXT,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT enterprise_contracts_status_chk
        CHECK (status IN ('draft', 'active', 'suspended', 'expired', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_enterprise_contracts_status ON enterprise_contracts(status);

-- ============================================
-- ENTERPRISE_CONTRACT_SEATS
-- ============================================

CREATE TABLE IF NOT EXISTS enterprise_contract_seats (
    id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id       UUID         NOT NULL REFERENCES enterprise_contracts(id) ON DELETE CASCADE,
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at       TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    revoked_at        TIMESTAMPTZ,
    assigned_by       UUID         REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (contract_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_seats_user_active
    ON enterprise_contract_seats(user_id)
    WHERE revoked_at IS NULL;

SELECT 'admin_overrides + enterprise_contracts + enterprise_contract_seats created' AS status;
