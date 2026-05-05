/**
 * Abuse Detection Service
 *
 * Detects suspicious patterns in credit consumption + subscription behavior
 * and writes scored rows to `abuse_signals`. A rolling 24h aggregate score
 * drives automated throttling / alerting.
 *
 * Detectors:
 *   - burst_rate:    > 60 AI calls in last 5 minutes → score scales with rate
 *   - plan_cycle:    subscription created+canceled < 24h apart (refund abuse)
 *   - credit_drain:  > 50% of monthly allowance consumed in < 1 hour
 *   - duplicate_signup: same email prefix or stripe_customer_id repeated
 *
 * Scoring is 0..100. Thresholds:
 *   - 50+  → soft warning, admin dashboard highlight
 *   - 75+  → shadow-throttle (middleware caps reservations to 1 credit)
 *   - 90+  → auto-suspend via admin_overrides insert
 *
 * Never blocks callers. Always writes rows; enforcement is a separate policy
 * decision layered on top by cron or admin review.
 */

import { query, transaction } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { invalidateEntitlements } from './entitlement.service.js';

// ============================================
// DETECTORS
// ============================================

const BURST_WINDOW_MINUTES = 5;
const BURST_THRESHOLD = 60;

/**
 * Burst rate: many AI calls in a short window. A bot pressing go or a
 * compromised account. Score = min(100, ceil((count - threshold) * 2)).
 */
export async function detectBurstRate(userId: string): Promise<number | null> {
    const r = await query<{ n: string }>(
        `SELECT COUNT(*)::text AS n
           FROM usage_events
          WHERE user_id = $1
            AND created_at > (NOW() AT TIME ZONE 'UTC') - ($2 || ' minutes')::interval`,
        [userId, BURST_WINDOW_MINUTES]
    );
    const count = parseInt(r.rows[0]?.n ?? '0', 10);
    if (count < BURST_THRESHOLD) return null;
    const score = Math.min(100, Math.ceil((count - BURST_THRESHOLD) * 2) + 50);
    await recordSignal(userId, 'burst_rate', score, { count, window_minutes: BURST_WINDOW_MINUTES });
    return score;
}

/**
 * Plan cycle abuse: subscribed + canceled within 24h. Chargeback / refund risk.
 */
export async function detectPlanCycleAbuse(userId: string): Promise<number | null> {
    const r = await query<{ created_at: Date; canceled_at: Date | null; status: string }>(
        `SELECT created_at, canceled_at, status
           FROM user_subscriptions
          WHERE user_id = $1
            AND canceled_at IS NOT NULL
            AND canceled_at - created_at < INTERVAL '24 hours'
          ORDER BY created_at DESC
          LIMIT 1`,
        [userId]
    );
    if (!r.rows[0]) return null;
    const score = 70;
    await recordSignal(userId, 'plan_cycle', score, {
        created_at: r.rows[0].created_at.toISOString(),
        canceled_at: r.rows[0].canceled_at?.toISOString(),
    });
    return score;
}

/**
 * Credit drain: user has consumed > 50% of their monthly allowance in < 1h.
 * Could be legitimate (bulk action) but warrants review on paid plans.
 */
export async function detectCreditDrain(userId: string): Promise<number | null> {
    const r = await query<{
        consumed_1h: string;
        plan_credits: number;
    }>(
        `SELECT
            COALESCE(SUM(CASE WHEN ct.delta < 0 THEN -ct.delta ELSE 0 END), 0)::text AS consumed_1h,
            COALESCE(sp.credits_included_monthly, 0) AS plan_credits
           FROM credit_transactions ct
           LEFT JOIN user_subscriptions us ON us.user_id = ct.user_id
                AND us.status IN ('active','trialing','grace')
           LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
          WHERE ct.user_id = $1
            AND ct.created_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 hour'
            AND ct.kind IN ('consume','reserve')
          GROUP BY sp.credits_included_monthly`,
        [userId]
    );
    const consumed = parseInt(r.rows[0]?.consumed_1h ?? '0', 10);
    const monthly = r.rows[0]?.plan_credits ?? 0;
    if (monthly === 0 || consumed < monthly * 0.5) return null;
    const score = Math.min(100, Math.floor((consumed / monthly) * 100) + 20);
    await recordSignal(userId, 'credit_drain', score, {
        consumed_last_hour: consumed,
        monthly_allowance: monthly,
        ratio: +(consumed / monthly).toFixed(2),
    });
    return score;
}

// ============================================
// SIGNAL WRITER
// ============================================

async function recordSignal(
    userId: string,
    kind: 'burst_rate' | 'geo_anomaly' | 'plan_cycle' | 'chargeback' | 'credit_drain' | 'duplicate_signup',
    score: number,
    evidence: Record<string, unknown>
): Promise<void> {
    try {
        await query(
            `INSERT INTO abuse_signals (user_id, signal_kind, score, evidence)
             VALUES ($1, $2, $3, $4::jsonb)`,
            [userId, kind, Math.min(100, Math.max(0, score)), JSON.stringify(evidence)]
        );
    } catch (err) {
        logger.warn('[abuse] Failed to record signal', {
            userId,
            kind,
            error: (err as Error).message,
        });
    }
}

// ============================================
// ROLLING 24H SCORE
// ============================================

export async function getRollingScore(userId: string): Promise<number> {
    const r = await query<{ max_score: number }>(
        `SELECT COALESCE(MAX(score), 0)::int AS max_score
           FROM abuse_signals
          WHERE user_id = $1
            AND created_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '24 hours'
            AND reviewed_at IS NULL`,
        [userId]
    );
    return r.rows[0]?.max_score ?? 0;
}

// ============================================
// AUTO-SUSPEND
// ============================================

/**
 * Auto-suspend any user whose rolling 24h score crosses 90. Idempotent — skips
 * users who already have an active suspend override. Invoked by the worker
 * after detection runs.
 */
export async function autoSuspendHighRisk(userId: string): Promise<boolean> {
    const score = await getRollingScore(userId);
    if (score < 90) return false;

    const existing = await query(
        `SELECT 1 FROM admin_overrides
          WHERE user_id = $1 AND kind = 'suspend' AND revoked_at IS NULL
          LIMIT 1`,
        [userId]
    );
    if (existing.rowCount && existing.rowCount > 0) return false;

    await transaction(async (client) => {
        await client.query(
            `INSERT INTO admin_overrides (user_id, kind, reason, created_by, metadata)
             VALUES ($1, 'suspend', $2, NULL, $3::jsonb)`,
            [userId, `abuse:auto_suspend:score=${score}`,
             JSON.stringify({ actor: 'system', abuse_score: score })]
        );
        await client.query(
            `INSERT INTO audit_log
                (actor_user_id, actor_kind, entity_type, entity_id, action, after)
             VALUES (NULL, 'system', 'user', $1, 'system.auto_suspend', $2::jsonb)`,
            [userId, JSON.stringify({ abuse_score: score })]
        );
    });
    await invalidateEntitlements(userId);
    logger.warn('[abuse] User auto-suspended', { userId, score });
    return true;
}

// ============================================
// WORKER ENTRYPOINT
// ============================================

/**
 * Run all detectors against every user with recent credit activity. Called
 * from a cron every ~5 minutes. Returns a summary for observability.
 */
export async function runAbuseSignalWorker(): Promise<{
    scanned: number;
    signals: number;
    suspended: number;
}> {
    // Look at any user with credit activity in the last 10 minutes. Narrow
    // scope avoids scanning the whole user table per run.
    const activeRes = await query<{ user_id: string }>(
        `SELECT DISTINCT user_id
           FROM credit_transactions
          WHERE created_at > (NOW() AT TIME ZONE 'UTC') - INTERVAL '10 minutes'`
    );

    let signals = 0;
    let suspended = 0;
    for (const row of activeRes.rows) {
        try {
            const results = await Promise.all([
                detectBurstRate(row.user_id),
                detectPlanCycleAbuse(row.user_id),
                detectCreditDrain(row.user_id),
            ]);
            signals += results.filter((s) => s !== null).length;
            if (await autoSuspendHighRisk(row.user_id)) suspended++;
        } catch (err) {
            logger.warn('[abuse] Detector error', {
                userId: row.user_id,
                error: (err as Error).message,
            });
        }
    }
    if (activeRes.rowCount && activeRes.rowCount > 0) {
        logger.info('[abuse] worker pass complete', {
            scanned: activeRes.rowCount,
            signals,
            suspended,
        });
    }
    return { scanned: activeRes.rowCount ?? 0, signals, suspended };
}
