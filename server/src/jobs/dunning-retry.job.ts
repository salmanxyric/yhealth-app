/**
 * Dunning Retry Job
 *
 * Processes scheduled payment retry attempts from the `payment_attempts` table.
 * Rows are inserted by `scheduleDunningRetries()` in stripe-webhook.service.ts
 * after an `invoice.payment_failed` event, with scheduled_at offsets of +3d, +5d, +7d.
 *
 * Runs every 6 hours. Idempotent — only processes rows with status='scheduled'
 * whose scheduled_at has passed.
 */

import Stripe from 'stripe';
import { query } from '../config/database.config.js';
import { env } from '../config/env.config.js';
import { logger } from '../services/logger.service.js';
import { invalidateEntitlements } from '../services/entitlement.service.js';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
    if (!stripeClient) {
        if (!env.stripe.secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        stripeClient = new Stripe(env.stripe.secretKey, { apiVersion: '2025-12-15.clover' as Stripe.LatestApiVersion });
    }
    return stripeClient;
}

interface ScheduledAttempt {
    id: string;
    invoice_id: string;
    user_id: string;
    attempt_number: number;
    stripe_invoice_id: string;
}

export async function runDunningRetryJob(): Promise<{ processed: number; succeeded: number; failed: number }> {
    const result = await query<ScheduledAttempt>(
        `SELECT pa.id, pa.invoice_id, pa.user_id, pa.attempt_number, i.stripe_invoice_id
           FROM payment_attempts pa
           JOIN invoices i ON i.id = pa.invoice_id
          WHERE pa.status = 'scheduled'
            AND pa.scheduled_at <= (NOW() AT TIME ZONE 'UTC')
          ORDER BY pa.scheduled_at ASC
          LIMIT 50`
    );

    if (result.rows.length === 0) return { processed: 0, succeeded: 0, failed: 0 };

    let succeeded = 0;
    let failed = 0;
    const stripe = getStripe();

    for (const attempt of result.rows) {
        try {
            await stripe.invoices.pay(attempt.stripe_invoice_id);

            await query(
                `UPDATE payment_attempts SET status = 'succeeded', updated_at = NOW() AT TIME ZONE 'UTC' WHERE id = $1`,
                [attempt.id]
            );
            await query(
                `UPDATE user_subscriptions
                    SET status = 'active',
                        dunning_state = 'healthy',
                        updated_at = NOW() AT TIME ZONE 'UTC'
                  WHERE user_id = $1
                    AND status IN ('past_due', 'grace')`,
                [attempt.user_id]
            );
            await invalidateEntitlements(attempt.user_id);
            succeeded++;

            logger.info('[dunningRetryJob] Payment retry succeeded', {
                userId: attempt.user_id,
                attemptNumber: attempt.attempt_number,
            });
        } catch (err) {
            await query(
                `UPDATE payment_attempts SET status = 'failed', updated_at = NOW() AT TIME ZONE 'UTC' WHERE id = $1`,
                [attempt.id]
            );

            // If this was the last scheduled attempt, mark dunning as failed
            if (attempt.attempt_number >= 3) {
                await query(
                    `UPDATE user_subscriptions
                        SET dunning_state = 'dunning_failed',
                            updated_at = NOW() AT TIME ZONE 'UTC'
                      WHERE user_id = $1
                        AND status = 'past_due'`,
                    [attempt.user_id]
                );
                await invalidateEntitlements(attempt.user_id);
            }
            failed++;

            logger.warn('[dunningRetryJob] Payment retry failed', {
                userId: attempt.user_id,
                attemptNumber: attempt.attempt_number,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    logger.info('[dunningRetryJob] Batch complete', {
        processed: result.rows.length,
        succeeded,
        failed,
    });

    return { processed: result.rows.length, succeeded, failed };
}
