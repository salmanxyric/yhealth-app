-- Migration: Extend user_subscriptions with grace + dunning + webhook trace
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 3).
--
-- Additive only. Also widens the status CHECK to include 'grace' and 'paused'.

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS grace_period_ends_at   TIMESTAMPTZ;
ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS dunning_state          VARCHAR(20);
ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS last_webhook_event_id  VARCHAR(120);
ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS schema_version         SMALLINT NOT NULL DEFAULT 1;

-- Widen status CHECK to include 'grace' and 'paused'.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'user_subscriptions_status_check'
    ) THEN
        ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_status_check;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'user_subscriptions_status_chk'
    ) THEN
        ALTER TABLE user_subscriptions
            ADD CONSTRAINT user_subscriptions_status_chk
            CHECK (status IN (
                'active', 'canceled', 'past_due', 'trialing',
                'incomplete', 'incomplete_expired', 'grace', 'paused'
            ));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'user_subscriptions_dunning_state_chk'
    ) THEN
        ALTER TABLE user_subscriptions
            ADD CONSTRAINT user_subscriptions_dunning_state_chk
            CHECK (dunning_state IS NULL OR dunning_state IN (
                'healthy', 'retrying', 'dunning_failed'
            ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_grace_due
    ON user_subscriptions(grace_period_ends_at)
    WHERE status = 'grace' AND grace_period_ends_at IS NOT NULL;

SELECT 'user_subscriptions extended with grace + dunning + webhook trace' AS status;
