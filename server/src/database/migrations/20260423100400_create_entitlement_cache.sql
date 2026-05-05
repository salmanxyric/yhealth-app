-- Migration: user_entitlements_cache
-- Shared L2 cache for the entitlement engine.
-- L1 is an in-process lru-cache (60s TTL), L3 is the source-of-truth joins.
-- Invalidation: DELETE rows on webhook/override/plan edit; pg_notify('entitlements_invalidate', user_id)
-- also fires to bust L1 on every Node process.
--
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 1).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS user_entitlements_cache (
    user_id       UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan_id       UUID        REFERENCES subscription_plans(id) ON DELETE SET NULL,
    plan_version  INTEGER     NOT NULL,
    etag          VARCHAR(80) NOT NULL,
    features      JSONB       NOT NULL,
    pages         JSONB       NOT NULL,
    menus         JSONB       NOT NULL,
    limits        JSONB       NOT NULL,
    wallet        JSONB       NOT NULL,
    plan          JSONB       NOT NULL,
    subscription  JSONB       NOT NULL,
    overrides     JSONB       NOT NULL DEFAULT '[]'::jsonb,
    computed_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entitlements_cache_expires ON user_entitlements_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_entitlements_cache_plan ON user_entitlements_cache(plan_id);

SELECT 'user_entitlements_cache created' AS status;
