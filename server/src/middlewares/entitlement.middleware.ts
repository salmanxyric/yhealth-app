/**
 * Entitlement Middleware Stack
 *
 * Middleware chain applied in front of every AI endpoint:
 *
 *   authenticate
 *     → requestIdMiddleware
 *     → requireFeature(featureKey)
 *     → requireFeatureLimit(featureKey, { period })
 *     → consumeCredits(featureKey, estimator)
 *     → auditAction(...)
 *     → handler
 *
 * Enforcement is gated by ENTITLEMENT_ENFORCEMENT_MODE env var:
 *   - 'shadow'      → log would-be-denials, always next()
 *   - 'enforce-new' → enforce for users created after ROLLOUT_START
 *   - 'enforce-all' → enforce for every authenticated caller
 *
 * NO frontend trust. The server is the sole source of truth. Every response
 * to a blocked action returns HTTP 402/403/429 with a machine-readable `code`
 * so the client error boundary can open the correct paywall.
 *
 * Idempotency: every consumeCredits call REQUIRES an `Idempotency-Key` header.
 * Missing → 400 `MISSING_IDEMPOTENCY_KEY`.
 */

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../services/logger.service.js';
import { env } from '../config/env.config.js';
import type { AuthenticatedRequest } from '../types/index.js';
import {
    getUserEntitlements,
    type EntitlementBundle,
    type PlanTier,
} from '../services/entitlement.service.js';
import {
    reserveCredits,
    settleCredits,
    releaseCredits,
} from '../services/credit.service.js';
import { query } from '../config/database.config.js';
import { countTokens } from '../utils/tokenCounter.js';

// ============================================
// SHADOW-MODE GATING
// ============================================

/**
 * Returns `true` when the request should be blocked on a denial, `false` when
 * the denial should be logged-only (shadow mode).
 */
function shouldEnforce(_req: AuthenticatedRequest, bundle: EntitlementBundle | null): boolean {
    const mode = env.entitlement.mode;
    if (mode === 'enforce-all') return true;
    if (mode === 'shadow') return false;
    // enforce-new: apply only to users whose account was created after ROLLOUT_START.
    if (!env.entitlement.rolloutStart || !bundle?.userCreatedAt) return false;
    try {
        const cutoff = new Date(env.entitlement.rolloutStart);
        const created = new Date(bundle.userCreatedAt);
        return created >= cutoff;
    } catch {
        return false;
    }
}

let shadowLogTableAvailable: boolean | null = null;

async function hasShadowLogTable(): Promise<boolean> {
    if (shadowLogTableAvailable !== null) return shadowLogTableAvailable;
    try {
        const result = await query<{ table_name: string | null }>(
            `SELECT to_regclass('public.entitlement_shadow_log')::text AS table_name`
        );
        shadowLogTableAvailable = Boolean(result.rows[0]?.table_name);
    } catch (err) {
        shadowLogTableAvailable = false;
        logger.debug('[entitlement] shadow log availability check failed', {
            error: err instanceof Error ? err.message : 'Unknown error',
        });
    }
    return shadowLogTableAvailable;
}

async function persistShadowDenial(
    userId: string,
    featureKey: string,
    reason: string,
    path: string,
    method: string,
    extra: Record<string, unknown>
): Promise<void> {
    if (!(await hasShadowLogTable())) return;
    try {
        await query(
            `INSERT INTO entitlement_shadow_log (user_id, feature_key, reason, path, method, extra)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
            [userId, featureKey, reason, path, method, JSON.stringify(extra)]
        );
    } catch (err: any) {
        if (err?.code === '42P01' || String(err?.message || '').includes('entitlement_shadow_log')) {
            shadowLogTableAvailable = false;
            logger.debug('[entitlement] shadow log table missing; skipping persistence');
            return;
        }
        logger.warn('[entitlement] failed to persist shadow denial', {
            error: err instanceof Error ? err.message : 'Unknown error',
        });
    }
}

function logShadowDenial(
    req: AuthenticatedRequest,
    featureKey: string,
    reason: string,
    extra: Record<string, unknown> = {}
): void {
    logger.warn('[entitlement] SHADOW denial — would have blocked', {
        userId: req.user?.userId,
        featureKey,
        reason,
        path: req.path,
        method: req.method,
        ...extra,
    });
    // Persist to entitlement_shadow_log for dashboarding (best-effort)
    const userId = req.user?.userId;
    if (userId) {
        void persistShadowDenial(userId, featureKey, reason, req.path, req.method, extra);
        return;
    }
    if (userId) {
        void query(
            `INSERT INTO entitlement_shadow_log (user_id, feature_key, reason, path, method, extra)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
            [userId, featureKey, reason, req.path, req.method, JSON.stringify(extra)]
        ).catch(() => {
            // Table may not exist yet — silent
        });
    }
}

// ============================================
// requirePlan(minTier)
// ============================================

/**
 * Gate a route on the user's plan tier. Useful for tier-wide gates
 * (e.g. "Pro or higher") where per-feature mapping is overkill.
 */
export function requirePlan(minTier: PlanTier) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as AuthenticatedRequest).user?.userId;
            if (!userId) throw ApiError.unauthorized();

            const bundle = await getUserEntitlements(userId);
            const current = bundle.plan.tier;

            if (current < minTier) {
                if (!shouldEnforce(req as AuthenticatedRequest, bundle)) {
                    logShadowDenial(req as AuthenticatedRequest, 'plan_tier', 'PLAN_UPGRADE_REQUIRED', {
                        currentTier: current,
                        requiredTier: minTier,
                    });
                    return next();
                }
                throw new ApiError(402, `Plan upgrade required (need tier ${minTier}, have ${current})`, {
                    code: 'PLAN_UPGRADE_REQUIRED',
                    details: [
                        { field: 'plan', message: 'upgrade_required', code: String(minTier) },
                    ],
                });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

// ============================================
// requireFeature(featureKey)
// ============================================

/**
 * Gate on `features[featureKey].enabled`. Blocks with 402 `FEATURE_DISABLED`
 * when the feature is off for the user's plan/override stack.
 */
export function requireFeature(featureKey: string) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as AuthenticatedRequest).user?.userId;
            if (!userId) throw ApiError.unauthorized();

            const bundle = await getUserEntitlements(userId);
            const feature = bundle.features[featureKey];

            if (!feature || !feature.enabled) {
                if (!shouldEnforce(req as AuthenticatedRequest, bundle)) {
                    logShadowDenial(req as AuthenticatedRequest, featureKey, 'FEATURE_DISABLED');
                    return next();
                }
                throw new ApiError(402, `Feature '${featureKey}' is not available on your plan`, {
                    code: 'FEATURE_DISABLED',
                    details: [{ field: 'feature', message: featureKey, code: 'disabled' }],
                });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

// ============================================
// requireFeatureLimit(featureKey, { period })
// ============================================

const LIMIT_PERIOD_SQL: Record<string, string> = {
    day:   "date_trunc('day',  NOW() AT TIME ZONE 'UTC')",
    week:  "date_trunc('week', NOW() AT TIME ZONE 'UTC')",
    month: "date_trunc('month',NOW() AT TIME ZONE 'UTC')",
};

/**
 * Count `usage_events` for the feature within the period and reject with 429
 * `FEATURE_LIMIT_REACHED` when `>= feature.limit`. Uses SQL aggregation so
 * there's no in-memory counting to go stale across processes.
 */
export function requireFeatureLimit(
    featureKey: string,
    opts: { period?: 'day' | 'week' | 'month' | 'cycle' } = {}
) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as AuthenticatedRequest).user?.userId;
            if (!userId) throw ApiError.unauthorized();

            const bundle = await getUserEntitlements(userId);
            const feature = bundle.features[featureKey];
            if (!feature || feature.limit == null) return next();

            const period = opts.period ?? feature.limitPeriod ?? 'day';

            let boundary: string;
            if (period === 'cycle') {
                // Use the user's billing cycle start, falling back to calendar month
                boundary = `COALESCE(
                    (SELECT current_period_start FROM user_subscriptions
                      WHERE user_id = $1 AND status IN ('active','trialing','grace')
                      ORDER BY current_period_start DESC LIMIT 1),
                    date_trunc('month', NOW() AT TIME ZONE 'UTC'))`;
            } else {
                boundary = LIMIT_PERIOD_SQL[period] ?? LIMIT_PERIOD_SQL.day;
            }

            const r = await query<{ used: string }>(
                `SELECT COUNT(*)::text AS used
                   FROM usage_events
                  WHERE user_id = $1
                    AND feature_key = $2
                    AND status IN ('reserved','settled','failed')
                    AND created_at >= ${boundary}`,
                [userId, featureKey]
            );
            const used = Number(r.rows[0]?.used ?? 0);
            if (used >= feature.limit) {
                if (!shouldEnforce(req as AuthenticatedRequest, bundle)) {
                    logShadowDenial(req as AuthenticatedRequest, featureKey, 'FEATURE_LIMIT_REACHED', {
                        used,
                        limit: feature.limit,
                        period,
                    });
                    return next();
                }
                throw new ApiError(429, `Limit reached for '${featureKey}' (${used}/${feature.limit} ${period})`, {
                    code: 'FEATURE_LIMIT_REACHED',
                    details: [
                        { field: 'feature', message: featureKey, code: `${used}/${feature.limit}` },
                    ],
                });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

// ============================================
// consumeCredits(featureKey, estimator)
// ============================================

export type CreditEstimator = (
    req: AuthenticatedRequest,
    feature: EntitlementBundle['features'][string]
) => number | Promise<number>;

export interface CreditContext {
    requestId: string;
    idempotencyKey: string;
    reservedAmount: number;
    featureKey: string;
    /** Call when you know the actual token/credit consumption. */
    settle: (actualAmount: number, usage?: Parameters<typeof settleCredits>[0]['usage']) => Promise<void>;
    /** Call to cancel without consuming (early bail / client abort). */
    release: () => Promise<void>;
}

declare module 'express-serve-static-core' {
     
    interface Request {
        creditContext?: CreditContext;
    }
}

/**
 * Reserve credits up-front. Attaches `req.creditContext` for the handler to
 * call `settle(actual)` with the provider's usage. If the handler returns
 * without settling, a `res.on('finish')` listener auto-settles using the
 * reserved amount (non-streaming paths) or auto-releases (4xx/5xx).
 *
 * Requires `Idempotency-Key` header from the client (400 if missing).
 * In shadow mode, missing header is logged but not blocked; reservation is
 * also skipped so non-compliant clients don't accidentally fill the ledger.
 */
export function consumeCredits(featureKey: string, estimator?: CreditEstimator) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const r = req as AuthenticatedRequest;
        try {
            const userId = r.user?.userId;
            if (!userId) throw ApiError.unauthorized();

            const headerKey = req.headers['idempotency-key'];
            const idempotencyKey = typeof headerKey === 'string' ? headerKey : null;

            if (!idempotencyKey) {
                if (!shouldEnforce(r, null)) {
                    logShadowDenial(r, featureKey, 'MISSING_IDEMPOTENCY_KEY');
                    return next();
                }
                throw new ApiError(400, 'Idempotency-Key header is required for this endpoint', {
                    code: 'MISSING_IDEMPOTENCY_KEY',
                });
            }

            const bundle = await getUserEntitlements(userId);
            const feature = bundle.features[featureKey];
            const defaultCost = feature?.creditCost ?? 0;
            const estimated = estimator ? await estimator(r, feature) : defaultCost;
            const amount = Math.max(0, Math.ceil(estimated));

            // Zero-cost feature or missing entry — nothing to reserve.
            if (amount === 0) return next();

            const requestId = r.requestId ?? crypto.randomUUID();
            r.requestId = requestId;

            const reservation = await reserveCredits({
                userId,
                amount,
                featureKey,
                endpoint: `${req.method} ${req.path}`,
                requestId,
                idempotencyKey,
            });

            if (!reservation.ok) {
                if (!shouldEnforce(r, bundle)) {
                    logShadowDenial(r, featureKey, 'CREDITS_EXHAUSTED', {
                        requestedAmount: amount,
                        wallet: bundle.wallet.total,
                    });
                    return next();
                }
                throw new ApiError(402, `Insufficient credits for '${featureKey}'`, {
                    code: 'CREDITS_EXHAUSTED',
                    details: [
                        { field: 'credits', message: `need ${amount}, have ${bundle.wallet.total}`, code: 'no_credits' },
                    ],
                });
            }

            // Attach context for the handler to call settle/release.
            let finalized = false;
            const ctx: CreditContext = {
                requestId,
                idempotencyKey,
                reservedAmount: amount,
                featureKey,
                settle: async (actualAmount, usage) => {
                    if (finalized) return;
                    finalized = true;
                    await settleCredits({
                        userId,
                        featureKey,
                        requestId,
                        idempotencyKey,
                        actualAmount,
                        usage,
                    });
                },
                release: async () => {
                    if (finalized) return;
                    finalized = true;
                    await releaseCredits(userId, featureKey, requestId, idempotencyKey);
                },
            };
            req.creditContext = ctx;

            // Auto-finalize based on response outcome.
            const onResponseEnd = () => {
                if (finalized) return;
                const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
                if (isSuccess) {
                    // Handler didn't settle explicitly — charge the full reservation.
                    void ctx.settle(amount).catch((err) => {
                        logger.error('[entitlement] auto-settle failed', {
                            userId, featureKey, requestId,
                            error: (err as Error).message,
                        });
                    });
                } else {
                    void ctx.release().catch((err) => {
                        logger.warn('[entitlement] auto-release failed', {
                            userId, featureKey, requestId,
                            error: (err as Error).message,
                        });
                    });
                }
            };

            res.on('finish', onResponseEnd);
            res.on('close', () => {
                if (!res.writableEnded) onResponseEnd();
            });

            next();
        } catch (err) {
            next(err);
        }
    };
}

// ============================================
// auditAction
// ============================================

/**
 * Write an audit_log row after the handler succeeds. Phase-gated: if the
 * audit_log table doesn't exist yet (Sprint 4 migration), this is a no-op.
 * Always runs AFTER the route handler via `res.on('finish')`.
 */
export function auditAction(
    action: string,
    entityType: string,
    getEntityId?: (req: AuthenticatedRequest) => string | null | undefined
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const r = req as AuthenticatedRequest;
        res.on('finish', () => {
            if (res.statusCode >= 400) return;
            const userId = r.user?.userId;
            if (!userId) return;
            const entityId = getEntityId?.(r) ?? null;

            void query(
                `INSERT INTO audit_log (actor_user_id, actor_kind, entity_type, entity_id,
                                        action, ip, user_agent, request_id)
                 VALUES ($1, 'user', $2, $3, $4, $5, $6, $7)
                 ON CONFLICT DO NOTHING`,
                [
                    userId,
                    entityType,
                    entityId,
                    action,
                    req.ip ?? null,
                    (req.headers['user-agent'] ?? '').toString().slice(0, 255),
                    r.requestId ?? null,
                ]
            ).catch((err) => {
                // Table might not exist yet (Sprint 4 migration). Silent when missing.
                const msg = (err as Error).message;
                if (!msg.includes('audit_log')) {
                    logger.warn('[entitlement] audit_log write failed', {
                        userId, action, error: msg,
                    });
                }
            });
        });
        next();
    };
}

// ============================================
// Streaming settle helper — for SSE / voice-call handlers
// ============================================

/**
 * Accumulator that counts emitted tokens from a streaming handler and settles
 * the reservation at stream end with the real consumption.
 *
 * Usage inside a handler:
 *
 *   const counter = attachStreamCreditCounter(req);
 *   service.streamChat({
 *     onToken: (t) => { counter.countToken(t); res.write(...); },
 *   });
 *   res.on('finish', () => counter.settle({ provider, model, inputTokens }));
 *
 * If the handler does not call `settle()` the standard auto-settle kicks in
 * with the reservation amount — which is fine for the happy path but wastes
 * credits the stream didn't actually consume. Always settle explicitly.
 */
export interface StreamCreditCounter {
    countToken: (token: string) => void;
    countText: (text: string) => void;
    /** Credits computed from accumulated tokens + input estimate. */
    currentCredits: () => number;
    /** Settle the reservation with the accumulated count. Idempotent. */
    settle: (usage?: {
        provider?: string;
        model?: string;
        inputTokens?: number;
    }) => Promise<void>;
    release: () => Promise<void>;
}

export function attachStreamCreditCounter(
    req: Request,
    opts: {
        /** Credits per output bucket — matches estimator default. */
        creditsPerOutputBucket?: number;
        /** Minimum charge regardless of output length. */
        minCredits?: number;
    } = {}
): StreamCreditCounter {
    const ctx = req.creditContext;
    let totalOutputTokens = 0;
    let accumulated = '';
    const bucket = opts.creditsPerOutputBucket ?? 100;
    const minCredits = opts.minCredits ?? 1;

    const currentCredits = (): number => {
        const c = Math.max(minCredits, Math.ceil(totalOutputTokens / bucket));
        return Math.min(ctx?.reservedAmount ?? c, c);
    };

    return {
        countToken(token: string) {
            if (!token) return;
            accumulated += token;
            // Cheap heuristic while streaming; exact tiktoken count runs at
            // settle-time so we don't encode on every single token.
            totalOutputTokens = Math.ceil(accumulated.length / 4);
        },
        countText(text: string) {
            accumulated = text;
            totalOutputTokens = countTokens(accumulated);
        },
        currentCredits,
        async settle(usage) {
            if (!ctx) return;
            // Exact count at settle time.
            if (accumulated) totalOutputTokens = countTokens(accumulated);
            const credits = currentCredits();
            await ctx.settle(credits, {
                provider: usage?.provider,
                model: usage?.model,
                inputTokens: usage?.inputTokens,
                outputTokens: totalOutputTokens,
            });
        },
        async release() {
            if (ctx) await ctx.release();
        },
    };
}
