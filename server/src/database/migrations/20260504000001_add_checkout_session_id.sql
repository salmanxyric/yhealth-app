-- Add checkout_session_id to user_subscriptions for idempotent verification
-- Prevents duplicate subscriptions from replayed verifyCheckoutSession calls.

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_checkout_session_id
    ON user_subscriptions (checkout_session_id)
    WHERE checkout_session_id IS NOT NULL;
