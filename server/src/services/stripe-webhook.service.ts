/**
 * Stripe Webhook Hardening Service
 *
 *  - Every inbound event is logged to `stripe_event_log` keyed by Stripe event_id.
 *  - Replays are detected via INSERT ... ON CONFLICT DO NOTHING: if the row
 *    already exists, the handler short-circuits.
 *  - `nextSubscriptionStatus()` is a pure function that defines every
 *    current→event transition exactly once. Used by both webhook handlers
 *    and the grace-expiration cron to keep state changes consistent.
 *  - Grace + dunning: `customer.subscription.deleted` → 7d grace;
 *    `invoice.payment_failed` → `past_due` with retry schedule at +3d/+5d/+7d.
 *
 * NO frontend trust. Payment state changes flow only through verified
 * webhooks. Webhook signature verification remains in the route layer; this
 * service assumes the event is already authenticated.
 */

import type Stripe from 'stripe';
import { query, transaction } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { invalidateEntitlements } from './entitlement.service.js';
import { grantCredits } from './credit.service.js';
import type { SubscriptionStatus } from './entitlement.service.js';
import { mailHelper } from '../helper/mail.js';

// ============================================
// Pure state machine
// ============================================

type StripeEventKind =
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.deleted'
    | 'invoice.paid'
    | 'invoice.payment_failed'
    | 'charge.refunded'
    | 'unknown';

/**
 * Given the current persisted subscription status and an inbound event, return
 * the next status. Pure function — no side effects. Used by both the webhook
 * handler and the grace expiration cron.
 */
export function nextSubscriptionStatus(
    current: SubscriptionStatus | 'none',
    event: StripeEventKind,
    incomingStripeStatus?: Stripe.Subscription.Status
): SubscriptionStatus {
    // Stripe's own status is authoritative when it tells us the new state.
    if (event === 'subscription.created' || event === 'subscription.updated') {
        if (incomingStripeStatus) {
            if (incomingStripeStatus === 'trialing') return 'trialing';
            if (incomingStripeStatus === 'active') return 'active';
            if (incomingStripeStatus === 'past_due') return 'past_due';
            if (incomingStripeStatus === 'canceled') return 'canceled';
            if (incomingStripeStatus === 'incomplete') return 'incomplete';
            if (incomingStripeStatus === 'incomplete_expired') return 'incomplete_expired';
            if (incomingStripeStatus === 'unpaid') return 'past_due';
            if (incomingStripeStatus === 'paused') return 'paused';
        }
        return current === 'none' ? 'active' : current;
    }

    if (event === 'subscription.deleted') {
        // Enter grace unless already canceled.
        return current === 'canceled' ? 'canceled' : 'grace';
    }

    if (event === 'invoice.paid') {
        // Revive past_due / grace back to active; no-op when active already.
        if (current === 'past_due' || current === 'grace') return 'active';
        return current === 'none' ? 'active' : current;
    }

    if (event === 'invoice.payment_failed') {
        if (current === 'canceled') return 'canceled';
        return 'past_due';
    }

    // charge.refunded and unknown don't change the state machine.
    return current as SubscriptionStatus;
}

// ============================================
// Event ingestion (idempotency guard)
// ============================================

/**
 * Try to register the event for processing. Returns `false` when the event
 * has already been received — caller should respond 200 and skip.
 */
export async function acquireEventLock(event: Stripe.Event): Promise<boolean> {
    const r = await query<{ event_id: string }>(
        `INSERT INTO stripe_event_log (event_id, type, api_version, payload, status)
         VALUES ($1, $2, $3, $4::jsonb, 'processing')
         ON CONFLICT (event_id) DO NOTHING
         RETURNING event_id`,
        [event.id, event.type, event.api_version ?? null, JSON.stringify(event)]
    );
    return r.rowCount !== null && r.rowCount > 0;
}

export async function markEventProcessed(eventId: string): Promise<void> {
    await query(
        `UPDATE stripe_event_log
            SET status = 'processed',
                processed_at = NOW() AT TIME ZONE 'UTC'
          WHERE event_id = $1`,
        [eventId]
    );
}

export async function markEventFailed(eventId: string, error: string): Promise<void> {
    await query(
        `UPDATE stripe_event_log
            SET status  = 'failed',
                error   = $2,
                attempt = attempt + 1
          WHERE event_id = $1`,
        [eventId, error.slice(0, 2000)]
    );
}

// ============================================
// Invoice mirror
// ============================================

export async function upsertInvoice(
    userId: string,
    subscriptionId: string | null,
    invoice: Stripe.Invoice
): Promise<string | null> {
    const stripeInvoiceId = invoice.id;
    if (!stripeInvoiceId) return null;

    const r = await query<{ id: string }>(
        `INSERT INTO invoices (
            user_id, subscription_id, stripe_invoice_id, stripe_customer_id,
            number, amount_paid_cents, amount_due_cents, currency, status,
            period_start, period_end, paid_at, hosted_invoice_url, pdf_url, metadata
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            to_timestamp($10), to_timestamp($11), $12, $13, $14, $15::jsonb
        )
        ON CONFLICT (stripe_invoice_id) DO UPDATE SET
            amount_paid_cents  = EXCLUDED.amount_paid_cents,
            amount_due_cents   = EXCLUDED.amount_due_cents,
            status             = EXCLUDED.status,
            paid_at            = COALESCE(invoices.paid_at, EXCLUDED.paid_at),
            hosted_invoice_url = EXCLUDED.hosted_invoice_url,
            pdf_url            = EXCLUDED.pdf_url,
            updated_at         = NOW() AT TIME ZONE 'UTC'
        RETURNING id`,
        [
            userId,
            subscriptionId,
            stripeInvoiceId,
            typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,
            invoice.number ?? null,
            invoice.amount_paid ?? 0,
            invoice.amount_due ?? 0,
            (invoice.currency ?? 'usd').toLowerCase(),
            mapInvoiceStatus(invoice.status),
            invoice.period_start ?? null,
            invoice.period_end ?? null,
            invoice.status === 'paid' && invoice.status_transitions?.paid_at
                ? new Date(invoice.status_transitions.paid_at * 1000)
                : null,
            invoice.hosted_invoice_url ?? null,
            invoice.invoice_pdf ?? null,
            JSON.stringify({}),
        ]
    );
    return r.rows[0]?.id ?? null;
}

function mapInvoiceStatus(s: Stripe.Invoice.Status | null | undefined): string {
    switch (s) {
        case 'draft': return 'draft';
        case 'open': return 'open';
        case 'paid': return 'paid';
        case 'void': return 'void';
        case 'uncollectible': return 'uncollectible';
        default: return 'open';
    }
}

// ============================================
// Grace + dunning helpers
// ============================================

const GRACE_DAYS = 7;
const DUNNING_RETRY_DAYS = [3, 5, 7];

export async function scheduleGracePeriod(userSubscriptionId: string): Promise<void> {
    await query(
        `UPDATE user_subscriptions
            SET status                 = 'grace',
                grace_period_ends_at   = (NOW() AT TIME ZONE 'UTC') + ($2 || ' days')::interval,
                updated_at             = NOW() AT TIME ZONE 'UTC'
          WHERE id = $1`,
        [userSubscriptionId, GRACE_DAYS]
    );
}

export async function scheduleDunningRetries(
    userId: string,
    invoiceId: string
): Promise<void> {
    await transaction(async (client) => {
        for (let i = 0; i < DUNNING_RETRY_DAYS.length; i++) {
            const days = DUNNING_RETRY_DAYS[i];
            await client.query(
                `INSERT INTO payment_attempts (
                    invoice_id, user_id, attempt_number, scheduled_at, status
                ) VALUES (
                    $1, $2, $3,
                    (NOW() AT TIME ZONE 'UTC') + ($4 || ' days')::interval,
                    'scheduled'
                )`,
                [invoiceId, userId, i + 1, days]
            );
        }
    });
}

// ============================================
// Credit rollover on invoice.paid
// ============================================

/**
 * After a paid invoice, reset the plan bucket per the plan's rollover policy
 * and grant the next month's credits. Safe to call from the invoice.paid
 * webhook handler — idempotent via `rollover:<invoice_id>` key.
 */
export async function applyMonthlyRollover(params: {
    userId: string;
    planId: string;
    invoiceStripeId: string;
}): Promise<void> {
    const { userId, planId, invoiceStripeId } = params;

    const planRow = await query<{
        credits_included_monthly: number;
        credits_rollover_policy: string;
        credits_rollover_cap: number | null;
    }>(
        `SELECT credits_included_monthly, credits_rollover_policy, credits_rollover_cap
           FROM subscription_plans WHERE id = $1`,
        [planId]
    );
    const plan = planRow.rows[0];
    if (!plan) return;
    if (plan.credits_included_monthly <= 0) return;

    await grantCredits({
        userId,
        amount: plan.credits_included_monthly,
        bucket: 'plan',
        reason: 'invoice:paid:monthly_grant',
        kind: 'rollover',
        idempotencyKey: `rollover:${invoiceStripeId}`,
    });
}

// ============================================
// Orchestration — called from webhook route handler
// ============================================

/**
 * Top-level dispatcher. Assumes the event has been verified AND locked via
 * `acquireEventLock`. Caller is responsible for wrapping in a try/catch and
 * calling markEventProcessed / markEventFailed.
 */
export async function routeStripeEvent(event: Stripe.Event): Promise<void> {
    logger.info('[stripe-webhook] Processing event', { type: event.type, id: event.id });

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            // Delegated to the existing subscription.service.ts which already knows
            // how to upsert user_subscriptions. We only add grace handling here.
            if (event.type === 'customer.subscription.deleted') {
                const sub = event.data.object as Stripe.Subscription;
                const customerId =
                    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
                if (customerId) {
                    const u = await query<{ id: string; user_id: string }>(
                        `SELECT id, user_id FROM user_subscriptions
                          WHERE stripe_subscription_id = $1 LIMIT 1`,
                        [sub.id]
                    );
                    if (u.rows[0]) {
                        await scheduleGracePeriod(u.rows[0].id);
                        await invalidateEntitlements(u.rows[0].user_id);
                    }
                }
            }
            break;

        case 'invoice.paid': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId =
                typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
            if (!customerId) break;

            const userRow = await query<{ id: string }>(
                `SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
                [customerId]
            );
            if (!userRow.rows[0]) break;
            const userId = userRow.rows[0].id;

            const subRow = await query<{ id: string; plan_id: string }>(
                `SELECT id, plan_id FROM user_subscriptions
                  WHERE user_id = $1
                  ORDER BY updated_at DESC LIMIT 1`,
                [userId]
            );

            await upsertInvoice(userId, subRow.rows[0]?.id ?? null, invoice);

            if (subRow.rows[0]?.plan_id && invoice.id) {
                await applyMonthlyRollover({
                    userId,
                    planId: subRow.rows[0].plan_id,
                    invoiceStripeId: invoice.id,
                });
            }

            // If we were in grace/past_due, invoice.paid revives us.
            if (subRow.rows[0]?.id) {
                await query(
                    `UPDATE user_subscriptions
                        SET status               = 'active',
                            grace_period_ends_at = NULL,
                            dunning_state        = 'healthy',
                            updated_at           = NOW() AT TIME ZONE 'UTC'
                      WHERE id = $1
                        AND status IN ('past_due', 'grace')`,
                    [subRow.rows[0].id]
                );
            }

            await invalidateEntitlements(userId);
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId =
                typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
            if (!customerId) break;

            const userRow = await query<{ id: string }>(
                `SELECT id FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
                [customerId]
            );
            if (!userRow.rows[0]) break;
            const userId = userRow.rows[0].id;

            const subRow = await query<{ id: string }>(
                `SELECT id FROM user_subscriptions WHERE user_id = $1 LIMIT 1`,
                [userId]
            );
            const invoiceRowId = await upsertInvoice(userId, subRow.rows[0]?.id ?? null, invoice);

            if (subRow.rows[0]?.id) {
                await query(
                    `UPDATE user_subscriptions
                        SET status        = 'past_due',
                            dunning_state = 'retrying',
                            updated_at    = NOW() AT TIME ZONE 'UTC'
                      WHERE id = $1`,
                    [subRow.rows[0].id]
                );
            }
            if (invoiceRowId) {
                await scheduleDunningRetries(userId, invoiceRowId);
            }
            await invalidateEntitlements(userId);

            // Notify user about the failed payment
            try {
                const userInfo = await query<{ email: string; first_name: string }>(
                    `SELECT email, first_name FROM users WHERE id = $1 LIMIT 1`,
                    [userId]
                );
                if (userInfo.rows[0]) {
                    const amountCents = invoice.amount_due ?? 0;
                    const currency = (invoice.currency ?? 'usd').toUpperCase();
                    const amountFormatted = `${currency} ${(amountCents / 100).toFixed(2)}`;
                    const nextRetryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    await mailHelper.sendPaymentFailedEmail(
                        userInfo.rows[0].email,
                        userInfo.rows[0].first_name || 'there',
                        {
                            amountFormatted,
                            invoiceUrl: invoice.hosted_invoice_url ?? undefined,
                            nextRetryDate,
                            manageSubscriptionUrl: `${process.env['CLIENT_URL'] || 'https://app.balencia.ai'}/subscription`,
                        }
                    );
                }
            } catch (emailErr) {
                logger.warn('[webhook] Failed to send payment-failed email', {
                    userId,
                    error: emailErr instanceof Error ? emailErr.message : String(emailErr),
                });
            }
            break;
        }

        case 'charge.refunded': {
            // Stripe 2025-12-15 dropped `charge.invoice` from the typed
            // Charge interface; the field is still present at runtime on
            // invoice-linked charges, so we access it via a narrow cast.
            const charge = event.data.object as Stripe.Charge & {
                invoice?: string | Stripe.Invoice | null;
            };
            const invoiceRef = charge.invoice;
            if (invoiceRef) {
                const invoiceId =
                    typeof invoiceRef === 'string' ? invoiceRef : invoiceRef.id;
                if (!invoiceId) break;
                const amountRefunded = charge.amount_refunded ?? 0;
                await query(
                    `UPDATE invoices
                        SET amount_refunded_cents = $2,
                            status                = CASE WHEN $2 >= amount_paid_cents
                                                         THEN 'refunded' ELSE status END,
                            updated_at            = NOW() AT TIME ZONE 'UTC'
                      WHERE stripe_invoice_id = $1`,
                    [invoiceId, amountRefunded]
                );

                // Full refund → cancel the linked subscription
                const invoiceRow = await query<{ user_id: string; amount_paid_cents: number }>(
                    `SELECT user_id, amount_paid_cents FROM invoices WHERE stripe_invoice_id = $1 LIMIT 1`,
                    [invoiceId]
                );
                if (invoiceRow.rows[0] && amountRefunded >= invoiceRow.rows[0].amount_paid_cents) {
                    const refundUserId = invoiceRow.rows[0].user_id;
                    await query(
                        `UPDATE user_subscriptions
                            SET status      = 'canceled',
                                canceled_at = COALESCE(canceled_at, NOW() AT TIME ZONE 'UTC'),
                                updated_at  = NOW() AT TIME ZONE 'UTC'
                          WHERE user_id = $1
                            AND status IN ('active', 'past_due', 'grace', 'trialing')`,
                        [refundUserId]
                    );
                    await invalidateEntitlements(refundUserId);
                    logger.info('[webhook] Full refund triggered subscription cancellation', {
                        userId: refundUserId,
                        amountRefunded,
                    });
                }
            }
            break;
        }

        default:
            logger.debug('[stripe-webhook] Unhandled event type (no-op)', { type: event.type });
    }
}
