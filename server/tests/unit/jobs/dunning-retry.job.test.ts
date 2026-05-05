/**
 * Dunning Retry Job Unit Tests
 *
 * Tests for runDunningRetryJob — processes scheduled payment retry attempts,
 * calls Stripe to retry invoice payment, and handles success/failure outcomes
 * including final dunning_failed state on last attempt.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery } = setupDbMock();
const mockLogger = setupLoggerMock();

// Mock Stripe — constructor must be outer-scoped so beforeEach can restore
// its implementation after resetMocks strips it between tests.
const mockStripePay = jest.fn<any>();
const MockStripeConstructor = jest.fn<any>().mockImplementation(() => ({
  invoices: { pay: mockStripePay },
}));
jest.unstable_mockModule('stripe', () => ({
  default: MockStripeConstructor,
}));

// Mock env config
jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    stripe: { secretKey: 'sk_test_fake' },
  },
}));

// Mock entitlement service
const mockInvalidateEntitlements = jest.fn<any>().mockResolvedValue(undefined);
jest.unstable_mockModule('../../../src/services/entitlement.service.js', () => ({
  invalidateEntitlements: mockInvalidateEntitlements,
}));

// Dynamic import AFTER mocks
const { runDunningRetryJob } = await import('../../../src/jobs/dunning-retry.job.js');

// ============================================
// HELPERS
// ============================================

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attempt-001',
    invoice_id: 'inv-001',
    user_id: 'user-001',
    attempt_number: 1,
    stripe_invoice_id: 'in_stripe_123',
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  MockStripeConstructor.mockImplementation(() => ({
    invoices: { pay: mockStripePay },
  }));
});

describe('runDunningRetryJob', () => {
  it('returns all zeros when no scheduled attempts exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await runDunningRetryJob();

    expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0 });
  });

  describe('successful retry', () => {
    it('marks attempt succeeded, sets subscription active with healthy dunning', async () => {
      const attempt = makeAttempt();

      // SELECT scheduled attempts
      mockQuery.mockResolvedValueOnce({ rows: [attempt] });

      // After stripe.invoices.pay succeeds:
      mockStripePay.mockResolvedValueOnce({ id: 'in_stripe_123', status: 'paid' });

      // UPDATE payment_attempts SET status = 'succeeded'
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // UPDATE user_subscriptions SET status = 'active', dunning_state = 'healthy'
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await runDunningRetryJob();

      expect(result).toEqual({ processed: 1, succeeded: 1, failed: 0 });

      // Verify Stripe was called with the correct invoice ID
      expect(mockStripePay).toHaveBeenCalledWith(attempt.stripe_invoice_id);

      // Verify payment_attempts updated to succeeded
      const attemptUpdateCall = mockQuery.mock.calls[1];
      expect(attemptUpdateCall[0]).toContain("status = 'succeeded'");
      expect(attemptUpdateCall[1]).toEqual([attempt.id]);

      // Verify subscription updated to active + healthy
      const subUpdateCall = mockQuery.mock.calls[2];
      expect(subUpdateCall[0]).toContain("status = 'active'");
      expect(subUpdateCall[0]).toContain("dunning_state = 'healthy'");
      expect(subUpdateCall[1]).toEqual([attempt.user_id]);

      // Verify entitlements invalidated
      expect(mockInvalidateEntitlements).toHaveBeenCalledWith(attempt.user_id);
    });
  });

  describe('failed retry (not last attempt)', () => {
    it('marks attempt failed without setting dunning_failed', async () => {
      const attempt = makeAttempt({ attempt_number: 1 });

      mockQuery.mockResolvedValueOnce({ rows: [attempt] });

      // Stripe pay fails
      mockStripePay.mockRejectedValueOnce(new Error('Card declined'));

      // UPDATE payment_attempts SET status = 'failed'
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await runDunningRetryJob();

      expect(result).toEqual({ processed: 1, succeeded: 0, failed: 1 });

      // Verify attempt marked failed
      const attemptUpdateCall = mockQuery.mock.calls[1];
      expect(attemptUpdateCall[0]).toContain("status = 'failed'");
      expect(attemptUpdateCall[1]).toEqual([attempt.id]);

      // Should NOT update subscription to dunning_failed (not last attempt)
      expect(mockQuery).toHaveBeenCalledTimes(2); // SELECT + UPDATE attempt only

      // Entitlements should NOT be invalidated on non-final failure
      expect(mockInvalidateEntitlements).not.toHaveBeenCalled();
    });

    it('does not set dunning_failed for attempt_number 2', async () => {
      const attempt = makeAttempt({ attempt_number: 2 });

      mockQuery.mockResolvedValueOnce({ rows: [attempt] });
      mockStripePay.mockRejectedValueOnce(new Error('Insufficient funds'));
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await runDunningRetryJob();

      // Only SELECT + UPDATE attempt (no subscription update)
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockInvalidateEntitlements).not.toHaveBeenCalled();
    });
  });

  describe('last attempt failure (attempt_number >= 3)', () => {
    it('sets dunning_state to dunning_failed and invalidates entitlements', async () => {
      const attempt = makeAttempt({ attempt_number: 3 });

      mockQuery.mockResolvedValueOnce({ rows: [attempt] });

      mockStripePay.mockRejectedValueOnce(new Error('Card declined'));

      // UPDATE payment_attempts SET status = 'failed'
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // UPDATE user_subscriptions SET dunning_state = 'dunning_failed'
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await runDunningRetryJob();

      expect(result).toEqual({ processed: 1, succeeded: 0, failed: 1 });

      // Verify subscription updated to dunning_failed
      const subUpdateCall = mockQuery.mock.calls[2];
      expect(subUpdateCall[0]).toContain("dunning_state = 'dunning_failed'");
      expect(subUpdateCall[1]).toEqual([attempt.user_id]);

      // Entitlements invalidated on final failure
      expect(mockInvalidateEntitlements).toHaveBeenCalledWith(attempt.user_id);
    });

    it('handles attempt_number > 3 as final attempt', async () => {
      const attempt = makeAttempt({ attempt_number: 5 });

      mockQuery.mockResolvedValueOnce({ rows: [attempt] });
      mockStripePay.mockRejectedValueOnce(new Error('Expired card'));
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await runDunningRetryJob();

      // Should still set dunning_failed
      const subUpdateCall = mockQuery.mock.calls[2];
      expect(subUpdateCall[0]).toContain("dunning_state = 'dunning_failed'");
      expect(mockInvalidateEntitlements).toHaveBeenCalledWith(attempt.user_id);
    });
  });

  describe('batch processing', () => {
    it('processes mix of successes and failures, returns correct counts', async () => {
      const attempts = [
        makeAttempt({ id: 'a1', user_id: 'u1', stripe_invoice_id: 'in_1', attempt_number: 1 }),
        makeAttempt({ id: 'a2', user_id: 'u2', stripe_invoice_id: 'in_2', attempt_number: 2 }),
        makeAttempt({ id: 'a3', user_id: 'u3', stripe_invoice_id: 'in_3', attempt_number: 1 }),
      ];

      mockQuery.mockResolvedValueOnce({ rows: attempts });

      // Attempt 1: succeeds
      mockStripePay.mockResolvedValueOnce({ id: 'in_1', status: 'paid' });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE attempt
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE subscription

      // Attempt 2: fails (not last)
      mockStripePay.mockRejectedValueOnce(new Error('Declined'));
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE attempt

      // Attempt 3: succeeds
      mockStripePay.mockResolvedValueOnce({ id: 'in_3', status: 'paid' });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE attempt
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE subscription

      const result = await runDunningRetryJob();

      expect(result).toEqual({ processed: 3, succeeded: 2, failed: 1 });
    });
  });

  describe('logging', () => {
    it('logs success for each successful retry', async () => {
      const attempt = makeAttempt();

      mockQuery.mockResolvedValueOnce({ rows: [attempt] });
      mockStripePay.mockResolvedValueOnce({ id: 'in_stripe_123' });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await runDunningRetryJob();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Payment retry succeeded'),
        expect.objectContaining({
          userId: attempt.user_id,
          attemptNumber: attempt.attempt_number,
        })
      );
    });

    it('logs warning for each failed retry', async () => {
      const attempt = makeAttempt({ attempt_number: 1 });

      mockQuery.mockResolvedValueOnce({ rows: [attempt] });
      mockStripePay.mockRejectedValueOnce(new Error('Card declined'));
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await runDunningRetryJob();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Payment retry failed'),
        expect.objectContaining({
          userId: attempt.user_id,
          attemptNumber: attempt.attempt_number,
        })
      );
    });

    it('logs batch completion summary', async () => {
      const attempt = makeAttempt();

      mockQuery.mockResolvedValueOnce({ rows: [attempt] });
      mockStripePay.mockResolvedValueOnce({ id: 'in_stripe_123' });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await runDunningRetryJob();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Batch complete'),
        expect.objectContaining({ processed: 1, succeeded: 1, failed: 0 })
      );
    });
  });
});
