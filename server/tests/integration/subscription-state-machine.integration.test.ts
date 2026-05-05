/**
 * Subscription State Machine Tests
 *
 * Exhaustively tests the nextSubscriptionStatus() pure function for all
 * meaningful state × event combinations.
 */

import { nextSubscriptionStatus } from '../../src/services/stripe-webhook.service.js';

describe('nextSubscriptionStatus — state machine', () => {
  // ---------------------------------------------------------------
  // subscription.created / subscription.updated
  // ---------------------------------------------------------------
  describe('subscription.created / subscription.updated', () => {
    it.each([
      ['trialing', 'trialing'],
      ['active', 'active'],
      ['past_due', 'past_due'],
      ['canceled', 'canceled'],
      ['incomplete', 'incomplete'],
      ['incomplete_expired', 'incomplete_expired'],
      ['unpaid', 'past_due'],
      ['paused', 'paused'],
    ] as const)('maps Stripe status %s → %s', (stripeStatus, expected) => {
      expect(nextSubscriptionStatus('none', 'subscription.created', stripeStatus as any)).toBe(expected);
      expect(nextSubscriptionStatus('active', 'subscription.updated', stripeStatus as any)).toBe(expected);
    });

    it('preserves current status when Stripe status is undefined', () => {
      expect(nextSubscriptionStatus('active', 'subscription.updated')).toBe('active');
      expect(nextSubscriptionStatus('past_due', 'subscription.updated')).toBe('past_due');
    });

    it('defaults to active for new subscriptions without Stripe status', () => {
      expect(nextSubscriptionStatus('none', 'subscription.created')).toBe('active');
    });
  });

  // ---------------------------------------------------------------
  // subscription.deleted
  // ---------------------------------------------------------------
  describe('subscription.deleted', () => {
    it('transitions to grace from active', () => {
      expect(nextSubscriptionStatus('active', 'subscription.deleted')).toBe('grace');
    });

    it('transitions to grace from past_due', () => {
      expect(nextSubscriptionStatus('past_due', 'subscription.deleted')).toBe('grace');
    });

    it('transitions to grace from trialing', () => {
      expect(nextSubscriptionStatus('trialing', 'subscription.deleted')).toBe('grace');
    });

    it('stays canceled if already canceled', () => {
      expect(nextSubscriptionStatus('canceled', 'subscription.deleted')).toBe('canceled');
    });
  });

  // ---------------------------------------------------------------
  // invoice.paid
  // ---------------------------------------------------------------
  describe('invoice.paid', () => {
    it('revives past_due → active', () => {
      expect(nextSubscriptionStatus('past_due', 'invoice.paid')).toBe('active');
    });

    it('revives grace → active', () => {
      expect(nextSubscriptionStatus('grace', 'invoice.paid')).toBe('active');
    });

    it('no-op when already active', () => {
      expect(nextSubscriptionStatus('active', 'invoice.paid')).toBe('active');
    });

    it('defaults to active for new (none) status', () => {
      expect(nextSubscriptionStatus('none', 'invoice.paid')).toBe('active');
    });

    it('preserves trialing', () => {
      expect(nextSubscriptionStatus('trialing', 'invoice.paid')).toBe('trialing');
    });
  });

  // ---------------------------------------------------------------
  // invoice.payment_failed
  // ---------------------------------------------------------------
  describe('invoice.payment_failed', () => {
    it('transitions active → past_due', () => {
      expect(nextSubscriptionStatus('active', 'invoice.payment_failed')).toBe('past_due');
    });

    it('transitions trialing → past_due', () => {
      expect(nextSubscriptionStatus('trialing', 'invoice.payment_failed')).toBe('past_due');
    });

    it('stays past_due if already past_due', () => {
      expect(nextSubscriptionStatus('past_due', 'invoice.payment_failed')).toBe('past_due');
    });

    it('stays canceled if already canceled', () => {
      expect(nextSubscriptionStatus('canceled', 'invoice.payment_failed')).toBe('canceled');
    });

    it('transitions none → past_due', () => {
      expect(nextSubscriptionStatus('none', 'invoice.payment_failed')).toBe('past_due');
    });
  });

  // ---------------------------------------------------------------
  // charge.refunded (no-op)
  // ---------------------------------------------------------------
  describe('charge.refunded', () => {
    it('does not change any status', () => {
      expect(nextSubscriptionStatus('active', 'charge.refunded')).toBe('active');
      expect(nextSubscriptionStatus('past_due', 'charge.refunded')).toBe('past_due');
      expect(nextSubscriptionStatus('canceled', 'charge.refunded')).toBe('canceled');
      expect(nextSubscriptionStatus('grace', 'charge.refunded')).toBe('grace');
    });
  });

  // ---------------------------------------------------------------
  // unknown events (no-op)
  // ---------------------------------------------------------------
  describe('unknown events', () => {
    it('does not change any status', () => {
      expect(nextSubscriptionStatus('active', 'unknown')).toBe('active');
      expect(nextSubscriptionStatus('past_due', 'unknown')).toBe('past_due');
      expect(nextSubscriptionStatus('canceled', 'unknown')).toBe('canceled');
    });
  });
});
