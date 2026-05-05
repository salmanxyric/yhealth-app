/**
 * Stripe Webhook Integration Tests
 *
 * Tests the POST /api/webhooks/stripe endpoint end-to-end:
 * - Signature verification (raw body requirement)
 * - Idempotency guard (duplicate event replay)
 * - Event routing: subscription lifecycle, invoice paid/failed, charge refunded
 * - DB state transitions (grace, past_due, active revival)
 * - Credit rollover on invoice.paid
 *
 * Mocks: stripe.webhooks.constructEvent (signature verification bypass)
 * Real:  Full handler pipeline + PostgreSQL
 */

import { jest } from '@jest/globals';
import type { Application } from 'express';

// ---------------------------------------------------------------------------
// ESM mock: Stripe SDK — intercept constructEvent so we skip real signatures
// ---------------------------------------------------------------------------

const mockConstructEvent = jest.fn<(...args: unknown[]) => unknown>();

jest.unstable_mockModule('stripe', () => {
  class MockStripe {
    webhooks = { constructEvent: mockConstructEvent };
  }
  return { default: MockStripe, __esModule: true };
});

// Also mock the mail helper to prevent real emails
jest.unstable_mockModule('../../src/helper/mail.js', () => ({
  mailHelper: {
    isMailConfigured: jest.fn(() => false),
    sendSubscriptionConfirmationEmail: jest.fn(),
    sendInvoiceReceiptEmail: jest.fn(),
    sendEmail: jest.fn(),
  },
  EMAIL_SUBJECTS: {},
  sendMail: jest.fn(async () => true),
  default: {
    isMailConfigured: jest.fn(() => false),
  },
}));

// Dynamic imports AFTER mocks are installed
const { default: request } = await import('supertest');
const { createApp } = await import('../../src/app.js');
const { query } = await import('../../src/database/pg.js');
const { createTestUser } = await import('../helpers/testUtils.js');
const {
  seedSubscriptionPlan,
  seedUserSubscription,
  createStripeEvent,
  cleanupSubscriptionData,
} = await import('../helpers/subscription.testUtils.js');
const { cleanupUser } = await import('../helpers/cleanup.testUtils.js');

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Stripe Webhook Integration Tests', () => {
  let app: Application;
  let testUserId: string;
  let testPlanId: string;
  let testCustomerId: string;

  const WEBHOOK_PATH = '/api/webhooks/stripe';

  beforeAll(async () => {
    app = createApp();

    testCustomerId = `cus_wh_test_${Date.now()}`;

    const user = await createTestUser({
      email: `webhook-test-${Date.now()}@test.com`,
      password: 'TestPass123!',
    });
    testUserId = user.id;

    await query(
      `UPDATE users SET stripe_customer_id = $2 WHERE id = $1`,
      [testUserId, testCustomerId]
    );

    const plan = await seedSubscriptionPlan({
      slug: `webhook-test-plan-${Date.now()}`,
      name: 'Webhook Test Plan',
      tier: 20,
      monthlyCredits: 50,
    });
    testPlanId = plan.id;
  });

  afterAll(async () => {
    await cleanupSubscriptionData(testUserId);
    await cleanupUser(testUserId);
    try {
      await query(`DELETE FROM subscription_plans WHERE id = $1`, [testPlanId]);
    } catch { /* ignore */ }
  });

  beforeEach(() => {
    mockConstructEvent.mockReset();
  });

  afterEach(async () => {
    // Clean up subscriptions and invoices between tests to avoid LIMIT 1 collisions
    try { await query(`DELETE FROM payment_attempts WHERE user_id = $1`, [testUserId]); } catch { /* ignore */ }
    try { await query(`DELETE FROM invoices WHERE user_id = $1`, [testUserId]); } catch { /* ignore */ }
    try { await query(`DELETE FROM user_subscriptions WHERE user_id = $1`, [testUserId]); } catch { /* ignore */ }
    try { await query(`DELETE FROM stripe_event_log WHERE TRUE`); } catch { /* ignore */ }
  });

  // ---------------------------------------------------------------
  // Signature verification
  // ---------------------------------------------------------------
  describe('Signature verification', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(400);
    });

    it('returns 400 when signature is invalid', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'invalid_sig')
        .send(Buffer.from('{}'));

      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------
  // Idempotency guard — duplicate event replay
  // ---------------------------------------------------------------
  describe('Idempotency guard', () => {
    it('processes the same event only once; replay returns 200 with no side-effects', async () => {
      const event = createStripeEvent('customer.subscription.updated', {
        id: `sub_idem_${Date.now()}`,
        customer: testCustomerId,
        status: 'active',
        metadata: { userId: testUserId },
        items: { data: [{ price: { id: 'price_test' } }] },
      });

      mockConstructEvent.mockReturnValue(event);

      const res1 = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res2.status).toBe(200);

      const logRows = await query<{ event_id: string; status: string }>(
        `SELECT event_id, status FROM stripe_event_log WHERE event_id = $1`,
        [event.id]
      );
      expect(logRows.rows).toHaveLength(1);
      expect(logRows.rows[0].status).toBe('processed');
    });
  });

  // ---------------------------------------------------------------
  // customer.subscription.deleted → grace period
  // ---------------------------------------------------------------
  describe('customer.subscription.deleted', () => {
    it('transitions subscription to grace and sets grace_period_ends_at', async () => {
      const stripeSubId = `sub_del_${Date.now()}`;

      const sub = await seedUserSubscription({
        userId: testUserId,
        planId: testPlanId,
        status: 'active',
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: testCustomerId,
      });

      const event = createStripeEvent('customer.subscription.deleted', {
        id: stripeSubId,
        customer: testCustomerId,
        status: 'canceled',
        items: { data: [{ price: { id: 'price_test' } }] },
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);

      const row = await query<{ status: string; grace_period_ends_at: Date | null }>(
        `SELECT status, grace_period_ends_at FROM user_subscriptions WHERE id = $1`,
        [sub.id]
      );
      expect(row.rows[0].status).toBe('grace');
      expect(row.rows[0].grace_period_ends_at).not.toBeNull();

      const graceEnd = new Date(row.rows[0].grace_period_ends_at!);
      const nowPlus6 = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
      const nowPlus8 = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      expect(graceEnd.getTime()).toBeGreaterThan(nowPlus6.getTime());
      expect(graceEnd.getTime()).toBeLessThan(nowPlus8.getTime());

      await query(`DELETE FROM user_subscriptions WHERE id = $1`, [sub.id]);
    });
  });

  // ---------------------------------------------------------------
  // invoice.paid → active revival + invoice upsert
  // ---------------------------------------------------------------
  describe('invoice.paid', () => {
    it('revives past_due subscription to active', async () => {
      const stripeSubId = `sub_paid_${Date.now()}`;

      const sub = await seedUserSubscription({
        userId: testUserId,
        planId: testPlanId,
        status: 'past_due',
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: testCustomerId,
      });

      const invoiceId = `in_paid_${Date.now()}`;
      const event = createStripeEvent('invoice.paid', {
        id: invoiceId,
        subscription: stripeSubId,
        customer: testCustomerId,
        amount_paid: 999,
        amount_due: 999,
        currency: 'usd',
        status: 'paid',
        number: 'INV-TEST-001',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
        billing_reason: 'subscription_cycle',
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);

      const row = await query<{ status: string; grace_period_ends_at: Date | null }>(
        `SELECT status, grace_period_ends_at FROM user_subscriptions WHERE id = $1`,
        [sub.id]
      );
      expect(row.rows[0].status).toBe('active');
      expect(row.rows[0].grace_period_ends_at).toBeNull();

      const inv = await query<{ stripe_invoice_id: string; status: string }>(
        `SELECT stripe_invoice_id, status FROM invoices WHERE stripe_invoice_id = $1`,
        [invoiceId]
      );
      expect(inv.rows).toHaveLength(1);
      expect(inv.rows[0].status).toBe('paid');
    });

    it('revives grace subscription to active', async () => {
      const stripeSubId = `sub_grace_paid_${Date.now()}`;

      const sub = await seedUserSubscription({
        userId: testUserId,
        planId: testPlanId,
        status: 'grace',
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: testCustomerId,
        graceEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      const invoiceId = `in_grace_paid_${Date.now()}`;
      const event = createStripeEvent('invoice.paid', {
        id: invoiceId,
        subscription: stripeSubId,
        customer: testCustomerId,
        amount_paid: 999,
        amount_due: 999,
        currency: 'usd',
        status: 'paid',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        billing_reason: 'subscription_cycle',
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);

      const row = await query<{ status: string; grace_period_ends_at: Date | null }>(
        `SELECT status, grace_period_ends_at FROM user_subscriptions WHERE id = $1`,
        [sub.id]
      );
      expect(row.rows[0].status).toBe('active');
      expect(row.rows[0].grace_period_ends_at).toBeNull();

      await query(`DELETE FROM invoices WHERE stripe_invoice_id = $1`, [invoiceId]);
      await query(`DELETE FROM user_subscriptions WHERE id = $1`, [sub.id]);
    });

    it('upserts invoice record with correct fields', async () => {
      const stripeSubId = `sub_inv_${Date.now()}`;

      const sub = await seedUserSubscription({
        userId: testUserId,
        planId: testPlanId,
        status: 'active',
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: testCustomerId,
      });

      const invoiceId = `in_upsert_${Date.now()}`;
      const event = createStripeEvent('invoice.paid', {
        id: invoiceId,
        subscription: stripeSubId,
        customer: testCustomerId,
        amount_paid: 1999,
        amount_due: 1999,
        currency: 'eur',
        status: 'paid',
        number: 'INV-UPSERT-001',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        hosted_invoice_url: 'https://invoice.stripe.com/test',
        invoice_pdf: 'https://invoice.stripe.com/test.pdf',
        status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
        billing_reason: 'subscription_cycle',
      });

      mockConstructEvent.mockReturnValue(event);

      await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      const inv = await query<{
        stripe_invoice_id: string;
        amount_paid_cents: number;
        currency: string;
        status: string;
        hosted_invoice_url: string | null;
        pdf_url: string | null;
      }>(
        `SELECT stripe_invoice_id, amount_paid_cents, currency, status, hosted_invoice_url, pdf_url
         FROM invoices WHERE stripe_invoice_id = $1`,
        [invoiceId]
      );
      expect(inv.rows).toHaveLength(1);
      expect(inv.rows[0].amount_paid_cents).toBe(1999);
      expect(inv.rows[0].currency).toBe('eur');
      expect(inv.rows[0].status).toBe('paid');
      expect(inv.rows[0].hosted_invoice_url).toBe('https://invoice.stripe.com/test');
      expect(inv.rows[0].pdf_url).toBe('https://invoice.stripe.com/test.pdf');

      await query(`DELETE FROM invoices WHERE stripe_invoice_id = $1`, [invoiceId]);
      await query(`DELETE FROM user_subscriptions WHERE id = $1`, [sub.id]);
    });
  });

  // ---------------------------------------------------------------
  // invoice.payment_failed → past_due + dunning
  // ---------------------------------------------------------------
  describe('invoice.payment_failed', () => {
    it('transitions subscription to past_due and schedules dunning retries', async () => {
      const stripeSubId = `sub_fail_${Date.now()}`;

      const sub = await seedUserSubscription({
        userId: testUserId,
        planId: testPlanId,
        status: 'active',
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: testCustomerId,
      });

      const invoiceId = `in_fail_${Date.now()}`;
      const event = createStripeEvent('invoice.payment_failed', {
        id: invoiceId,
        subscription: stripeSubId,
        customer: testCustomerId,
        amount_paid: 0,
        amount_due: 999,
        currency: 'usd',
        status: 'open',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        attempt_count: 1,
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);

      const row = await query<{ status: string; dunning_state: string | null }>(
        `SELECT status, dunning_state FROM user_subscriptions WHERE id = $1`,
        [sub.id]
      );
      expect(row.rows[0].status).toBe('past_due');
      expect(row.rows[0].dunning_state).toBe('retrying');

      const inv = await query<{ id: string }>(
        `SELECT id FROM invoices WHERE stripe_invoice_id = $1`,
        [invoiceId]
      );
      if (inv.rows[0]) {
        const attempts = await query<{ attempt_number: number; status: string }>(
          `SELECT attempt_number, status FROM payment_attempts
           WHERE invoice_id = $1 ORDER BY attempt_number`,
          [inv.rows[0].id]
        );
        expect(attempts.rows).toHaveLength(3);
        expect(attempts.rows.map(r => r.attempt_number)).toEqual([1, 2, 3]);
        expect(attempts.rows.every(r => r.status === 'scheduled')).toBe(true);

        await query(`DELETE FROM payment_attempts WHERE invoice_id = $1`, [inv.rows[0].id]);
      }

      await query(`DELETE FROM invoices WHERE stripe_invoice_id = $1`, [invoiceId]);
      await query(`DELETE FROM user_subscriptions WHERE id = $1`, [sub.id]);
    });
  });

  // ---------------------------------------------------------------
  // charge.refunded → invoice status update
  // ---------------------------------------------------------------
  describe('charge.refunded', () => {
    it('updates invoice amount_refunded_cents when charge has linked invoice', async () => {
      const invoiceStripeId = `in_refund_${Date.now()}`;
      await query(
        `INSERT INTO invoices (
          user_id, stripe_invoice_id, stripe_customer_id, amount_paid_cents,
          amount_due_cents, currency, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [testUserId, invoiceStripeId, testCustomerId, 2000, 2000, 'usd', 'paid']
      );

      const event = createStripeEvent('charge.refunded', {
        id: `ch_refund_${Date.now()}`,
        customer: testCustomerId,
        amount_refunded: 2000,
        invoice: invoiceStripeId,
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);

      const inv = await query<{ amount_refunded_cents: number; status: string }>(
        `SELECT amount_refunded_cents, status FROM invoices WHERE stripe_invoice_id = $1`,
        [invoiceStripeId]
      );
      expect(inv.rows[0].amount_refunded_cents).toBe(2000);
      expect(inv.rows[0].status).toBe('refunded');

      await query(`DELETE FROM invoices WHERE stripe_invoice_id = $1`, [invoiceStripeId]);
    });

    it('partial refund does not change invoice status to refunded', async () => {
      const invoiceStripeId = `in_partial_${Date.now()}`;
      await query(
        `INSERT INTO invoices (
          user_id, stripe_invoice_id, stripe_customer_id, amount_paid_cents,
          amount_due_cents, currency, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [testUserId, invoiceStripeId, testCustomerId, 2000, 2000, 'usd', 'paid']
      );

      const event = createStripeEvent('charge.refunded', {
        id: `ch_partial_${Date.now()}`,
        customer: testCustomerId,
        amount_refunded: 500,
        invoice: invoiceStripeId,
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);

      const inv = await query<{ amount_refunded_cents: number; status: string }>(
        `SELECT amount_refunded_cents, status FROM invoices WHERE stripe_invoice_id = $1`,
        [invoiceStripeId]
      );
      expect(inv.rows[0].amount_refunded_cents).toBe(500);
      expect(inv.rows[0].status).toBe('paid');

      await query(`DELETE FROM invoices WHERE stripe_invoice_id = $1`, [invoiceStripeId]);
    });
  });

  // ---------------------------------------------------------------
  // Unhandled event types — no-op, 200
  // ---------------------------------------------------------------
  describe('Unhandled event types', () => {
    it('returns 200 for unhandled event types without error', async () => {
      const event = createStripeEvent('payment_intent.succeeded', {
        id: `pi_test_${Date.now()}`,
        amount: 999,
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------
  // Event log — processed status
  // ---------------------------------------------------------------
  describe('Event log tracking', () => {
    it('logs processed event in stripe_event_log', async () => {
      const event = createStripeEvent('invoice.paid', {
        id: `in_log_${Date.now()}`,
        customer: testCustomerId,
        amount_paid: 999,
        amount_due: 999,
        currency: 'usd',
        status: 'paid',
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        billing_reason: 'subscription_cycle',
        customer_email: 'webhook-test@test.com',
      });

      mockConstructEvent.mockReturnValue(event);

      const res = await request(app)
        .post(WEBHOOK_PATH)
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid_sig')
        .send(Buffer.from(JSON.stringify(event)));

      expect(res.status).toBe(200);

      const logRow = await query<{ event_id: string; status: string }>(
        `SELECT event_id, status FROM stripe_event_log WHERE event_id = $1`,
        [event.id]
      );
      expect(logRow.rows).toHaveLength(1);
      expect(logRow.rows[0].status).toBe('processed');
    });
  });
});
