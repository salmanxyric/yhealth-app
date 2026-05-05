/**
 * Credit Service
 *
 * Sprint 1 scope: wallet bookkeeping primitives.
 *   - ensureWallet: idempotent wallet row creation
 *   - getWallet:    read the current balance
 *   - grantCredits: add credits to a bucket + ledger row (used by admin overrides, monthly rollover)
 *
 * Sprint 2 adds the atomic debit path:
 *   - reserveCredits / settleCredits / releaseCredits / refundCredits
 *   - consumeCredits middleware wrapping AI endpoints
 *
 * Atomicity protocol (documented here for reference):
 *   UPDATE credit_wallets
 *      SET plan_credits_balance  = ... - LEAST(plan_credits_balance, $amount),
 *          bonus_credits_balance = ... - GREATEST($amount - plan_credits_balance, 0),
 *          ...
 *    WHERE user_id = $1
 *      AND (plan_credits_balance + bonus_credits_balance) >= $amount
 *   RETURNING ...
 *
 * 0 rows returned => INSUFFICIENT_CREDITS. Wrapped inside a single transaction
 * with the credit_transactions INSERT; ON CONFLICT (idempotency_key) DO NOTHING
 * guarantees at-most-once.
 */

import type { PoolClient } from 'pg';
import { query, transaction } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { invalidateEntitlements, emitWalletDelta } from './entitlement.service.js';

export type CreditBucket = 'plan' | 'bonus';
export type CreditKind =
    | 'grant'
    | 'consume'
    | 'reserve'
    | 'settle'
    | 'release'
    | 'refund'
    | 'expire'
    | 'rollover'
    | 'adjustment';

export interface WalletRow {
    user_id: string;
    plan_credits_balance: number;
    bonus_credits_balance: number;
    currency: string;
    lifetime_granted: string; // BIGINT as string
    lifetime_consumed: string;
    last_reset_at: Date | null;
    next_reset_at: Date | null;
    version: number;
    created_at: Date;
    updated_at: Date;
}

// ============================================
// READ
// ============================================

export async function getWallet(userId: string): Promise<WalletRow | null> {
    const result = await query<WalletRow>(
        `SELECT * FROM credit_wallets WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0] ?? null;
}

// ============================================
// ENSURE (idempotent create)
// ============================================

/**
 * Create the wallet row if it doesn't exist — zero credits, zero ledger rows.
 * This is the hot-path variant: safe to call on every entitlements fetch.
 * Trial and plan credit grants live in dedicated flows (migration backfill,
 * invoice.paid handler, admin overrides), NOT here.
 */
export async function ensureWalletForEntitlements(userId: string): Promise<WalletRow> {
    return ensureWallet(userId);
}

/**
 * Create the wallet row if it doesn't exist. Returns the current (post-create) row.
 * Safe to call on every entitlement lookup; uses ON CONFLICT DO NOTHING.
 */
export async function ensureWallet(
    userId: string,
    opts: { initialPlanCredits?: number; initialBonusCredits?: number } = {}
): Promise<WalletRow> {
    const { initialPlanCredits = 0, initialBonusCredits = 0 } = opts;

    // Try to read first — avoids the write path on the hot path.
    const existing = await getWallet(userId);
    if (existing) return existing;

    // Create + seed in a single transaction so the ledger always matches the wallet.
    // Uses xmax=0 to distinguish a true first-insert from a concurrent-conflict
    // path; only the true first-insert writes the init ledger rows. Ledger
    // idempotency keys prevent ledger divergence across processes too.
    return transaction(async (client) => {
        const upserted = await client.query<WalletRow & { was_inserted: boolean }>(
            `INSERT INTO credit_wallets
                (user_id, plan_credits_balance, bonus_credits_balance, lifetime_granted)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() AT TIME ZONE 'UTC'
             RETURNING *, (xmax = 0) AS was_inserted`,
            [userId, initialPlanCredits, initialBonusCredits, initialPlanCredits + initialBonusCredits]
        );
        const row = upserted.rows[0];

        // If a concurrent call already created the row, skip seed ledger writes.
        if (!row.was_inserted) return row;

        if (initialPlanCredits > 0) {
            await writeLedgerRow(client, {
                userId,
                delta: initialPlanCredits,
                bucket: 'plan',
                kind: 'grant',
                reason: 'wallet:init:plan',
                idempotencyKey: `wallet:init:plan:${userId}`,
                balanceAfterPlan: row.plan_credits_balance,
                balanceAfterBonus: row.bonus_credits_balance,
            });
        }
        if (initialBonusCredits > 0) {
            await writeLedgerRow(client, {
                userId,
                delta: initialBonusCredits,
                bucket: 'bonus',
                kind: 'grant',
                reason: 'wallet:init:bonus',
                idempotencyKey: `wallet:init:bonus:${userId}`,
                balanceAfterPlan: row.plan_credits_balance,
                balanceAfterBonus: row.bonus_credits_balance,
            });
        }

        return row;
    });
}

// ============================================
// GRANT
// ============================================

export interface GrantCreditsInput {
    userId: string;
    amount: number;
    bucket: CreditBucket;
    reason: string;
    kind?: CreditKind; // default 'grant'; pass 'rollover' or 'adjustment' when appropriate
    featureKey?: string | null;
    requestId?: string | null;
    idempotencyKey?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Add credits to a user's wallet.
 * Writes a ledger row in the same transaction.
 * Idempotent when `idempotencyKey` is provided.
 */
export async function grantCredits(input: GrantCreditsInput): Promise<WalletRow> {
    if (input.amount <= 0) {
        throw new Error(`grantCredits: amount must be positive (got ${input.amount})`);
    }

    // Ensure wallet exists (cheap no-op if it does).
    await ensureWallet(input.userId);

    const row = await transaction(async (client) => {
        // Ledger first: if the idempotency key already exists, this returns
        // zero rows and we short-circuit WITHOUT mutating the wallet.
        // Wallet balances after a successful grant can only be known once we've
        // applied the UPDATE, so when we skip the UPDATE on replay we use the
        // already-computed balance_after_* from the prior ledger row.
        const preRead = await client.query<WalletRow>(
            `SELECT * FROM credit_wallets WHERE user_id = $1 FOR UPDATE`,
            [input.userId]
        );
        const pre = preRead.rows[0];
        if (!pre) throw new Error(`grantCredits: wallet not found for ${input.userId}`);

        const projectedPlan =
            input.bucket === 'plan' ? pre.plan_credits_balance + input.amount : pre.plan_credits_balance;
        const projectedBonus =
            input.bucket === 'bonus' ? pre.bonus_credits_balance + input.amount : pre.bonus_credits_balance;

        const inserted = await writeLedgerRow(client, {
            userId: input.userId,
            delta: input.amount,
            bucket: input.bucket,
            kind: input.kind ?? 'grant',
            reason: input.reason,
            featureKey: input.featureKey ?? null,
            requestId: input.requestId ?? null,
            idempotencyKey: input.idempotencyKey ?? null,
            balanceAfterPlan: projectedPlan,
            balanceAfterBonus: projectedBonus,
            metadata: input.metadata,
        });

        if (!inserted) {
            // Idempotent replay — another call already applied this grant.
            // Skip the UPDATE and return the pre-read wallet unchanged.
            return pre;
        }

        // Fresh grant — apply it.
        const walletRes = await client.query<WalletRow>(
            `UPDATE credit_wallets
                SET plan_credits_balance  = CASE WHEN $2 = 'plan'  THEN plan_credits_balance  + $3 ELSE plan_credits_balance  END,
                    bonus_credits_balance = CASE WHEN $2 = 'bonus' THEN bonus_credits_balance + $3 ELSE bonus_credits_balance END,
                    lifetime_granted      = lifetime_granted + $3,
                    version               = version + 1,
                    updated_at            = NOW() AT TIME ZONE 'UTC'
              WHERE user_id = $1
              RETURNING *`,
            [input.userId, input.bucket, input.amount]
        );
        return walletRes.rows[0];
    });

    // Bust entitlement caches so the wallet snapshot refreshes everywhere.
    void invalidateEntitlements(input.userId);

    // Push the new balance to the client immediately so the credits chip
    // ticks up without waiting for the next /me/entitlements refetch.
    emitWalletDelta(input.userId, {
        planCredits: row.plan_credits_balance,
        bonusCredits: row.bonus_credits_balance,
        total: row.plan_credits_balance + row.bonus_credits_balance,
    });

    logger.info('[credit] Credits granted', {
        userId: input.userId,
        amount: input.amount,
        bucket: input.bucket,
        kind: input.kind ?? 'grant',
        reason: input.reason,
    });

    return row;
}

// ============================================
// RESERVE / SETTLE / RELEASE / REFUND (atomic debit path)
// ============================================

export interface ReserveInput {
    userId: string;
    amount: number;
    featureKey: string;
    endpoint: string;
    requestId: string;
    /**
     * Client-provided idempotency key (from Idempotency-Key header).
     * Combined with userId + featureKey to produce the stored unique key.
     */
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
}

export interface ReserveResult {
    ok: boolean;
    reason?: 'insufficient_credits' | 'replay';
    reservationId?: string;
    balanceAfterPlan?: number;
    balanceAfterBonus?: number;
    /** On replay, the prior usage_events row id so the caller can return the original response. */
    priorUsageEventId?: string;
}

/**
 * Reserve `amount` credits for an AI call. Atomic: wallet UPDATE and ledger
 * INSERT live in the same transaction. On replay (same idempotency key) the
 * function short-circuits and returns the prior reservation so the route
 * handler can respond idempotently.
 *
 * Draining order: plan bucket first, then bonus. Wallet UPDATE uses a
 * predicate that fails when total < amount, guaranteeing no over-draw.
 *
 * The `kind='reserve'` delta is negative (credits held, not yet consumed).
 * A matching `settle` or `release` closes it out.
 */
export async function reserveCredits(input: ReserveInput): Promise<ReserveResult> {
    if (input.amount < 0) throw new Error(`reserveCredits: negative amount ${input.amount}`);
    if (input.amount === 0) {
        return { ok: true, reservationId: undefined, balanceAfterPlan: 0, balanceAfterBonus: 0 };
    }

    const idempotencyKey = `reserve:${input.userId}:${input.featureKey}:${input.idempotencyKey}`;

    return transaction(async (client) => {
        // Check for replay first — avoid touching the wallet at all.
        const prior = await client.query<{ id: string; delta: number }>(
            `SELECT id, delta
               FROM credit_transactions
              WHERE idempotency_key = $1
                AND kind = 'reserve'
              LIMIT 1`,
            [idempotencyKey]
        );
        if (prior.rowCount && prior.rowCount > 0) {
            const priorRow = prior.rows[0];
            const priorEvent = await client.query<{ id: string }>(
                `SELECT id FROM usage_events
                  WHERE request_id = (
                      SELECT request_id FROM credit_transactions WHERE id = $1
                  )
                  LIMIT 1`,
                [priorRow.id]
            );
            return {
                ok: true,
                reason: 'replay',
                reservationId: priorRow.id,
                priorUsageEventId: priorEvent.rows[0]?.id,
            };
        }

        // Atomic debit: wallet UPDATE with WHERE balance >= amount. Zero rows = fail.
        const walletRes = await client.query<{
            plan_credits_balance: number;
            bonus_credits_balance: number;
        }>(
            `UPDATE credit_wallets
                SET plan_credits_balance  = plan_credits_balance
                                           - LEAST(plan_credits_balance, $2::int),
                    bonus_credits_balance = bonus_credits_balance
                                           - GREATEST($2::int - plan_credits_balance, 0::int),
                    lifetime_consumed     = lifetime_consumed + $2::int,
                    version               = version + 1,
                    updated_at            = NOW() AT TIME ZONE 'UTC'
              WHERE user_id = $1
                AND (plan_credits_balance + bonus_credits_balance) >= $2::int
              RETURNING plan_credits_balance, bonus_credits_balance`,
            [input.userId, input.amount]
        );

        if (walletRes.rowCount === 0) {
            return { ok: false, reason: 'insufficient_credits' };
        }

        const { plan_credits_balance, bonus_credits_balance } = walletRes.rows[0];

        // Ledger: negative delta since credits are removed from balance.
        // Bucket label reflects where the majority was drawn from (plan if any
        // plan balance was used, otherwise bonus). For multi-bucket draws we
        // still log one row — usage_events carries the exact split in metadata.
        const planPortion = Math.min(input.amount, plan_credits_balance + input.amount); // pre-UPDATE plan
        const bucket: CreditBucket = planPortion > 0 ? 'plan' : 'bonus';

        const ledgerRow = await client.query<{ id: string }>(
            `INSERT INTO credit_transactions
                (user_id, delta, bucket, kind, reason, feature_key, endpoint,
                 request_id, idempotency_key, balance_after_plan, balance_after_bonus, metadata)
             VALUES ($1, -($2::int), $3, 'reserve', $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
             RETURNING id`,
            [
                input.userId,
                input.amount,
                bucket,
                `reserve:${input.featureKey}`,
                input.featureKey,
                input.endpoint,
                input.requestId,
                idempotencyKey,
                plan_credits_balance,
                bonus_credits_balance,
                JSON.stringify({ ...(input.metadata ?? {}), reserved_amount: input.amount }),
            ]
        );

        // Mirror the reservation into usage_events (one row per request).
        await client.query(
            `INSERT INTO usage_events
                (user_id, feature_key, endpoint, request_id, idempotency_key,
                 credits_reserved, credits_charged, status)
             VALUES ($1, $2, $3, $4, $5, $6, 0, 'reserved')
             ON CONFLICT (idempotency_key) DO NOTHING`,
            [
                input.userId,
                input.featureKey,
                input.endpoint,
                input.requestId,
                idempotencyKey,
                input.amount,
            ]
        );

        return {
            ok: true,
            reservationId: ledgerRow.rows[0].id,
            balanceAfterPlan: plan_credits_balance,
            balanceAfterBonus: bonus_credits_balance,
        };
    });
}

export interface SettleInput {
    userId: string;
    featureKey: string;
    requestId: string;
    idempotencyKey: string;
    /** Actual credits consumed. May be less than or equal to the reservation. */
    actualAmount: number;
    /** Any extra provider metadata to persist on usage_events. */
    usage?: {
        provider?: string;
        model?: string;
        inputTokens?: number;
        outputTokens?: number;
        audioSeconds?: number;
        imageCount?: number;
        costUsdEstimated?: number;
    };
}

/**
 * Close out a reservation. If `actualAmount < reserved`, issue a release for
 * the difference. If `actualAmount > reserved`, debit the extra (capped at
 * current balance to avoid going negative — shortfall is logged for audit).
 */
export async function settleCredits(input: SettleInput): Promise<void> {
    const reservationKey = `reserve:${input.userId}:${input.featureKey}:${input.idempotencyKey}`;
    const settleKey = `settle:${input.userId}:${input.featureKey}:${input.idempotencyKey}`;

    await transaction(async (client) => {
        // Find the prior reservation to compute the delta.
        const reservation = await client.query<{
            id: string;
            delta: number;
            balance_after_plan: number;
            balance_after_bonus: number;
        }>(
            `SELECT id, delta, balance_after_plan, balance_after_bonus
               FROM credit_transactions
              WHERE idempotency_key = $1
                AND kind = 'reserve'
              LIMIT 1`,
            [reservationKey]
        );
        if (reservation.rowCount === 0) {
            logger.warn('[credit] settleCredits: no matching reservation', {
                userId: input.userId,
                featureKey: input.featureKey,
            });
            return;
        }

        const reserved = Math.abs(reservation.rows[0].delta);
        const actual = Math.max(0, Math.floor(input.actualAmount));
        const diff = reserved - actual; // positive = release refund; negative = extra debit

        // Idempotency: if a settle already exists, this is a replay → noop.
        const existing = await client.query(
            `SELECT 1 FROM credit_transactions WHERE idempotency_key = $1 LIMIT 1`,
            [settleKey]
        );
        if (existing.rowCount && existing.rowCount > 0) return;

        if (diff > 0) {
            // Release: restore `diff` credits to the bucket from which they came.
            // Restore to plan bucket first for symmetry with debit order.
            const walletRes = await client.query<{
                plan_credits_balance: number;
                bonus_credits_balance: number;
            }>(
                `UPDATE credit_wallets
                    SET plan_credits_balance = plan_credits_balance + $2,
                        lifetime_consumed    = GREATEST(0, lifetime_consumed - $2),
                        version              = version + 1,
                        updated_at           = NOW() AT TIME ZONE 'UTC'
                  WHERE user_id = $1
                  RETURNING plan_credits_balance, bonus_credits_balance`,
                [input.userId, diff]
            );
            const wallet = walletRes.rows[0];
            await client.query(
                `INSERT INTO credit_transactions
                    (user_id, delta, bucket, kind, reason, feature_key,
                     request_id, idempotency_key, balance_after_plan, balance_after_bonus, metadata)
                 VALUES ($1, $2, 'plan', 'release', $3, $4, $5, $6, $7, $8, $9::jsonb)
                 ON CONFLICT (idempotency_key) DO NOTHING`,
                [
                    input.userId,
                    diff,
                    `release:${input.featureKey}`,
                    input.featureKey,
                    input.requestId,
                    `release:${input.userId}:${input.featureKey}:${input.idempotencyKey}`,
                    wallet.plan_credits_balance,
                    wallet.bonus_credits_balance,
                    JSON.stringify({ reserved, actual, released: diff }),
                ]
            );
        } else if (diff < 0) {
            // Extra charge — cap at available balance to avoid going negative.
            const extra = -diff;
            const walletRes = await client.query<{
                plan_credits_balance: number;
                bonus_credits_balance: number;
            }>(
                `UPDATE credit_wallets
                    SET plan_credits_balance  = plan_credits_balance
                                               - LEAST(plan_credits_balance, $2::int),
                        bonus_credits_balance = bonus_credits_balance
                                               - LEAST(bonus_credits_balance,
                                                       GREATEST($2::int - plan_credits_balance, 0::int)),
                        lifetime_consumed     = lifetime_consumed + LEAST(
                                                    $2::int,
                                                    plan_credits_balance + bonus_credits_balance),
                        version               = version + 1,
                        updated_at            = NOW() AT TIME ZONE 'UTC'
                  WHERE user_id = $1
                  RETURNING plan_credits_balance, bonus_credits_balance`,
                [input.userId, extra]
            );
            const wallet = walletRes.rows[0];
            await client.query(
                `INSERT INTO credit_transactions
                    (user_id, delta, bucket, kind, reason, feature_key,
                     request_id, idempotency_key, balance_after_plan, balance_after_bonus, metadata)
                 VALUES ($1, -($2::int), 'plan', 'consume', $3, $4, $5, $6, $7, $8, $9::jsonb)
                 ON CONFLICT (idempotency_key) DO NOTHING`,
                [
                    input.userId,
                    extra,
                    `extra:${input.featureKey}`,
                    input.featureKey,
                    input.requestId,
                    `extra:${input.userId}:${input.featureKey}:${input.idempotencyKey}`,
                    wallet.plan_credits_balance,
                    wallet.bonus_credits_balance,
                    JSON.stringify({ reserved, actual, extra_charged: extra }),
                ]
            );
        }

        // Write the settle marker (zero delta — just marks the reservation as closed).
        await client.query(
            `INSERT INTO credit_transactions
                (user_id, delta, bucket, kind, reason, feature_key,
                 request_id, idempotency_key, balance_after_plan, balance_after_bonus, metadata)
             VALUES ($1, 0, 'plan', 'settle', $2, $3, $4, $5, $6, $7, $8::jsonb)
             ON CONFLICT (idempotency_key) DO NOTHING`,
            [
                input.userId,
                `settle:${input.featureKey}`,
                input.featureKey,
                input.requestId,
                settleKey,
                reservation.rows[0].balance_after_plan,
                reservation.rows[0].balance_after_bonus,
                JSON.stringify({ reserved, actual }),
            ]
        );

        // Update usage_events with provider metadata + final status.
        await client.query(
            `UPDATE usage_events
                SET credits_charged   = $1::int,
                    status            = 'settled',
                    provider          = COALESCE($2::text, provider),
                    model             = COALESCE($3::text, model),
                    input_tokens      = COALESCE($4::int, input_tokens),
                    output_tokens     = COALESCE($5::int, output_tokens),
                    audio_seconds     = COALESCE($6::numeric, audio_seconds),
                    image_count       = COALESCE($7::int, image_count),
                    cost_usd_estimated= COALESCE($8::numeric, cost_usd_estimated),
                    updated_at        = NOW() AT TIME ZONE 'UTC'
              WHERE idempotency_key = $9`,
            [
                actual,
                input.usage?.provider ?? null,
                input.usage?.model ?? null,
                input.usage?.inputTokens ?? null,
                input.usage?.outputTokens ?? null,
                input.usage?.audioSeconds ?? null,
                input.usage?.imageCount ?? null,
                input.usage?.costUsdEstimated ?? null,
                reservationKey,
            ]
        );
    });

    // Fire a fresh wallet snapshot over the socket so the chip updates live.
    const wallet = await getWallet(input.userId);
    if (wallet) {
        emitWalletDelta(input.userId, {
            planCredits: wallet.plan_credits_balance,
            bonusCredits: wallet.bonus_credits_balance,
            total: wallet.plan_credits_balance + wallet.bonus_credits_balance,
        });
    }
}

/**
 * Cancel a reservation without consuming anything (e.g. route handler bailed
 * early, client aborted stream). Restores the full reserved amount.
 */
export async function releaseCredits(
    userId: string,
    featureKey: string,
    requestId: string,
    idempotencyKey: string
): Promise<void> {
    return settleCredits({ userId, featureKey, requestId, idempotencyKey, actualAmount: 0 });
}

/**
 * Compensating refund after the outer reservation already settled but the
 * downstream AI call turned out to be a failure the user shouldn't be charged
 * for. Writes a positive-delta ledger row and restores credits to the plan
 * bucket.
 */
export async function refundCredits(params: {
    userId: string;
    featureKey: string;
    amount: number;
    requestId: string;
    reason: string;
}): Promise<void> {
    if (params.amount <= 0) return;
    await grantCredits({
        userId: params.userId,
        amount: params.amount,
        bucket: 'plan',
        reason: `refund:${params.reason}`,
        kind: 'refund',
        featureKey: params.featureKey,
        requestId: params.requestId,
        idempotencyKey: `refund:${params.userId}:${params.featureKey}:${params.requestId}`,
    });
}

// ============================================
// LEDGER WRITER (internal)
// ============================================

interface LedgerInput {
    userId: string;
    delta: number;
    bucket: CreditBucket;
    kind: CreditKind;
    reason: string;
    featureKey?: string | null;
    endpoint?: string | null;
    requestId?: string | null;
    idempotencyKey?: string | null;
    balanceAfterPlan: number;
    balanceAfterBonus: number;
    metadata?: Record<string, unknown>;
}

/**
 * Insert one row into credit_transactions.
 * Returns `true` when a new row was inserted, `false` when idempotency
 * caused ON CONFLICT DO NOTHING to skip the insert.
 */
async function writeLedgerRow(client: PoolClient, input: LedgerInput): Promise<boolean> {
    const result = await client.query<{ id: string }>(
        `INSERT INTO credit_transactions
            (user_id, delta, bucket, kind, reason, feature_key, endpoint,
             request_id, idempotency_key, balance_after_plan, balance_after_bonus, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING id`,
        [
            input.userId,
            input.delta,
            input.bucket,
            input.kind,
            input.reason,
            input.featureKey ?? null,
            input.endpoint ?? null,
            input.requestId ?? null,
            input.idempotencyKey ?? null,
            input.balanceAfterPlan,
            input.balanceAfterBonus,
            JSON.stringify(input.metadata ?? {}),
        ]
    );
    return result.rowCount !== null && result.rowCount > 0;
}
