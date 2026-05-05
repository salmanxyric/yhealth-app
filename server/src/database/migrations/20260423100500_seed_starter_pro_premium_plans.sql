-- Migration: Seed starter / pro / premium plan tiers + entitlement mappings
-- The starter / pro / premium plan rows already exist in subscription_plans
-- (pre-created outside of our Sprint 1 migrations) but had tier=0 and no
-- plan_features / plan_pages / plan_menus rows. This migration:
--   1. Backfills tier, credits, trial, and rollover policy on each row.
--   2. Seeds the plan_features / plan_pages / plan_menus matrices.
--
-- Fully idempotent: uses NOT EXISTS guards and UPDATE WHERE clauses.
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 1).

-- ============================================
-- BACKFILL TIER / CREDITS / TRIAL
-- ============================================

UPDATE subscription_plans
   SET tier = 10,
       credits_included_monthly = 500,
       trial_days = 0,
       credits_rollover_policy = 'cap',
       credits_rollover_cap = 500,
       version = version + 1
 WHERE slug = 'starter' AND tier = 0;

UPDATE subscription_plans
   SET tier = 20,
       credits_included_monthly = 2000,
       trial_days = 0,
       credits_rollover_policy = 'cap',
       credits_rollover_cap = 2000,
       version = version + 1
 WHERE slug = 'pro' AND tier = 0;

UPDATE subscription_plans
   SET tier = 30,
       credits_included_monthly = 10000,
       trial_days = 0,
       credits_rollover_policy = 'cap',
       credits_rollover_cap = 10000,
       version = version + 1
 WHERE slug = 'premium' AND tier = 0;

-- ============================================
-- STARTER: paid entry tier — core AI enabled, voice + premium analytics off
-- ============================================

INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
SELECT p.id, fc.feature_key,
       CASE
           WHEN fc.category = 'admin_ai' THEN false
           WHEN fc.feature_key IN ('ai.voice.call', 'ai.voice.journal_turn', 'ai.voice.journal_summary', 'voice_assistant.use')
               THEN false
           WHEN fc.feature_key IN ('knowledge_graph.query', 'money_map.view', 'analytics.export')
               THEN false
           WHEN fc.feature_key = 'competitions.join_premium' THEN false
           ELSE true
       END AS is_enabled,
       NULL AS limit_value,
       NULL AS limit_period,
       NULL AS credit_cost
  FROM subscription_plans p
  CROSS JOIN feature_catalog fc
 WHERE p.slug = 'starter'
   AND NOT EXISTS (
       SELECT 1 FROM plan_features pf
        WHERE pf.plan_id = p.id AND pf.feature_key = fc.feature_key
   );

INSERT INTO plan_pages (plan_id, page_key, access_level)
SELECT p.id, pc.page_key,
       CASE
           WHEN pc.is_public THEN 'full'
           WHEN pc.page_key IN ('voice-assistant', 'voice-call',
                                'knowledge-graph', 'money-map',
                                'competitions', 'webinars', 'whoop',
                                'contracts', 'soundscape', 'leaderboard')
               THEN 'locked'
           ELSE 'full'
       END AS access_level
  FROM subscription_plans p
  CROSS JOIN page_catalog pc
 WHERE p.slug = 'starter'
   AND NOT EXISTS (
       SELECT 1 FROM plan_pages pp
        WHERE pp.plan_id = p.id AND pp.page_key = pc.page_key
   );

INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
SELECT p.id, mc.menu_key, true,
       CASE
           WHEN mc.menu_key IN ('voice-assistant', 'voice-call',
                                'knowledge-graph', 'money-map',
                                'competitions', 'webinars', 'whoop',
                                'contracts', 'soundscape', 'leaderboard')
               THEN 'Upgrade to Pro'
           ELSE NULL
       END AS locked_cta
  FROM subscription_plans p
  CROSS JOIN menu_catalog mc
 WHERE p.slug = 'starter'
   AND NOT EXISTS (
       SELECT 1 FROM plan_menus pm
        WHERE pm.plan_id = p.id AND pm.menu_key = mc.menu_key
   );

-- ============================================
-- PRO: consumer flagship — all user-facing AI enabled, no admin AI
-- ============================================

INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
SELECT p.id, fc.feature_key,
       CASE
           WHEN fc.category = 'admin_ai' THEN false
           ELSE true
       END AS is_enabled,
       NULL, NULL, NULL
  FROM subscription_plans p
  CROSS JOIN feature_catalog fc
 WHERE p.slug = 'pro'
   AND NOT EXISTS (
       SELECT 1 FROM plan_features pf
        WHERE pf.plan_id = p.id AND pf.feature_key = fc.feature_key
   );

INSERT INTO plan_pages (plan_id, page_key, access_level)
SELECT p.id, pc.page_key, 'full'
  FROM subscription_plans p
  CROSS JOIN page_catalog pc
 WHERE p.slug = 'pro'
   AND NOT EXISTS (
       SELECT 1 FROM plan_pages pp
        WHERE pp.plan_id = p.id AND pp.page_key = pc.page_key
   );

INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
SELECT p.id, mc.menu_key, true, NULL
  FROM subscription_plans p
  CROSS JOIN menu_catalog mc
 WHERE p.slug = 'pro'
   AND NOT EXISTS (
       SELECT 1 FROM plan_menus pm
        WHERE pm.plan_id = p.id AND pm.menu_key = mc.menu_key
   );

-- ============================================
-- PREMIUM: flagship + admin AI tools (for team owners / power users)
-- ============================================

INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
SELECT p.id, fc.feature_key, true, NULL, NULL, NULL
  FROM subscription_plans p
  CROSS JOIN feature_catalog fc
 WHERE p.slug = 'premium'
   AND NOT EXISTS (
       SELECT 1 FROM plan_features pf
        WHERE pf.plan_id = p.id AND pf.feature_key = fc.feature_key
   );

INSERT INTO plan_pages (plan_id, page_key, access_level)
SELECT p.id, pc.page_key, 'full'
  FROM subscription_plans p
  CROSS JOIN page_catalog pc
 WHERE p.slug = 'premium'
   AND NOT EXISTS (
       SELECT 1 FROM plan_pages pp
        WHERE pp.plan_id = p.id AND pp.page_key = pc.page_key
   );

INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
SELECT p.id, mc.menu_key, true, NULL
  FROM subscription_plans p
  CROSS JOIN menu_catalog mc
 WHERE p.slug = 'premium'
   AND NOT EXISTS (
       SELECT 1 FROM plan_menus pm
        WHERE pm.plan_id = p.id AND pm.menu_key = mc.menu_key
   );

SELECT 'starter / pro / premium tiers + entitlement mappings seeded' AS status;
