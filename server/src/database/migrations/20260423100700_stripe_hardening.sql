-- Migration: Stripe webhook hardening
-- stripe_event_log:  per-event idempotency guard (evt_* → status machine)
-- invoices:          Stripe invoice mirror for user-facing billing history
-- payment_attempts:  dunning retry schedule after invoice.payment_failed
--
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 3).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STRIPE_EVENT_LOG
-- ============================================

CREATE TABLE IF NOT EXISTS stripe_event_log (
    event_id      VARCHAR(120) PRIMARY KEY,
    type          VARCHAR(100) NOT NULL,
    api_version   VARCHAR(30),
    payload       JSONB        NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'received',
    attempt       SMALLINT     NOT NULL DEFAULT 0,
    error         TEXT,
    received_at   TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    processed_at  TIMESTAMPTZ,
    CONSTRAINT stripe_event_log_status_chk
        CHECK (status IN ('received', 'processing', 'processed', 'failed', 'skipped'))
);

CREATE INDEX IF NOT EXISTS idx_stripe_event_log_type ON stripe_event_log(type);
CREATE INDEX IF NOT EXISTS idx_stripe_event_log_status ON stripe_event_log(status)
    WHERE status IN ('received', 'processing', 'failed');
CREATE INDEX IF NOT EXISTS idx_stripe_event_log_received ON stripe_event_log(received_at DESC);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
    id                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id          UUID         REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    stripe_invoice_id        VARCHAR(120) UNIQUE,
    stripe_customer_id       VARCHAR(120),
    number                   VARCHAR(60),
    amount_paid_cents        INTEGER      NOT NULL DEFAULT 0,
    amount_due_cents         INTEGER      NOT NULL DEFAULT 0,
    amount_refunded_cents    INTEGER      NOT NULL DEFAULT 0,
    currency                 CHAR(3)      NOT NULL DEFAULT 'usd',
    status                   VARCHAR(20)  NOT NULL,
    period_start             TIMESTAMPTZ,
    period_end               TIMESTAMPTZ,
    paid_at                  TIMESTAMPTZ,
    hosted_invoice_url       TEXT,
    pdf_url                  TEXT,
    metadata                 JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT invoices_status_chk
        CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_created ON invoices(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================
-- PAYMENT_ATTEMPTS
-- ============================================

CREATE TABLE IF NOT EXISTS payment_attempts (
    id                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id               UUID         NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id                  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number           SMALLINT     NOT NULL,
    scheduled_at             TIMESTAMPTZ  NOT NULL,
    attempted_at             TIMESTAMPTZ,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'scheduled',
    stripe_charge_id         VARCHAR(120),
    failure_code             VARCHAR(80),
    failure_message          TEXT,
    metadata                 JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT payment_attempts_status_chk
        CHECK (status IN ('scheduled', 'in_progress', 'succeeded', 'failed', 'abandoned'))
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_invoice ON payment_attempts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_due ON payment_attempts(scheduled_at)
    WHERE status = 'scheduled';

SELECT 'stripe_event_log + invoices + payment_attempts created' AS status;
