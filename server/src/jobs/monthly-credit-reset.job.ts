/**
 * Monthly Credit Reset Job
 *
 * Resets plan credits for users whose `next_reset_at` has passed. Stripe-invoiced
 * plans get their reset via `applyMonthlyRollover` on `invoice.paid`, but
 * free-tier users (no Stripe invoices) rely on this job.
 *
 * Rollover policies:
 *   - 'none':      plan_credits_balance reset to credits_included_monthly
 *   - 'cap':       min(current + monthly, rollover_cap)
 *   - 'unlimited': current + monthly (no cap)
 *
 * Runs daily. Idempotent — only processes wallets where next_reset_at <= NOW.
 */

import { query, transaction } from '../config/database.config.js';
import { logger } from '../services/logger.service.js';

interface WalletToReset {
    user_id: string;
    plan_credits_balance: number;
    bonus_credits_balance: number;
    next_reset_at: Date;
    credits_included_monthly: number | null;
    credits_rollover_policy: string | null;
    credits_rollover_cap: number | null;
    plan_slug: string | null;
}

export async function runMonthlyCreditResetJob(): Promise<{ reset: number }> {
    const result = await query<WalletToReset>(
        `SELECT cw.user_id,
                cw.plan_credits_balance,
                cw.bonus_credits_balance,
                cw.next_reset_at,
                sp.credits_included_monthly,
                sp.credits_rollover_policy,
                sp.credits_rollover_cap,
                sp.slug AS plan_slug
           FROM credit_wallets cw
           LEFT JOIN user_subscriptions us
             ON us.user_id = cw.user_id
            AND us.status IN ('active', 'trialing', 'grace')
           LEFT JOIN subscription_plans sp
             ON sp.id = us.plan_id
          WHERE cw.next_reset_at IS NOT NULL
            AND cw.next_reset_at <= (NOW() AT TIME ZONE 'UTC')
          ORDER BY cw.next_reset_at ASC
          LIMIT 200`
    );

    if (result.rows.length === 0) return { reset: 0 };

    let resetCount = 0;

    for (const wallet of result.rows) {
        const monthlyCredits = wallet.credits_included_monthly ?? 0;
        if (monthlyCredits <= 0) continue;

        const policy = wallet.credits_rollover_policy ?? 'none';
        const cap = wallet.credits_rollover_cap ?? 0;

        let newBalance: number;
        switch (policy) {
            case 'cap':
                newBalance = Math.min(wallet.plan_credits_balance + monthlyCredits, cap);
                break;
            case 'unlimited':
                newBalance = wallet.plan_credits_balance + monthlyCredits;
                break;
            default: // 'none'
                newBalance = monthlyCredits;
                break;
        }

        try {
            await transaction(async (client) => {
                const idempotencyKey = `monthly_reset:${wallet.user_id}:${wallet.next_reset_at.toISOString()}`;

                // Write ledger row first (idempotent via idempotency_key)
                const delta = newBalance - wallet.plan_credits_balance;
                const ledgerResult = await client.query(
                    `INSERT INTO credit_transactions
                        (id, user_id, delta, bucket, kind, reason, idempotency_key,
                         balance_after_plan, balance_after_bonus, created_at)
                     VALUES (gen_random_uuid(), $1, $2, 'plan', 'rollover', 'monthly_reset', $3,
                             $4, $5, NOW() AT TIME ZONE 'UTC')
                     ON CONFLICT (idempotency_key) DO NOTHING
                     RETURNING id`,
                    [wallet.user_id, delta, idempotencyKey, newBalance, wallet.bonus_credits_balance]
                );

                // If idempotency conflict, skip wallet update
                if (ledgerResult.rows.length === 0) return;

                await client.query(
                    `UPDATE credit_wallets
                        SET plan_credits_balance = $2,
                            last_reset_at = next_reset_at,
                            next_reset_at = next_reset_at + INTERVAL '1 month',
                            version = version + 1,
                            updated_at = NOW() AT TIME ZONE 'UTC'
                      WHERE user_id = $1`,
                    [wallet.user_id, newBalance]
                );
            });
            resetCount++;
        } catch (err) {
            logger.error('[monthlyCreditResetJob] Failed to reset credits', {
                userId: wallet.user_id,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    if (resetCount > 0) {
        logger.info('[monthlyCreditResetJob] Monthly credit reset complete', { reset: resetCount });
    }

    return { reset: resetCount };
}
