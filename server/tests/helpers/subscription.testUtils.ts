/**
 * Subscription & Billing test utilities.
 * Seed subscription plans, user subscriptions, and Stripe event fixtures.
 */

import { query } from '../../src/database/pg.js';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Subscription Plan seeding
// ---------------------------------------------------------------------------

export interface SeedPlanOptions {
  slug?: string;
  name?: string;
  amountCents?: number;
  currency?: string;
  interval?: 'month' | 'year';
  tier?: number;
  isActive?: boolean;
  stripePriceId?: string;
  trialDays?: number;
  monthlyCredits?: number;
}

export async function seedSubscriptionPlan(opts: SeedPlanOptions = {}): Promise<{
  id: string;
  slug: string;
  tier: number;
}> {
  const slug = opts.slug ?? `test-plan-${Date.now()}`;
  const name = opts.name ?? slug;
  const tier = opts.tier ?? 20;
  const amountCents = opts.amountCents ?? 999;
  const currency = opts.currency ?? 'USD';
  const interval = opts.interval ?? 'month';
  const isActive = opts.isActive ?? true;
  const stripePriceId = opts.stripePriceId ?? `price_test_${Date.now()}`;
  const trialDays = opts.trialDays ?? 0;
  const monthlyCredits = opts.monthlyCredits ?? 100;

  const r = await query<{ id: string; slug: string; tier: number }>(
    `INSERT INTO subscription_plans (
      slug, name, amount_cents, currency, interval, tier,
      is_active, stripe_price_id, trial_days, credits_included_monthly,
      features, sort_order
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (slug) DO UPDATE SET
      tier = EXCLUDED.tier,
      is_active = EXCLUDED.is_active,
      credits_included_monthly = EXCLUDED.credits_included_monthly,
      stripe_price_id = EXCLUDED.stripe_price_id,
      updated_at = NOW() AT TIME ZONE 'UTC'
    RETURNING id, slug, tier`,
    [slug, name, amountCents, currency, interval, tier,
     isActive, stripePriceId, trialDays, monthlyCredits,
     JSON.stringify([]), 0]
  );
  return r.rows[0];
}

// ---------------------------------------------------------------------------
// User Subscription seeding
// ---------------------------------------------------------------------------

export interface SeedSubscriptionOptions {
  userId: string;
  planId: string;
  status?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  graceEndsAt?: Date | null;
}

export async function seedUserSubscription(opts: SeedSubscriptionOptions): Promise<{
  id: string;
  status: string;
}> {
  const status = opts.status ?? 'active';
  const stripeSubId = opts.stripeSubscriptionId ?? `sub_test_${Date.now()}`;
  const stripeCustId = opts.stripeCustomerId ?? `cus_test_${Date.now()}`;
  const now = new Date();
  const periodStart = opts.currentPeriodStart ?? now;
  const periodEnd = opts.currentPeriodEnd ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const r = await query<{ id: string; status: string }>(
    `INSERT INTO user_subscriptions (
      user_id, plan_id, status,
      stripe_subscription_id, stripe_customer_id,
      current_period_start, current_period_end,
      cancel_at_period_end, canceled_at,
      grace_period_ends_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id, status`,
    [
      opts.userId, opts.planId, status,
      stripeSubId, stripeCustId,
      periodStart, periodEnd,
      opts.cancelAtPeriodEnd ?? false,
      opts.canceledAt ?? null,
      opts.graceEndsAt ?? null,
    ]
  );
  return r.rows[0];
}

// ---------------------------------------------------------------------------
// Stripe Event fixtures
// ---------------------------------------------------------------------------

export function createStripeEvent(
  type: string,
  data: Record<string, unknown> = {},
  overrides: Partial<{ id: string; created: number }> = {}
): {
  id: string;
  object: 'event';
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
  livemode: boolean;
  api_version: string;
} {
  return {
    id: overrides.id ?? `evt_test_${crypto.randomUUID().replace(/-/g, '')}`,
    object: 'event' as const,
    type,
    created: overrides.created ?? Math.floor(Date.now() / 1000),
    data: { object: data },
    livemode: false,
    api_version: '2025-12-15.clover',
  };
}

export function createCheckoutCompletedEvent(opts: {
  subscriptionId?: string;
  customerId?: string;
  customerEmail?: string;
  mode?: string;
} = {}) {
  return createStripeEvent('checkout.session.completed', {
    id: `cs_test_${Date.now()}`,
    mode: opts.mode ?? 'subscription',
    subscription: opts.subscriptionId ?? `sub_test_${Date.now()}`,
    customer: opts.customerId ?? `cus_test_${Date.now()}`,
    customer_email: opts.customerEmail ?? 'test@example.com',
    payment_status: 'paid',
    status: 'complete',
  });
}

export function createInvoicePaidEvent(opts: {
  subscriptionId?: string;
  customerId?: string;
  amountPaid?: number;
} = {}) {
  return createStripeEvent('invoice.paid', {
    id: `in_test_${Date.now()}`,
    subscription: opts.subscriptionId ?? `sub_test_${Date.now()}`,
    customer: opts.customerId ?? `cus_test_${Date.now()}`,
    amount_paid: opts.amountPaid ?? 999,
    status: 'paid',
    billing_reason: 'subscription_cycle',
  });
}

export function createInvoicePaymentFailedEvent(opts: {
  subscriptionId?: string;
  customerId?: string;
} = {}) {
  return createStripeEvent('invoice.payment_failed', {
    id: `in_test_${Date.now()}`,
    subscription: opts.subscriptionId ?? `sub_test_${Date.now()}`,
    customer: opts.customerId ?? `cus_test_${Date.now()}`,
    status: 'open',
    attempt_count: 1,
    next_payment_attempt: Math.floor(Date.now() / 1000) + 259200,
  });
}

export function createSubscriptionDeletedEvent(opts: {
  subscriptionId?: string;
  customerId?: string;
  planId?: string;
} = {}) {
  return createStripeEvent('customer.subscription.deleted', {
    id: opts.subscriptionId ?? `sub_test_${Date.now()}`,
    customer: opts.customerId ?? `cus_test_${Date.now()}`,
    status: 'canceled',
    items: { data: [{ price: { id: opts.planId ?? 'price_test' } }] },
  });
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export async function cleanupSubscriptionData(userId: string): Promise<void> {
  try {
    await query(`DELETE FROM stripe_event_log WHERE TRUE`);
  } catch { /* table may not exist */ }
  try {
    await query(`DELETE FROM user_subscriptions WHERE user_id = $1`, [userId]);
  } catch { /* ignore */ }
}
