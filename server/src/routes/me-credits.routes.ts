/**
 * /me/credits — user-facing wallet + ledger read endpoints.
 * /me/promos  — user-facing promo redemption.
 *
 * Mounted under /api/me/... (paired with entitlements.routes.ts). These are
 * thin read handlers for the billing UI shipped in Sprint 3.
 */

import { Router, type Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { query, transaction } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';
import { grantCredits } from '../services/credit.service.js';
import { invalidateEntitlements } from '../services/entitlement.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ============================================
// GET /api/me/credits/ledger
// ============================================

router.get(
    '/credits/ledger',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) throw ApiError.unauthorized();

        const limitRaw = parseInt(String(req.query.limit ?? '20'), 10);
        const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);

        const r = await query<{
            id: string;
            created_at: Date;
            delta: number;
            bucket: 'plan' | 'bonus';
            kind: string;
            reason: string;
            feature_key: string | null;
            balance_after_plan: number;
            balance_after_bonus: number;
        }>(
            `SELECT id, created_at, delta, bucket, kind, reason,
                    feature_key, balance_after_plan, balance_after_bonus
               FROM credit_transactions
              WHERE user_id = $1
              ORDER BY created_at DESC
              LIMIT $2`,
            [userId, limit]
        );

        ApiResponse.success(res, {
            entries: r.rows.map((row) => ({
                id: row.id,
                createdAt: row.created_at.toISOString(),
                delta: row.delta,
                bucket: row.bucket,
                kind: row.kind,
                reason: row.reason,
                featureKey: row.feature_key,
                balanceAfterPlan: row.balance_after_plan,
                balanceAfterBonus: row.balance_after_bonus,
            })),
        });
    })
);

// ============================================
// POST /api/me/promos/redeem
// ============================================

router.post(
    '/promos/redeem',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) throw ApiError.unauthorized();

        const rawCode = (req.body?.code ?? '').toString().trim().toUpperCase();
        if (!rawCode || rawCode.length > 60) {
            throw ApiError.badRequest('Invalid promo code');
        }

        const result = await transaction(async (client) => {
            // Lock the promo row to prevent double-redeems under concurrency.
            const pr = await client.query<{
                id: string;
                kind: string;
                credits_granted: number;
                max_redemptions: number | null;
                redemption_count: number;
                per_user_limit: number;
                starts_at: Date;
                expires_at: Date | null;
                is_active: boolean;
            }>(
                `SELECT id, kind, credits_granted, max_redemptions, redemption_count,
                        per_user_limit, starts_at, expires_at, is_active
                   FROM promo_codes
                  WHERE code = $1
                  FOR UPDATE`,
                [rawCode]
            );
            const promo = pr.rows[0];
            if (!promo) return { ok: false, reason: 'not_found' as const };
            if (!promo.is_active) return { ok: false, reason: 'inactive' as const };

            const now = new Date();
            if (promo.starts_at > now) return { ok: false, reason: 'not_started' as const };
            if (promo.expires_at && promo.expires_at < now) {
                return { ok: false, reason: 'expired' as const };
            }
            if (
                promo.max_redemptions !== null &&
                promo.redemption_count >= promo.max_redemptions
            ) {
                return { ok: false, reason: 'max_redemptions' as const };
            }

            // Per-user limit.
            const used = await client.query<{ n: string }>(
                `SELECT COUNT(*)::text AS n FROM promo_redemptions
                  WHERE promo_code_id = $1 AND user_id = $2`,
                [promo.id, userId]
            );
            if (parseInt(used.rows[0].n, 10) >= promo.per_user_limit) {
                return { ok: false, reason: 'already_redeemed' as const };
            }

            // Record redemption.
            await client.query(
                `INSERT INTO promo_redemptions (promo_code_id, user_id, credits_granted)
                 VALUES ($1, $2, $3)`,
                [promo.id, userId, promo.credits_granted]
            );
            await client.query(
                `UPDATE promo_codes
                    SET redemption_count = redemption_count + 1,
                        updated_at       = NOW() AT TIME ZONE 'UTC'
                  WHERE id = $1`,
                [promo.id]
            );

            return {
                ok: true as const,
                grantedCredits: promo.credits_granted,
                kind: promo.kind,
            };
        });

        if (!result.ok) {
            const messages: Record<string, string> = {
                not_found: 'Promo code is not valid',
                inactive: 'This promo code is no longer active',
                not_started: 'This promo code is not yet active',
                expired: 'This promo code has expired',
                max_redemptions: 'This promo code has reached its limit',
                already_redeemed: 'You have already redeemed this promo code',
            };
            throw ApiError.badRequest(messages[result.reason] ?? 'Promo redemption failed');
        }

        // Apply the grant side-effect outside the promo transaction.
        if (result.kind === 'credit_grant' && result.grantedCredits > 0) {
            try {
                await grantCredits({
                    userId,
                    amount: result.grantedCredits,
                    bucket: 'bonus',
                    reason: `promo:${rawCode}`,
                    kind: 'grant',
                    idempotencyKey: `promo:${userId}:${rawCode}`,
                });
            } catch (err) {
                logger.error('[promo] Failed to grant credits after redemption', {
                    userId,
                    code: rawCode,
                    error: (err as Error).message,
                });
                // Do not unwind the redemption — operator can reconcile via audit.
            }
        }

        await invalidateEntitlements(userId);

        ApiResponse.success(res, {
            grantedCredits: result.grantedCredits,
        });
    })
);

export default router;
