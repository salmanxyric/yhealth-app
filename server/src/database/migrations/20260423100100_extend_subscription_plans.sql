-- Migration: Extend subscription_plans with tier / credits / yearly / trial / version
-- Additive only — does NOT rename existing slugs (free / monthly / 3-month).
-- Backfills sensible defaults for the three existing seed plans.
--
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 1).

-- ============================================
-- NEW COLUMNS
-- ============================================

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 0;
    -- 0=free, 10=starter, 20=pro, 30=premium, 99=enterprise

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS credits_included_monthly INTEGER NOT NULL DEFAULT 0;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS credits_rollover_policy VARCHAR(20) NOT NULL DEFAULT 'none';

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS credits_rollover_cap INTEGER;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS is_enterprise BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS yearly_amount_cents INTEGER;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS yearly_stripe_price_id VARCHAR(255);

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS trial_days SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
    -- Bump on feature/menu/limit changes → busts entitlement caches.

-- ============================================
-- CHECK CONSTRAINTS (added idempotently)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'subscription_plans_credits_included_chk'
    ) THEN
        ALTER TABLE subscription_plans
            ADD CONSTRAINT subscription_plans_credits_included_chk
            CHECK (credits_included_monthly >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'subscription_plans_rollover_policy_chk'
    ) THEN
        ALTER TABLE subscription_plans
            ADD CONSTRAINT subscription_plans_rollover_policy_chk
            CHECK (credits_rollover_policy IN ('none', 'cap', 'unlimited'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'subscription_plans_yearly_amount_chk'
    ) THEN
        ALTER TABLE subscription_plans
            ADD CONSTRAINT subscription_plans_yearly_amount_chk
            CHECK (yearly_amount_cents IS NULL OR yearly_amount_cents >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'subscription_plans_trial_days_chk'
    ) THEN
        ALTER TABLE subscription_plans
            ADD CONSTRAINT subscription_plans_trial_days_chk
            CHECK (trial_days >= 0);
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(tier);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_yearly_price
    ON subscription_plans(yearly_stripe_price_id)
    WHERE yearly_stripe_price_id IS NOT NULL;

-- ============================================
-- BACKFILL EXISTING SEED PLANS
-- ============================================
-- free   → tier 0,  50 credits/mo, 7-day trial
-- monthly→ tier 20, 2000 credits/mo, no trial
-- 3-month→ tier 20, 2000 credits per cycle, no trial

UPDATE subscription_plans
   SET tier = 0,
       credits_included_monthly = 50,
       trial_days = 7,
       credits_rollover_policy = 'none',
       version = version + 1
 WHERE slug = 'free';

UPDATE subscription_plans
   SET tier = 20,
       credits_included_monthly = 2000,
       trial_days = 0,
       credits_rollover_policy = 'cap',
       credits_rollover_cap = 2000,
       version = version + 1
 WHERE slug = 'monthly';

UPDATE subscription_plans
   SET tier = 20,
       credits_included_monthly = 2000,
       trial_days = 0,
       credits_rollover_policy = 'cap',
       credits_rollover_cap = 6000,
       version = version + 1
 WHERE slug = '3-month';

SELECT 'subscription_plans extended with tier/credits/yearly/trial/version' AS status;
