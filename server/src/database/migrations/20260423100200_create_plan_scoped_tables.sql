-- Migration: Plan-scoped entitlement tables
-- plan_features: plan × feature matrix (enabled + per-period limit + credit cost override)
-- plan_pages:    plan × page  matrix (access level)
-- plan_menus:    plan × menu  matrix (visibility + locked CTA)
--
-- Seeds default mappings for the three existing plans (free / monthly / 3-month)
-- so the entitlement engine returns something sensible from day one.
--
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 1).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLAN_FEATURES
-- ============================================

CREATE TABLE IF NOT EXISTS plan_features (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id      UUID         NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_key  VARCHAR(80)  NOT NULL REFERENCES feature_catalog(feature_key) ON DELETE CASCADE,
    is_enabled   BOOLEAN      NOT NULL DEFAULT true,
    limit_value  INTEGER,
    -- NULL = unlimited; otherwise the max number of uses per limit_period.
    limit_period VARCHAR(10),
    credit_cost  INTEGER,
    -- Overrides feature_catalog.credit_cost_default when NOT NULL.
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT plan_features_limit_period_chk
        CHECK (limit_period IS NULL OR limit_period IN ('day', 'week', 'month', 'cycle')),
    CONSTRAINT plan_features_limit_value_chk
        CHECK (limit_value IS NULL OR limit_value >= 0),
    CONSTRAINT plan_features_credit_cost_chk
        CHECK (credit_cost IS NULL OR credit_cost >= 0),
    UNIQUE (plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature ON plan_features(feature_key);

-- ============================================
-- PLAN_PAGES
-- ============================================

CREATE TABLE IF NOT EXISTS plan_pages (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id      UUID         NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    page_key     VARCHAR(80)  NOT NULL REFERENCES page_catalog(page_key) ON DELETE CASCADE,
    access_level VARCHAR(20)  NOT NULL DEFAULT 'full',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    CONSTRAINT plan_pages_access_level_chk
        CHECK (access_level IN ('none', 'preview', 'locked', 'full')),
    UNIQUE (plan_id, page_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_pages_plan ON plan_pages(plan_id);

-- ============================================
-- PLAN_MENUS
-- ============================================

CREATE TABLE IF NOT EXISTS plan_menus (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id     UUID         NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    menu_key    VARCHAR(80)  NOT NULL REFERENCES menu_catalog(menu_key) ON DELETE CASCADE,
    visible     BOOLEAN      NOT NULL DEFAULT true,
    locked_cta  VARCHAR(120),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE (plan_id, menu_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_menus_plan ON plan_menus(plan_id);

-- ============================================
-- SEED DEFAULT MAPPINGS FOR EXISTING PLANS
-- ============================================
-- Strategy:
--   - free:    essential features enabled with conservative limits; AI features mostly off
--                or heavily throttled; premium pages "locked"; premium menus hidden or locked.
--   - monthly: everything enabled; no per-period limits (credits are the throttle).
--   - 3-month: same as monthly.
--
-- Uses WHERE NOT EXISTS to be fully idempotent on re-run.

-- Free plan feature map --------------------------------------------------

INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
SELECT p.id, fc.feature_key,
       CASE
           WHEN fc.feature_key IN (
               'ai.coach.message', 'ai.coach.start',
               'ai.coach.goal_generate', 'ai.goals.from_assessment',
               'ai.rag.chat', 'ai.rag.chat_stream',
               'ai.coach.image_analyze', 'ai.coach.chat_with_image',
               'ai.emotion.checkin',
               'community.post', 'chat.group'
           ) THEN true
           ELSE false
       END AS is_enabled,
       CASE
           WHEN fc.feature_key IN ('ai.coach.message', 'ai.rag.chat') THEN 20
           WHEN fc.feature_key IN ('ai.coach.goal_generate', 'ai.goals.from_assessment') THEN 3
           WHEN fc.feature_key IN ('ai.coach.image_analyze', 'ai.coach.chat_with_image') THEN 3
           WHEN fc.feature_key = 'ai.emotion.checkin' THEN 1
           ELSE NULL
       END AS limit_value,
       CASE
           WHEN fc.feature_key IN (
               'ai.coach.message', 'ai.rag.chat',
               'ai.coach.goal_generate', 'ai.goals.from_assessment',
               'ai.coach.image_analyze', 'ai.coach.chat_with_image'
           ) THEN 'day'
           WHEN fc.feature_key = 'ai.emotion.checkin' THEN 'day'
           ELSE NULL
       END AS limit_period,
       CASE
           WHEN fc.feature_key IN ('ai.coach.goal_generate', 'ai.goals.from_assessment') THEN 0
           ELSE NULL
       END AS credit_cost
  FROM subscription_plans p
  CROSS JOIN feature_catalog fc
 WHERE p.slug = 'free'
   AND NOT EXISTS (
       SELECT 1 FROM plan_features pf
        WHERE pf.plan_id = p.id AND pf.feature_key = fc.feature_key
   );

-- Monthly plan feature map (everything enabled, no count caps) -----------

INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
SELECT p.id, fc.feature_key, true, NULL, NULL, NULL
  FROM subscription_plans p
  CROSS JOIN feature_catalog fc
 WHERE p.slug = 'monthly'
   AND fc.category <> 'admin_ai'
   AND NOT EXISTS (
       SELECT 1 FROM plan_features pf
        WHERE pf.plan_id = p.id AND pf.feature_key = fc.feature_key
   );

-- 3-month plan feature map (same as monthly) -----------------------------

INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
SELECT p.id, fc.feature_key, true, NULL, NULL, NULL
  FROM subscription_plans p
  CROSS JOIN feature_catalog fc
 WHERE p.slug = '3-month'
   AND fc.category <> 'admin_ai'
   AND NOT EXISTS (
       SELECT 1 FROM plan_features pf
        WHERE pf.plan_id = p.id AND pf.feature_key = fc.feature_key
   );

-- Free plan page map (premium pages locked, legal pages full) ------------

INSERT INTO plan_pages (plan_id, page_key, access_level)
SELECT p.id, pc.page_key,
       CASE
           WHEN pc.is_public THEN 'full'
           WHEN pc.page_key IN (
               'dashboard', 'profile', 'settings', 'preferences',
               'notifications', 'onboarding', 'subscription', 'help',
               'reset-password', 'activity', 'goals', 'progress',
               'achievements', 'community', 'messages', 'blogs',
               'ai-coach', 'chat', 'chat-history', 'nutrition',
               'wellbeing', 'life-areas', 'obstacles'
           ) THEN 'full'
           ELSE 'locked'
       END AS access_level
  FROM subscription_plans p
  CROSS JOIN page_catalog pc
 WHERE p.slug = 'free'
   AND NOT EXISTS (
       SELECT 1 FROM plan_pages pp
        WHERE pp.plan_id = p.id AND pp.page_key = pc.page_key
   );

-- Monthly / 3-month page map (all pages full) ----------------------------

INSERT INTO plan_pages (plan_id, page_key, access_level)
SELECT p.id, pc.page_key, 'full'
  FROM subscription_plans p
  CROSS JOIN page_catalog pc
 WHERE p.slug IN ('monthly', '3-month')
   AND NOT EXISTS (
       SELECT 1 FROM plan_pages pp
        WHERE pp.plan_id = p.id AND pp.page_key = pc.page_key
   );

-- Free plan menu map (premium menus locked, basics visible) --------------

INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
SELECT p.id, mc.menu_key,
       CASE
           WHEN mc.menu_key IN (
               'voice-assistant', 'voice-call',
               'knowledge-graph', 'money-map',
               'competitions', 'leaderboard',
               'webinars', 'whoop', 'contracts', 'soundscape'
           ) THEN true
           ELSE true
       END AS visible,
       CASE
           WHEN mc.menu_key IN (
               'voice-assistant', 'voice-call',
               'knowledge-graph', 'money-map',
               'competitions', 'leaderboard',
               'webinars', 'whoop', 'contracts', 'soundscape'
           ) THEN 'Upgrade to unlock'
           ELSE NULL
       END AS locked_cta
  FROM subscription_plans p
  CROSS JOIN menu_catalog mc
 WHERE p.slug = 'free'
   AND NOT EXISTS (
       SELECT 1 FROM plan_menus pm
        WHERE pm.plan_id = p.id AND pm.menu_key = mc.menu_key
   );

-- Monthly / 3-month menu map (all menus visible, no lock CTA) ------------

INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
SELECT p.id, mc.menu_key, true, NULL
  FROM subscription_plans p
  CROSS JOIN menu_catalog mc
 WHERE p.slug IN ('monthly', '3-month')
   AND NOT EXISTS (
       SELECT 1 FROM plan_menus pm
        WHERE pm.plan_id = p.id AND pm.menu_key = mc.menu_key
   );

SELECT 'plan_features / plan_pages / plan_menus created and seeded for free/monthly/3-month' AS status;
