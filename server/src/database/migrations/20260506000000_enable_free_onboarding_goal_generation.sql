-- Migration: Enable onboarding AI goal generation for the Free plan
--
-- New users reach /api/ai-coach/generate-goals during onboarding before they
-- have selected a paid plan. Keep the scope tight: only the onboarding goal
-- generation feature is enabled, and it is zero-cost so missing trial wallets
-- do not block account activation.

INSERT INTO plan_features (
    plan_id,
    feature_key,
    is_enabled,
    limit_value,
    limit_period,
    credit_cost
)
SELECT
    p.id,
    fc.feature_key,
    true,
    3,
    'day',
    0
FROM subscription_plans p
JOIN feature_catalog fc
  ON fc.feature_key IN ('ai.coach.goal_generate', 'ai.goals.from_assessment')
WHERE p.slug = 'free'
ON CONFLICT (plan_id, feature_key) DO UPDATE
   SET is_enabled = EXCLUDED.is_enabled,
       limit_value = EXCLUDED.limit_value,
       limit_period = EXCLUDED.limit_period,
       credit_cost = EXCLUDED.credit_cost,
       updated_at = NOW() AT TIME ZONE 'UTC';

UPDATE subscription_plans
   SET version = version + 1,
       updated_at = NOW() AT TIME ZONE 'UTC'
 WHERE slug = 'free';

DELETE FROM user_entitlements_cache
 WHERE plan_id IN (
     SELECT id FROM subscription_plans WHERE slug = 'free'
 );

SELECT pg_notify('entitlements_invalidate', u.id::text)
  FROM users u
 WHERE NOT EXISTS (
     SELECT 1
       FROM user_subscriptions us
      WHERE us.user_id = u.id
        AND us.status IN ('active', 'trialing', 'grace')
 );

SELECT 'free onboarding goal generation enabled' AS status;
