-- Migration #10: Backfill credit_wallets for existing users + grant 50 trial bonus credits
-- Fully idempotent via deterministic idempotency_key:
--   'backfill:trial_bonus:<user_id>'
-- Safe to re-run; second run is a no-op.
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 1 hardening).
--
-- Eligibility for 50 trial credits:
--   - User created within the last 7 days (matches subscription_plans.trial_days for 'free')
--   - No paid user_subscription (status IN ('active','trialing','past_due') on tier>0 plan)

-- ============================================
-- STEP 1: Create wallet row for every user without one (zero balance)
-- ============================================

INSERT INTO credit_wallets (
    user_id, plan_credits_balance, bonus_credits_balance, lifetime_granted
)
SELECT u.id, 0, 0, 0
  FROM users u
 WHERE NOT EXISTS (
     SELECT 1 FROM credit_wallets w WHERE w.user_id = u.id
 );

-- ============================================
-- STEP 2: Grant 50 bonus credits to trial-eligible users (ledger-first + conditional UPDATE)
-- ============================================
-- Uses ON CONFLICT (idempotency_key) DO NOTHING on the ledger so replays skip.
-- Wallet UPDATE runs only for user_ids that got a fresh ledger insert, which
-- guarantees the grant applies exactly once per user.

WITH eligible AS (
    SELECT u.id AS user_id,
           w.plan_credits_balance,
           w.bonus_credits_balance
      FROM users u
      JOIN credit_wallets w ON w.user_id = u.id
     WHERE u.created_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '7 days'
       -- Not already subscribed to a paid plan
       AND NOT EXISTS (
           SELECT 1
             FROM user_subscriptions us
             JOIN subscription_plans sp ON sp.id = us.plan_id
            WHERE us.user_id = u.id
              AND us.status IN ('active', 'trialing', 'past_due')
              AND sp.tier > 0
       )
       -- Idempotency guard: skip users who already received this backfill grant
       AND NOT EXISTS (
           SELECT 1 FROM credit_transactions ct
            WHERE ct.idempotency_key = 'backfill:trial_bonus:' || u.id::text
       )
),
ledger_inserts AS (
    INSERT INTO credit_transactions (
        user_id, delta, bucket, kind, reason, idempotency_key,
        balance_after_plan, balance_after_bonus, metadata
    )
    SELECT e.user_id,
           50,
           'bonus',
           'grant',
           'backfill:trial_bonus',
           'backfill:trial_bonus:' || e.user_id::text,
           e.plan_credits_balance,
           e.bonus_credits_balance + 50,
           jsonb_build_object(
               'source',  'migration_20260423100600',
               'policy',  'free_trial_50_bonus_credits',
               'granted_at', (NOW() AT TIME ZONE 'UTC')
           )
      FROM eligible e
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING user_id
)
UPDATE credit_wallets w
   SET bonus_credits_balance = bonus_credits_balance + 50,
       lifetime_granted      = lifetime_granted + 50,
       version               = version + 1,
       updated_at            = NOW() AT TIME ZONE 'UTC'
 WHERE w.user_id IN (SELECT user_id FROM ledger_inserts);

-- ============================================
-- REPORT
-- ============================================

SELECT
    (SELECT COUNT(*) FROM credit_wallets) AS wallets_total,
    (SELECT COUNT(*) FROM credit_transactions
      WHERE reason = 'backfill:trial_bonus') AS trial_grants_total,
    (SELECT COALESCE(SUM(bonus_credits_balance), 0) FROM credit_wallets) AS total_bonus_credits_outstanding,
    'wallets + trial bonus backfill complete' AS status;
