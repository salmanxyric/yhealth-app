/**
 * Admin Billing Routes — /api/admin/billing/*
 *
 * All routes require authenticate + authorize('admin'). Every mutation is
 * audited to audit_log with actor_kind='admin'. Override mutations call
 * invalidateEntitlements() so the client sees the effect within seconds.
 *
 * NO frontend trust. These endpoints are the only way to grant credits,
 * comp plans, suspend accounts, or edit entitlement matrices outside Stripe.
 */

import { Router, type Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { query, transaction } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { grantCredits } from '../services/credit.service.js';
import { invalidateEntitlements } from '../services/entitlement.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(authenticate, authorize('admin'));

// ============================================
// Audit helper
// ============================================

async function writeAudit(opts: {
    actorUserId: string;
    entityType: string;
    entityId?: string | null;
    action: string;
    before?: unknown;
    after?: unknown;
    requestId?: string | null;
}): Promise<void> {
    try {
        await query(
            `INSERT INTO audit_log
                (actor_user_id, actor_kind, entity_type, entity_id,
                 action, before, after, request_id)
             VALUES ($1, 'admin', $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
            [
                opts.actorUserId,
                opts.entityType,
                opts.entityId ?? null,
                opts.action,
                opts.before ? JSON.stringify(opts.before) : null,
                opts.after ? JSON.stringify(opts.after) : null,
                opts.requestId ?? null,
            ]
        );
    } catch (err) {
        logger.warn('[admin-billing] audit write failed', {
            action: opts.action,
            error: (err as Error).message,
        });
    }
}

// ============================================
// POST /api/admin/billing/grant-credits
// ============================================

router.post(
    '/grant-credits',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { userId, amount, bucket = 'bonus', reason } = req.body ?? {};
        if (!userId || typeof userId !== 'string') {
            throw ApiError.badRequest('userId required');
        }
        const amt = Math.ceil(Number(amount));
        if (!Number.isFinite(amt) || amt <= 0) {
            throw ApiError.badRequest('amount must be positive');
        }
        if (bucket !== 'plan' && bucket !== 'bonus') {
            throw ApiError.badRequest("bucket must be 'plan' or 'bonus'");
        }
        const reasonText = typeof reason === 'string' ? reason.slice(0, 200) : 'admin_grant';

        await grantCredits({
            userId,
            amount: amt,
            bucket,
            reason: `admin:${reasonText}`,
            kind: 'grant',
            idempotencyKey: `admin:grant:${adminId}:${userId}:${Date.now()}`,
            metadata: { actor_admin_id: adminId, reason: reasonText },
        });

        const { rows: [override] } = await query<{ id: string }>(
            `INSERT INTO admin_overrides (
                user_id, kind, credits_delta, reason, created_by
             ) VALUES ($1, 'grant_credits', $2, $3, $4)
             RETURNING id`,
            [userId, amt, reasonText, adminId]
        );

        await writeAudit({
            actorUserId: adminId,
            entityType: 'credit_wallet',
            entityId: userId,
            action: 'admin.grant_credits',
            after: { amount: amt, bucket, reason: reasonText },
        });
        await invalidateEntitlements(userId);

        ApiResponse.success(res, { overrideId: override.id });
    })
);

// ============================================
// POST /api/admin/billing/deduct-credits
// ============================================

router.post(
    '/deduct-credits',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { userId, amount, reason } = req.body ?? {};
        if (!userId || typeof userId !== 'string') {
            throw ApiError.badRequest('userId required');
        }
        const amt = Math.ceil(Number(amount));
        if (!Number.isFinite(amt) || amt <= 0) {
            throw ApiError.badRequest('amount must be positive');
        }
        const reasonText = typeof reason === 'string' ? reason.slice(0, 200) : 'admin_deduct';

        // Deduct from bonus first, then plan — opposite of consume order.
        // Capped at available balance; shortfall is tolerated.
        await transaction(async (client) => {
            await client.query(
                `UPDATE credit_wallets
                    SET bonus_credits_balance = GREATEST(0, bonus_credits_balance - LEAST(bonus_credits_balance, $2::int)),
                        plan_credits_balance  = GREATEST(0, plan_credits_balance
                                                        - LEAST(plan_credits_balance,
                                                                GREATEST($2::int - bonus_credits_balance, 0::int))),
                        version               = version + 1,
                        updated_at            = NOW() AT TIME ZONE 'UTC'
                  WHERE user_id = $1::uuid`,
                [userId, amt]
            );
            await client.query(
                `INSERT INTO credit_transactions
                    (user_id, delta, bucket, kind, reason, idempotency_key,
                     balance_after_plan, balance_after_bonus, metadata)
                 SELECT $1::uuid, -$2::int, 'plan', 'adjustment', $3,
                        'admin:deduct:' || $4 || ':' || $1 || ':' || extract(epoch from NOW())::bigint,
                        w.plan_credits_balance, w.bonus_credits_balance,
                        $5::jsonb
                   FROM credit_wallets w WHERE w.user_id = $1::uuid`,
                [userId, amt, `admin:${reasonText}`, adminId,
                 JSON.stringify({ actor_admin_id: adminId })]
            );
        });

        const { rows: [override] } = await query<{ id: string }>(
            `INSERT INTO admin_overrides (
                user_id, kind, credits_delta, reason, created_by
             ) VALUES ($1, 'deduct_credits', $2, $3, $4)
             RETURNING id`,
            [userId, -amt, reasonText, adminId]
        );

        await writeAudit({
            actorUserId: adminId,
            entityType: 'credit_wallet',
            entityId: userId,
            action: 'admin.deduct_credits',
            after: { amount: -amt, reason: reasonText },
        });
        await invalidateEntitlements(userId);

        ApiResponse.success(res, { overrideId: override.id });
    })
);

// ============================================
// POST /api/admin/billing/extend-trial
// ============================================

router.post(
    '/extend-trial',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { userId, days, reason } = req.body ?? {};
        if (!userId || typeof userId !== 'string') {
            throw ApiError.badRequest('userId required');
        }
        const d = Math.ceil(Number(days));
        if (!Number.isFinite(d) || d <= 0 || d > 365) {
            throw ApiError.badRequest('days must be 1..365');
        }
        const reasonText = typeof reason === 'string' ? reason.slice(0, 200) : 'admin_extend_trial';

        const { rows: [override] } = await query<{ id: string }>(
            `INSERT INTO admin_overrides (
                user_id, kind, days, reason, created_by
             ) VALUES ($1, 'extend_trial', $2, $3, $4)
             RETURNING id`,
            [userId, d, reasonText, adminId]
        );

        await writeAudit({
            actorUserId: adminId,
            entityType: 'subscription',
            entityId: userId,
            action: 'admin.extend_trial',
            after: { days: d, reason: reasonText },
        });
        await invalidateEntitlements(userId);

        ApiResponse.success(res, { overrideId: override.id });
    })
);

// ============================================
// POST /api/admin/billing/comp-plan
// ============================================

router.post(
    '/comp-plan',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { userId, planId, days, reason } = req.body ?? {};
        if (!userId || !planId) {
            throw ApiError.badRequest('userId + planId required');
        }
        const d = days ? Math.ceil(Number(days)) : null;
        if (d !== null && (!Number.isFinite(d) || d <= 0 || d > 730)) {
            throw ApiError.badRequest('days must be 1..730 if provided');
        }
        const reasonText = typeof reason === 'string' ? reason.slice(0, 200) : 'admin_comp_plan';

        // Validate plan exists.
        const planCheck = await query<{ id: string }>(
            `SELECT id FROM subscription_plans WHERE id = $1 LIMIT 1`,
            [planId]
        );
        if (!planCheck.rows[0]) throw ApiError.badRequest('Plan not found');

        const expiresAt = d ? `(NOW() AT TIME ZONE 'UTC') + (${d} || ' days')::interval` : 'NULL';

        const { rows: [override] } = await query<{ id: string }>(
            `INSERT INTO admin_overrides (
                user_id, kind, plan_id, days, reason, created_by, expires_at
             ) VALUES ($1, 'comp_plan', $2, $3, $4, $5, ${expiresAt}::timestamptz)
             RETURNING id`,
            [userId, planId, d, reasonText, adminId]
        );

        await writeAudit({
            actorUserId: adminId,
            entityType: 'subscription',
            entityId: userId,
            action: 'admin.comp_plan',
            after: { planId, days: d, reason: reasonText },
        });
        await invalidateEntitlements(userId);

        ApiResponse.success(res, { overrideId: override.id });
    })
);

// ============================================
// POST /api/admin/billing/suspend   POST /api/admin/billing/unsuspend
// ============================================

router.post(
    '/suspend',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { userId, reason } = req.body ?? {};
        if (!userId) throw ApiError.badRequest('userId required');
        const reasonText = typeof reason === 'string' ? reason.slice(0, 200) : 'admin_suspend';

        const { rows: [override] } = await query<{ id: string }>(
            `INSERT INTO admin_overrides (user_id, kind, reason, created_by)
             VALUES ($1, 'suspend', $2, $3)
             RETURNING id`,
            [userId, reasonText, adminId]
        );
        await writeAudit({
            actorUserId: adminId,
            entityType: 'user',
            entityId: userId,
            action: 'admin.suspend',
            after: { reason: reasonText },
        });
        await invalidateEntitlements(userId);

        ApiResponse.success(res, { overrideId: override.id });
    })
);

router.post(
    '/unsuspend',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { userId, reason } = req.body ?? {};
        if (!userId) throw ApiError.badRequest('userId required');
        const reasonText = typeof reason === 'string' ? reason.slice(0, 200) : 'admin_unsuspend';

        // Revoke all active suspend overrides.
        await query(
            `UPDATE admin_overrides
                SET revoked_at = NOW() AT TIME ZONE 'UTC',
                    revoked_by = $2
              WHERE user_id = $1
                AND kind = 'suspend'
                AND revoked_at IS NULL`,
            [userId, adminId]
        );
        await query(
            `INSERT INTO admin_overrides (user_id, kind, reason, created_by)
             VALUES ($1, 'unsuspend', $2, $3)`,
            [userId, reasonText, adminId]
        );
        await writeAudit({
            actorUserId: adminId,
            entityType: 'user',
            entityId: userId,
            action: 'admin.unsuspend',
            after: { reason: reasonText },
        });
        await invalidateEntitlements(userId);

        ApiResponse.success(res, { ok: true });
    })
);

// ============================================
// GET /api/admin/billing/overrides?userId=...
// ============================================

router.get(
    '/overrides',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
        const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);

        const where = userId ? 'WHERE user_id = $1' : '';
        const params = userId ? [userId, limit] : [limit];
        const limitParam = userId ? '$2' : '$1';

        const r = await query<{
            id: string;
            user_id: string;
            kind: string;
            plan_id: string | null;
            credits_delta: number | null;
            days: number | null;
            reason: string;
            effective_at: Date;
            expires_at: Date | null;
            revoked_at: Date | null;
            created_by: string | null;
            created_at: Date;
        }>(
            `SELECT id, user_id, kind, plan_id, credits_delta, days, reason,
                    effective_at, expires_at, revoked_at, created_by, created_at
               FROM admin_overrides
               ${where}
              ORDER BY created_at DESC
              LIMIT ${limitParam}`,
            params
        );

        ApiResponse.success(res, {
            overrides: r.rows.map((o) => ({
                id: o.id,
                userId: o.user_id,
                kind: o.kind,
                planId: o.plan_id,
                creditsDelta: o.credits_delta,
                days: o.days,
                reason: o.reason,
                effectiveAt: o.effective_at.toISOString(),
                expiresAt: o.expires_at?.toISOString() ?? null,
                revokedAt: o.revoked_at?.toISOString() ?? null,
                createdBy: o.created_by,
                createdAt: o.created_at.toISOString(),
            })),
        });
    })
);

router.post(
    '/overrides/:id/revoke',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const overrideId = req.params.id;

        const r = await query<{ user_id: string; kind: string }>(
            `UPDATE admin_overrides
                SET revoked_at = NOW() AT TIME ZONE 'UTC',
                    revoked_by = $2
              WHERE id = $1
                AND revoked_at IS NULL
              RETURNING user_id, kind`,
            [overrideId, adminId]
        );
        if (r.rowCount === 0) {
            throw ApiError.notFound('Override not found or already revoked');
        }

        await writeAudit({
            actorUserId: adminId,
            entityType: 'admin_override',
            entityId: overrideId,
            action: 'admin.override.revoke',
            after: { kind: r.rows[0].kind },
        });
        await invalidateEntitlements(r.rows[0].user_id);

        ApiResponse.success(res, { ok: true });
    })
);

// ============================================
// PROMO CODES — CRUD
// ============================================

router.get(
    '/promo-codes',
    asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
        const r = await query(
            `SELECT id, code, kind, credits_granted, discount_percent, discount_cents,
                    max_redemptions, redemption_count, per_user_limit,
                    starts_at, expires_at, is_active, created_at
               FROM promo_codes
              ORDER BY created_at DESC
              LIMIT 200`
        );
        ApiResponse.success(res, { promos: r.rows });
    })
);

router.post(
    '/promo-codes',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const {
            code, kind = 'credit_grant', creditsGranted = 0,
            discountPercent, discountCents,
            maxRedemptions, perUserLimit = 1, expiresAt,
        } = req.body ?? {};

        if (!code || typeof code !== 'string') throw ApiError.badRequest('code required');
        const normalized = code.trim().toUpperCase();

        const r = await query<{ id: string }>(
            `INSERT INTO promo_codes (
                code, kind, credits_granted, discount_percent, discount_cents,
                max_redemptions, per_user_limit, expires_at, created_by
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [
                normalized, kind,
                Number(creditsGranted) || 0,
                discountPercent ?? null,
                discountCents ?? null,
                maxRedemptions ?? null,
                Number(perUserLimit) || 1,
                expiresAt ? new Date(expiresAt) : null,
                adminId,
            ]
        );
        await writeAudit({
            actorUserId: adminId,
            entityType: 'promo_code',
            entityId: r.rows[0].id,
            action: 'admin.promo.create',
            after: { code: normalized, kind },
        });
        ApiResponse.success(res, { id: r.rows[0].id, code: normalized });
    })
);

router.patch(
    '/promo-codes/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { id } = req.params;
        const { isActive, expiresAt, maxRedemptions } = req.body ?? {};

        await query(
            `UPDATE promo_codes
                SET is_active      = COALESCE($2, is_active),
                    expires_at     = COALESCE($3::timestamptz, expires_at),
                    max_redemptions= COALESCE($4, max_redemptions),
                    updated_at     = NOW() AT TIME ZONE 'UTC'
              WHERE id = $1`,
            [
                id,
                typeof isActive === 'boolean' ? isActive : null,
                expiresAt ? new Date(expiresAt) : null,
                typeof maxRedemptions === 'number' ? maxRedemptions : null,
            ]
        );
        await writeAudit({
            actorUserId: adminId,
            entityType: 'promo_code',
            entityId: id,
            action: 'admin.promo.update',
            after: { isActive, expiresAt, maxRedemptions },
        });
        ApiResponse.success(res, { ok: true });
    })
);

// ============================================
// ENTITLEMENT MATRIX — read + update
// ============================================

/**
 * GET /api/admin/billing/matrix
 * Returns every plan + catalog row + existing plan_features / plan_pages / plan_menus
 * in a single payload so the EntityMatrix UI can render without N+1 fetches.
 */
router.get(
    '/matrix',
    asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
        const [plansRes, featuresRes, pagesRes, menusRes, pfRes, ppRes, pmRes] =
            await Promise.all([
                query(`SELECT id, slug, name, tier, is_enterprise, version,
                              credits_included_monthly, amount_cents, interval,
                              is_public, trial_days
                         FROM subscription_plans ORDER BY tier ASC, sort_order ASC`),
                query(`SELECT feature_key, label, category, credit_cost_default
                         FROM feature_catalog ORDER BY category, feature_key`),
                query(`SELECT page_key, label, is_public
                         FROM page_catalog ORDER BY page_key`),
                query(`SELECT menu_key, label, section, sort_order
                         FROM menu_catalog ORDER BY section, sort_order`),
                query(`SELECT plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost
                         FROM plan_features`),
                query(`SELECT plan_id, page_key, access_level FROM plan_pages`),
                query(`SELECT plan_id, menu_key, visible, locked_cta FROM plan_menus`),
            ]);

        ApiResponse.success(res, {
            plans: plansRes.rows,
            featureCatalog: featuresRes.rows,
            pageCatalog: pagesRes.rows,
            menuCatalog: menusRes.rows,
            planFeatures: pfRes.rows,
            planPages: ppRes.rows,
            planMenus: pmRes.rows,
        });
    })
);

/**
 * PATCH /api/admin/billing/plan-features
 * Body: { planId, featureKey, isEnabled?, limit?, limitPeriod?, creditCost? }
 * Upserts one cell of the plan_features matrix.
 */
router.patch(
    '/plan-features',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { planId, featureKey, isEnabled, limit, limitPeriod, creditCost } = req.body ?? {};
        if (!planId || !featureKey) {
            throw ApiError.badRequest('planId + featureKey required');
        }

        await query(
            `INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (plan_id, feature_key) DO UPDATE SET
                is_enabled   = COALESCE(EXCLUDED.is_enabled,   plan_features.is_enabled),
                limit_value  = EXCLUDED.limit_value,
                limit_period = EXCLUDED.limit_period,
                credit_cost  = EXCLUDED.credit_cost`,
            [
                planId, featureKey,
                typeof isEnabled === 'boolean' ? isEnabled : true,
                typeof limit === 'number' ? limit : null,
                typeof limitPeriod === 'string' ? limitPeriod : null,
                typeof creditCost === 'number' ? creditCost : null,
            ]
        );

        // Bump plan version so entitlement caches bust via plan.version mismatch.
        await query(
            `UPDATE subscription_plans
                SET version = version + 1,
                    updated_at = NOW() AT TIME ZONE 'UTC'
              WHERE id = $1`,
            [planId]
        );

        await writeAudit({
            actorUserId: adminId,
            entityType: 'plan_feature',
            entityId: `${planId}:${featureKey}`,
            action: 'admin.plan_feature.update',
            after: { isEnabled, limit, limitPeriod, creditCost },
        });

        // Invalidate ALL users on this plan by iterating active subscriptions.
        // For small tenant counts this is cheap; when it gets heavy we'll move
        // to a version-based cache-key scheme that expires on plan_version bump.
        const users = await query<{ user_id: string }>(
            `SELECT user_id FROM user_subscriptions
              WHERE plan_id = $1 AND status IN ('active','trialing','grace','past_due')`,
            [planId]
        );
        for (const u of users.rows) {
            await invalidateEntitlements(u.user_id);
        }

        ApiResponse.success(res, { ok: true, usersInvalidated: users.rowCount });
    })
);

/**
 * PATCH /api/admin/billing/plan-pages
 * Body: { planId, pageKey, accessLevel }
 */
router.patch(
    '/plan-pages',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { planId, pageKey, accessLevel } = req.body ?? {};
        if (!planId || !pageKey || !accessLevel) {
            throw ApiError.badRequest('planId + pageKey + accessLevel required');
        }
        if (!['none', 'preview', 'locked', 'full'].includes(accessLevel)) {
            throw ApiError.badRequest('accessLevel must be one of none|preview|locked|full');
        }
        await query(
            `INSERT INTO plan_pages (plan_id, page_key, access_level)
             VALUES ($1, $2, $3)
             ON CONFLICT (plan_id, page_key) DO UPDATE SET access_level = EXCLUDED.access_level`,
            [planId, pageKey, accessLevel]
        );
        await query(
            `UPDATE subscription_plans SET version = version + 1 WHERE id = $1`,
            [planId]
        );
        await writeAudit({
            actorUserId: adminId,
            entityType: 'plan_page',
            entityId: `${planId}:${pageKey}`,
            action: 'admin.plan_page.update',
            after: { accessLevel },
        });
        ApiResponse.success(res, { ok: true });
    })
);

/**
 * PATCH /api/admin/billing/plan-menus
 * Body: { planId, menuKey, visible, lockedCta? }
 */
router.patch(
    '/plan-menus',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { planId, menuKey, visible, lockedCta } = req.body ?? {};
        if (!planId || !menuKey) {
            throw ApiError.badRequest('planId + menuKey required');
        }
        await query(
            `INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (plan_id, menu_key) DO UPDATE SET
                visible    = EXCLUDED.visible,
                locked_cta = EXCLUDED.locked_cta`,
            [
                planId, menuKey,
                typeof visible === 'boolean' ? visible : true,
                typeof lockedCta === 'string' ? lockedCta : null,
            ]
        );
        await query(
            `UPDATE subscription_plans SET version = version + 1 WHERE id = $1`,
            [planId]
        );
        await writeAudit({
            actorUserId: adminId,
            entityType: 'plan_menu',
            entityId: `${planId}:${menuKey}`,
            action: 'admin.plan_menu.update',
            after: { visible, lockedCta },
        });
        ApiResponse.success(res, { ok: true });
    })
);

// ============================================
// ABUSE SIGNALS + AUDIT LOG — read
// ============================================

router.get(
    '/abuse-signals',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const unreviewedOnly = req.query.unreviewedOnly === 'true';
        const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '100'), 10) || 100, 1), 500);

        const r = await query<{
            id: string;
            user_id: string;
            signal_kind: string;
            score: number;
            evidence: Record<string, unknown>;
            reviewed_at: Date | null;
            action_taken: string | null;
            created_at: Date;
        }>(
            `SELECT id, user_id, signal_kind, score, evidence,
                    reviewed_at, action_taken, created_at
               FROM abuse_signals
               ${unreviewedOnly ? 'WHERE reviewed_at IS NULL' : ''}
              ORDER BY created_at DESC, score DESC
              LIMIT $1`,
            [limit]
        );

        ApiResponse.success(res, {
            signals: r.rows.map((s) => ({
                id: s.id,
                userId: s.user_id,
                signalKind: s.signal_kind,
                score: s.score,
                evidence: s.evidence,
                reviewedAt: s.reviewed_at?.toISOString() ?? null,
                actionTaken: s.action_taken,
                createdAt: s.created_at.toISOString(),
            })),
        });
    })
);

router.post(
    '/abuse-signals/:id/review',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const adminId = req.user!.userId;
        const { id } = req.params;
        const actionTaken = typeof req.body?.actionTaken === 'string'
            ? req.body.actionTaken.slice(0, 60)
            : null;

        await query(
            `UPDATE abuse_signals
                SET reviewed_at  = NOW() AT TIME ZONE 'UTC',
                    reviewed_by  = $2,
                    action_taken = $3
              WHERE id = $1`,
            [id, adminId, actionTaken]
        );
        await writeAudit({
            actorUserId: adminId,
            entityType: 'abuse_signal',
            entityId: id,
            action: 'admin.abuse_signal.review',
            after: { actionTaken },
        });
        ApiResponse.success(res, { ok: true });
    })
);

router.get(
    '/audit',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = typeof req.query.userId === 'string' ? req.query.userId : null;
        const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '100'), 10) || 100, 1), 500);

        const where = userId
            ? `WHERE actor_user_id = $1 OR entity_id = $1`
            : '';
        const params = userId ? [userId, limit] : [limit];
        const limitParam = userId ? '$2' : '$1';

        const r = await query<{
            id: string;
            actor_user_id: string | null;
            actor_kind: string;
            entity_type: string;
            entity_id: string | null;
            action: string;
            before: Record<string, unknown> | null;
            after: Record<string, unknown> | null;
            created_at: Date;
        }>(
            `SELECT id, actor_user_id, actor_kind, entity_type, entity_id,
                    action, before, after, created_at
               FROM audit_log
               ${where}
              ORDER BY created_at DESC
              LIMIT ${limitParam}`,
            params
        );

        ApiResponse.success(res, {
            entries: r.rows.map((row) => ({
                id: row.id,
                actorUserId: row.actor_user_id,
                actorKind: row.actor_kind,
                entityType: row.entity_type,
                entityId: row.entity_id,
                action: row.action,
                before: row.before,
                after: row.after,
                createdAt: row.created_at.toISOString(),
            })),
        });
    })
);

// ============================================
// ANALYTICS — MRR, ARPU, churn, credit burn, cohort
// ============================================

router.get(
    '/analytics',
    asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
        const [
            mrrRow,
            activeCountRow,
            trialingCountRow,
            canceledLast30,
            createdLast30,
            creditBurnRow,
            newByDayRows,
            statusBreakdownRows,
            planBreakdownRows,
        ] = await Promise.all([
            query<{ mrr_cents: string; active: string }>(
                `SELECT COALESCE(SUM(sp.amount_cents), 0)::text AS mrr_cents,
                        COUNT(*)::text AS active
                   FROM user_subscriptions us
                   JOIN subscription_plans sp ON sp.id = us.plan_id
                  WHERE us.status IN ('active','trialing')
                    AND sp.amount_cents > 0`
            ),
            query<{ n: string }>(
                `SELECT COUNT(*)::text AS n FROM user_subscriptions WHERE status = 'active'`
            ),
            query<{ n: string }>(
                `SELECT COUNT(*)::text AS n FROM user_subscriptions WHERE status = 'trialing'`
            ),
            query<{ n: string }>(
                `SELECT COUNT(*)::text AS n FROM user_subscriptions
                  WHERE canceled_at IS NOT NULL
                    AND canceled_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days'`
            ),
            query<{ n: string }>(
                `SELECT COUNT(*)::text AS n FROM user_subscriptions
                  WHERE created_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days'
                    AND status IN ('active','trialing','past_due','grace')`
            ),
            query<{ reserved: string; consumed: string }>(
                `SELECT
                    COALESCE(SUM(CASE WHEN kind='reserve' THEN -delta ELSE 0 END), 0)::text AS reserved,
                    COALESCE(SUM(CASE WHEN kind IN ('consume','settle') AND delta < 0 THEN -delta ELSE 0 END), 0)::text AS consumed
                   FROM credit_transactions
                  WHERE created_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days'`
            ),
            query<{ d: Date; n: string }>(
                `SELECT date_trunc('day', created_at) AS d, COUNT(*)::text AS n
                   FROM user_subscriptions
                  WHERE created_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days'
                  GROUP BY 1 ORDER BY 1 ASC`
            ),
            query<{ status: string; n: string }>(
                `SELECT status, COUNT(*)::text AS n FROM user_subscriptions GROUP BY status`
            ),
            query<{ plan_name: string; n: string; mrr: string }>(
                `SELECT sp.name AS plan_name,
                        COUNT(us.id)::text AS n,
                        COALESCE(SUM(sp.amount_cents), 0)::text AS mrr
                   FROM user_subscriptions us
                   JOIN subscription_plans sp ON sp.id = us.plan_id
                  WHERE us.status IN ('active','trialing')
                  GROUP BY sp.name
                  ORDER BY mrr DESC`
            ),
        ]);

        const mrrCents = parseInt(mrrRow.rows[0]?.mrr_cents ?? '0', 10);
        const active = parseInt(activeCountRow.rows[0]?.n ?? '0', 10);
        const trialing = parseInt(trialingCountRow.rows[0]?.n ?? '0', 10);
        const churnedLast30 = parseInt(canceledLast30.rows[0]?.n ?? '0', 10);
        const newLast30 = parseInt(createdLast30.rows[0]?.n ?? '0', 10);
        const denominatorForChurn = active + churnedLast30;
        const monthlyChurn =
            denominatorForChurn > 0 ? churnedLast30 / denominatorForChurn : 0;
        const arpuCents = active > 0 ? Math.round(mrrCents / active) : 0;
        const arrCents = mrrCents * 12;

        ApiResponse.success(res, {
            summary: {
                mrrCents,
                arrCents,
                arpuCents,
                activeSubscriptions: active,
                trialingSubscriptions: trialing,
                newLast30,
                churnedLast30,
                monthlyChurnRate: +monthlyChurn.toFixed(4),
            },
            creditBurn30d: {
                reserved: parseInt(creditBurnRow.rows[0]?.reserved ?? '0', 10),
                consumed: parseInt(creditBurnRow.rows[0]?.consumed ?? '0', 10),
            },
            newSubscriptionsByDay: newByDayRows.rows.map((r) => ({
                day: r.d.toISOString().slice(0, 10),
                count: parseInt(r.n, 10),
            })),
            statusBreakdown: statusBreakdownRows.rows.map((r) => ({
                status: r.status,
                count: parseInt(r.n, 10),
            })),
            planBreakdown: planBreakdownRows.rows.map((r) => ({
                planName: r.plan_name,
                count: parseInt(r.n, 10),
                mrrCents: parseInt(r.mrr, 10),
            })),
        });
    })
);

export default router;
