/**
 * Entitlement Service
 *
 * Server-authoritative source of truth for what a user can do.
 * Resolution chain (highest priority first):
 *   1. enterprise_contracts active seat                (future Sprint 5)
 *   2. admin_overrides (comp_plan, suspend, etc.)      (future Sprint 4)
 *   3. user_subscriptions (active | trialing | grace)  → plan_features/pages/menus
 *   4. Synthetic trial (users.created_at + trial_days)
 *   5. Default Free plan
 *
 * Cache architecture:
 *   L1 — in-process lru-cache (60s TTL), invalidated via pg NOTIFY/LISTEN
 *   L2 — user_entitlements_cache table (5 min TTL)
 *   L3 — source-of-truth joins (computed on miss)
 */

import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { pool, query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { socketService } from './socket.service.js';

// ============================================
// TYPES
// ============================================

export type PlanTier = 0 | 10 | 20 | 30 | 99; // free|starter|pro|premium|enterprise
export type SubscriptionStatus =
    | 'active' | 'canceled' | 'past_due' | 'trialing'
    | 'incomplete' | 'incomplete_expired' | 'grace' | 'paused' | 'none';

export interface FeatureEntitlement {
    enabled: boolean;
    creditCost: number;
    limit: number | null;
    limitPeriod: 'day' | 'week' | 'month' | 'cycle' | null;
    used: number;
}

export interface MenuEntitlement {
    visible: boolean;
    lockedCta: string | null;
}

export interface WalletSnapshot {
    planCredits: number;
    bonusCredits: number;
    total: number;
    lastResetAt: string | null;
    nextResetAt: string | null;
}

export interface EntitlementBundle {
    plan: {
        id: string | null;
        slug: string;
        tier: PlanTier;
        name: string;
        version: number;
        isEnterprise: boolean;
    };
    subscription: {
        status: SubscriptionStatus;
        currentPeriodEnd: string | null;
        cancelAtPeriodEnd: boolean;
        graceEndsAt: string | null;
        trialEndsAt: string | null;
        daysLeftInTrial: number | null;
    };
    features: Record<string, FeatureEntitlement>;
    pages: Record<string, 'none' | 'preview' | 'locked' | 'full'>;
    menus: Record<string, MenuEntitlement>;
    wallet: WalletSnapshot;
    overrides: Array<{ id: string; kind: string; createdAt: string }>;
    userCreatedAt: string | null;
    computedAt: string;
    etag: string;
}

interface PlanRow {
    id: string;
    slug: string;
    name: string;
    tier: number;
    is_enterprise: boolean;
    version: number;
    trial_days: number;
    credits_included_monthly: number;
}

interface PlanFeatureRow {
    feature_key: string;
    is_enabled: boolean;
    limit_value: number | null;
    limit_period: 'day' | 'week' | 'month' | 'cycle' | null;
    credit_cost: number | null;
    credit_cost_default: number;
}

interface PlanPageRow {
    page_key: string;
    access_level: 'none' | 'preview' | 'locked' | 'full';
}

interface PlanMenuRow {
    menu_key: string;
    visible: boolean;
    locked_cta: string | null;
}

interface SubscriptionRow {
    id: string;
    user_id: string;
    plan_id: string;
    status: SubscriptionStatus;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
    created_at: Date;
}

interface WalletRow {
    plan_credits_balance: number;
    bonus_credits_balance: number;
    last_reset_at: Date | null;
    next_reset_at: Date | null;
}

// ============================================
// L1 CACHE (in-process)
// ============================================

const L1_TTL_MS = 60_000;

const l1Cache = new LRUCache<string, EntitlementBundle>({
    max: 10_000,
    ttl: L1_TTL_MS,
});

// ============================================
// PG NOTIFY listener — busts L1 on invalidation
// ============================================

let notifyClientStarted = false;

async function startNotifyListener(): Promise<void> {
    if (notifyClientStarted) return;
    notifyClientStarted = true;
    try {
        const client = await pool.connect();
        // Hold the client for the lifetime of the process.
        client.on('error', (err) => {
            logger.warn('[entitlement] NOTIFY client error (restarting)', { error: err.message });
            notifyClientStarted = false;
            client.release(true);
            // Retry after a short delay.
            setTimeout(() => { void startNotifyListener(); }, 2_000);
        });
        client.on('notification', (msg) => {
            if (msg.channel !== 'entitlements_invalidate') return;
            const userId = msg.payload;
            if (userId) {
                l1Cache.delete(userId);
                logger.debug('[entitlement] L1 busted via NOTIFY', { userId });
            }
        });
        await client.query('LISTEN entitlements_invalidate');
        logger.info('[entitlement] LISTEN entitlements_invalidate started');
    } catch (err) {
        notifyClientStarted = false;
        logger.warn('[entitlement] Failed to start NOTIFY listener (will retry)', {
            error: (err as Error).message,
        });
        setTimeout(() => { void startNotifyListener(); }, 5_000);
    }
}

// Fire-and-forget on module load; safe to call multiple times.
void startNotifyListener();

/**
 * Publish an invalidation so every Node process (and this process's L1)
 * forgets the cached bundle for a given user on the next call.
 */
export async function invalidateEntitlements(userId: string): Promise<void> {
    l1Cache.delete(userId);
    try {
        await query(`DELETE FROM user_entitlements_cache WHERE user_id = $1`, [userId]);
    } catch (err) {
        logger.warn('[entitlement] Failed to delete L2 cache row', {
            userId,
            error: (err as Error).message,
        });
    }
    try {
        // pg_notify payload is at most 8KB; userId is a UUID so always safe.
        await query(`SELECT pg_notify('entitlements_invalidate', $1)`, [userId]);
    } catch (err) {
        logger.warn('[entitlement] Failed to pg_notify invalidation', {
            userId,
            error: (err as Error).message,
        });
    }
    // Nudge the client via socket to refetch the bundle. emitToUser is a
    // no-op when io isn't initialized (tests, migrations) so this is safe
    // everywhere. The client bridge responds by calling refetch().
    try {
        socketService.emitToUser(userId, 'entitlements:invalidate', {
            userId,
            at: new Date().toISOString(),
        });
    } catch (err) {
        logger.warn('[entitlement] Failed to emit entitlements:invalidate', {
            userId,
            error: (err as Error).message,
        });
    }
}

/**
 * Emit a wallet delta over the socket so the client can optimistically sync
 * the credits chip without a full entitlements refetch. Call after successful
 * grant / consume / settle operations.
 */
export function emitWalletDelta(
    userId: string,
    snapshot: { planCredits: number; bonusCredits: number; total: number }
): void {
    try {
        socketService.emitToUser(userId, 'wallet:update', {
            userId,
            wallet: snapshot,
            at: new Date().toISOString(),
        });
    } catch (err) {
        logger.warn('[entitlement] Failed to emit wallet:update', {
            userId,
            error: (err as Error).message,
        });
    }
}

// ============================================
// RESOLUTION
// ============================================

const L2_TTL_MS = 5 * 60_000;

/**
 * Return a user's complete entitlement bundle.
 * Honors the three-layer cache.
 */
export async function getUserEntitlements(userId: string): Promise<EntitlementBundle> {
    // L1
    const cached = l1Cache.get(userId);
    if (cached) return cached;

    // L2 (DB)
    try {
        const l2 = await query<{
            plan_id: string | null; plan_version: number; etag: string;
            features: Record<string, FeatureEntitlement>;
            pages: Record<string, 'none' | 'preview' | 'locked' | 'full'>;
            menus: Record<string, MenuEntitlement>;
            limits: Record<string, number>;
            wallet: WalletSnapshot;
            plan: EntitlementBundle['plan'];
            subscription: EntitlementBundle['subscription'];
            overrides: EntitlementBundle['overrides'];
            computed_at: Date; expires_at: Date;
        }>(`SELECT * FROM user_entitlements_cache WHERE user_id = $1 AND expires_at > NOW() LIMIT 1`, [userId]);
        if (l2.rows.length > 0) {
            const row = l2.rows[0];
            const bundle: EntitlementBundle = {
                plan: row.plan,
                subscription: row.subscription,
                features: row.features,
                pages: row.pages,
                menus: row.menus,
                wallet: row.wallet,
                overrides: row.overrides,
                userCreatedAt: (row as any).user_created_at?.toISOString?.() ?? null,
                computedAt: row.computed_at.toISOString(),
                etag: row.etag,
            };
            l1Cache.set(userId, bundle);
            return bundle;
        }
    } catch (err) {
        // Cache table might not exist yet in some environments — fall through to compute.
        logger.debug('[entitlement] L2 lookup skipped', { error: (err as Error).message });
    }

    // L3 — compute
    const bundle = await computeEntitlements(userId);

    // Write-through to L2 and L1. L2 write is best-effort.
    // Skip L2 if user has no row in `users` table (FK constraint would reject).
    if (bundle.userCreatedAt) {
        try {
            await query(
                `INSERT INTO user_entitlements_cache
                    (user_id, plan_id, plan_version, etag, features, pages, menus, limits, wallet, plan, subscription, overrides, computed_at, expires_at)
                 VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb, NOW(), NOW() + ($13 || ' milliseconds')::interval)
                 ON CONFLICT (user_id) DO UPDATE SET
                    plan_id = EXCLUDED.plan_id,
                    plan_version = EXCLUDED.plan_version,
                    etag = EXCLUDED.etag,
                    features = EXCLUDED.features,
                    pages = EXCLUDED.pages,
                    menus = EXCLUDED.menus,
                    limits = EXCLUDED.limits,
                    wallet = EXCLUDED.wallet,
                    plan = EXCLUDED.plan,
                    subscription = EXCLUDED.subscription,
                    overrides = EXCLUDED.overrides,
                    computed_at = NOW(),
                    expires_at = NOW() + ($13 || ' milliseconds')::interval`,
                [
                    userId,
                    bundle.plan.id,
                    bundle.plan.version,
                    bundle.etag,
                    JSON.stringify(bundle.features),
                    JSON.stringify(bundle.pages),
                    JSON.stringify(bundle.menus),
                    JSON.stringify({}),
                    JSON.stringify(bundle.wallet),
                    JSON.stringify(bundle.plan),
                    JSON.stringify(bundle.subscription),
                    JSON.stringify(bundle.overrides),
                    String(L2_TTL_MS),
                ]
            );
        } catch (err) {
            logger.debug('[entitlement] L2 write skipped', { error: (err as Error).message });
        }
    }

    l1Cache.set(userId, bundle);
    return bundle;
}

/**
 * Compute an entitlement bundle from source tables.
 * Never reads cache. Writes nothing.
 */
async function computeEntitlements(userId: string): Promise<EntitlementBundle> {
    // 0. Load active admin overrides. These take priority over plan entitlements.
    //    - 'suspend' forces all features off and wallet to zero.
    //    - 'comp_plan' overlays a different plan_id for resolution.
    //    - 'extend_trial' adds days to trialEndsAt.
    //    Grant/deduct credits manifest in credit_wallets, not here.
    type OverrideRow = {
        id: string;
        kind: string;
        plan_id: string | null;
        days: number | null;
        expires_at: Date | null;
        created_at: Date;
    };
    let overrideRows: OverrideRow[] = [];
    try {
        const r = await query<OverrideRow>(
            `SELECT id, kind, plan_id, days, expires_at, created_at
               FROM admin_overrides
              WHERE user_id = $1
                AND revoked_at IS NULL
                AND (expires_at IS NULL OR expires_at > (NOW() AT TIME ZONE 'UTC'))
              ORDER BY created_at DESC`,
            [userId]
        );
        overrideRows = r.rows;
    } catch {
        // Table absent in older environments — treat as no overrides.
    }
    const isSuspended = overrideRows.some((o) => o.kind === 'suspend');
    const compPlanRow = overrideRows.find(
        (o) => o.kind === 'comp_plan' && o.plan_id
    );
    const extraTrialDays = overrideRows
        .filter((o) => o.kind === 'extend_trial' && o.days)
        .reduce((sum, o) => sum + (o.days ?? 0), 0);

    // 1. Find active subscription (if any). Prefer active over trialing over grace.
    const subRes = await query<SubscriptionRow & { grace_period_ends_at?: Date | null }>(
        `SELECT *,
                grace_period_ends_at
           FROM user_subscriptions
          WHERE user_id = $1
            AND status IN ('active', 'trialing', 'grace')
          ORDER BY
            CASE status WHEN 'active' THEN 0 WHEN 'trialing' THEN 1 WHEN 'grace' THEN 2 ELSE 3 END,
            COALESCE(current_period_end, created_at) DESC
          LIMIT 1`,
        [userId]
    );
    const activeSub = subRes.rows[0] ?? null;

    // 2. Resolve plan. comp_plan override wins over subscription plan.
    let plan: PlanRow | null = null;
    if (compPlanRow?.plan_id) {
        const pr = await query<PlanRow>(
            `SELECT id, slug, name, tier, is_enterprise, version, trial_days, credits_included_monthly
               FROM subscription_plans WHERE id = $1`,
            [compPlanRow.plan_id]
        );
        plan = pr.rows[0] ?? null;
    }
    if (!plan && activeSub) {
        const pr = await query<PlanRow>(
            `SELECT id, slug, name, tier, is_enterprise, version, trial_days, credits_included_monthly
               FROM subscription_plans WHERE id = $1`,
            [activeSub.plan_id]
        );
        plan = pr.rows[0] ?? null;
    }
    if (!plan) {
        // Fall back to Free plan (seeded slug = 'free').
        const fr = await query<PlanRow>(
            `SELECT id, slug, name, tier, is_enterprise, version, trial_days, credits_included_monthly
               FROM subscription_plans WHERE slug = 'free' LIMIT 1`
        );
        plan = fr.rows[0] ?? null;
    }

    // 2b. Fetch user creation date (needed for trial window + enforce-new gating).
    const ur = await query<{ created_at: Date }>(
        'SELECT created_at FROM users WHERE id = $1',
        [userId]
    );
    const userCreatedAt = ur.rows[0]?.created_at ?? null;

    // 3. Synthetic trial window for users who have never subscribed.
    //    Admin extend_trial overrides add days on top of the baseline.
    let trialEndsAt: Date | null = null;
    let daysLeftInTrial: number | null = null;
    if (!activeSub && plan && plan.trial_days > 0) {
        const createdAt = userCreatedAt;
        if (createdAt) {
            trialEndsAt = new Date(createdAt);
            trialEndsAt.setUTCDate(
                trialEndsAt.getUTCDate() + plan.trial_days + extraTrialDays
            );
            const now = Date.now();
            if (trialEndsAt.getTime() > now) {
                daysLeftInTrial = Math.max(
                    0,
                    Math.ceil((trialEndsAt.getTime() - now) / (24 * 60 * 60 * 1000))
                );
            } else {
                trialEndsAt = null; // expired
            }
        }
    }

    // 4. Load plan-scoped entitlements (with credit_cost_default fallback).
    let features: Record<string, FeatureEntitlement> = {};
    let pages: Record<string, 'none' | 'preview' | 'locked' | 'full'> = {};
    let menus: Record<string, MenuEntitlement> = {};

    if (plan) {
        const [fRes, pgRes, mRes] = await Promise.all([
            query<PlanFeatureRow>(
                `SELECT pf.feature_key, pf.is_enabled, pf.limit_value, pf.limit_period,
                        pf.credit_cost, fc.credit_cost_default
                   FROM plan_features pf
                   JOIN feature_catalog fc ON fc.feature_key = pf.feature_key
                  WHERE pf.plan_id = $1`,
                [plan.id]
            ),
            query<PlanPageRow>(
                `SELECT page_key, access_level FROM plan_pages WHERE plan_id = $1`,
                [plan.id]
            ),
            query<PlanMenuRow>(
                `SELECT menu_key, visible, locked_cta FROM plan_menus WHERE plan_id = $1`,
                [plan.id]
            ),
        ]);

        for (const r of fRes.rows) {
            features[r.feature_key] = {
                enabled: isSuspended ? false : r.is_enabled,
                creditCost: r.credit_cost ?? r.credit_cost_default,
                limit: r.limit_value,
                limitPeriod: r.limit_period,
                used: 0, // filled below
            };
        }
        for (const r of pgRes.rows) {
            pages[r.page_key] = isSuspended ? 'locked' : r.access_level;
        }
        for (const r of mRes.rows) {
            menus[r.menu_key] = {
                visible: r.visible,
                lockedCta: isSuspended
                    ? 'Account suspended'
                    : r.locked_cta,
            };
        }
    }

    // 5. Fill `used` counters from usage_events per period.
    const featureKeysWithLimits = Object.entries(features)
        .filter(([_, f]) => f.limit !== null && f.limitPeriod !== null)
        .map(([k]) => k);

    if (featureKeysWithLimits.length > 0) {
        // For simplicity compute a per-feature "used" in the last 24h / 7d / 30d.
        // (Precise calendar boundaries are a Sprint 2 refinement.)
        const uRes = await query<{ feature_key: string; used: string }>(
            `SELECT feature_key, COUNT(*)::text AS used
               FROM usage_events
              WHERE user_id = $1
                AND status = 'settled'
                AND feature_key = ANY($2::text[])
                AND created_at >= NOW() - INTERVAL '30 days'
              GROUP BY feature_key`,
            [userId, featureKeysWithLimits]
        );
        for (const r of uRes.rows) {
            if (features[r.feature_key]) {
                features[r.feature_key].used = parseInt(r.used, 10);
            }
        }
    }

    // 6. Wallet.
    const wRes = await query<WalletRow>(
        `SELECT plan_credits_balance, bonus_credits_balance, last_reset_at, next_reset_at
           FROM credit_wallets WHERE user_id = $1`,
        [userId]
    );
    const walletRow = wRes.rows[0];
    const wallet: WalletSnapshot = walletRow
        ? {
              planCredits: walletRow.plan_credits_balance,
              bonusCredits: walletRow.bonus_credits_balance,
              total: walletRow.plan_credits_balance + walletRow.bonus_credits_balance,
              lastResetAt: walletRow.last_reset_at?.toISOString() ?? null,
              nextResetAt: walletRow.next_reset_at?.toISOString() ?? null,
          }
        : {
              planCredits: 0,
              bonusCredits: 0,
              total: 0,
              lastResetAt: null,
              nextResetAt: null,
          };

    // 7. Build bundle.
    const status: SubscriptionStatus = activeSub
        ? activeSub.status
        : trialEndsAt
          ? 'trialing'
          : 'none';

    const bundle: EntitlementBundle = {
        plan: {
            id: plan?.id ?? null,
            slug: plan?.slug ?? 'free',
            tier: (plan?.tier ?? 0) as PlanTier,
            name: plan?.name ?? 'Free',
            version: plan?.version ?? 1,
            isEnterprise: plan?.is_enterprise ?? false,
        },
        subscription: {
            status,
            currentPeriodEnd: activeSub?.current_period_end?.toISOString() ?? null,
            cancelAtPeriodEnd: activeSub?.cancel_at_period_end ?? false,
            graceEndsAt: activeSub?.grace_period_ends_at?.toISOString() ?? null,
            trialEndsAt: trialEndsAt?.toISOString() ?? null,
            daysLeftInTrial,
        },
        features,
        pages,
        menus,
        wallet,
        overrides: overrideRows.map((o) => ({
            id: o.id,
            kind: o.kind,
            createdAt: o.created_at.toISOString(),
        })),
        userCreatedAt: userCreatedAt?.toISOString() ?? null,
        computedAt: new Date().toISOString(),
        etag: '',
    };

    bundle.etag = computeEtag(bundle);
    return bundle;
}

// ============================================
// HELPERS
// ============================================

function computeEtag(bundle: EntitlementBundle): string {
    const stable = {
        plan: bundle.plan,
        subscription: bundle.subscription,
        features: bundle.features,
        pages: bundle.pages,
        menus: bundle.menus,
        wallet: bundle.wallet,
        overrides: bundle.overrides,
    };
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(stable))
        .digest('hex')
        .slice(0, 32);
}

/**
 * Convenience check: does the user have a given feature right now?
 */
export async function canUseFeature(
    userId: string,
    featureKey: string
): Promise<{ allowed: boolean; reason: 'ok' | 'disabled' | 'no_plan' | 'limit_reached' }> {
    const ent = await getUserEntitlements(userId);
    const f = ent.features[featureKey];
    if (!f) return { allowed: false, reason: 'no_plan' };
    if (!f.enabled) return { allowed: false, reason: 'disabled' };
    if (f.limit !== null && f.used >= f.limit) return { allowed: false, reason: 'limit_reached' };
    return { allowed: true, reason: 'ok' };
}

/**
 * Convenience check: does the user's current plan meet a minimum tier?
 */
export async function meetsTier(userId: string, minTier: PlanTier): Promise<boolean> {
    const ent = await getUserEntitlements(userId);
    return ent.plan.tier >= minTier;
}

