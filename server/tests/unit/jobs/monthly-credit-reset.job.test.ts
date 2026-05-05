/**
 * Monthly Credit Reset Job Unit Tests
 *
 * Tests for runMonthlyCreditResetJob — resets plan credits for users whose
 * next_reset_at has passed. Validates rollover policies (none, cap, unlimited)
 * and idempotency via conflict-checking ledger inserts.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery, mockTransaction } = setupDbMock();
setupLoggerMock();

// Dynamic import AFTER mocks
const { runMonthlyCreditResetJob } = await import('../../../src/jobs/monthly-credit-reset.job.js');

// ============================================
// HELPERS
// ============================================

function makeWallet(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'user-001',
    plan_credits_balance: 5,
    bonus_credits_balance: 10,
    next_reset_at: new Date('2026-05-01T00:00:00.000Z'),
    credits_included_monthly: 100,
    credits_rollover_policy: 'none',
    credits_rollover_cap: null,
    plan_slug: 'free',
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockTransaction.mockImplementation(
    async (cb: (client: { query: typeof mockQuery }) => Promise<unknown>) =>
      cb({ query: mockQuery } as any)
  );
});

describe('runMonthlyCreditResetJob', () => {
  it('returns { reset: 0 } when no wallets are due for reset', async () => {
    // The top-level query (SELECT wallets) returns empty
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await runMonthlyCreditResetJob();

    expect(result).toEqual({ reset: 0 });
  });

  describe('rollover policy: none', () => {
    it('resets balance to credits_included_monthly', async () => {
      const wallet = makeWallet({
        plan_credits_balance: 5,
        credits_included_monthly: 100,
        credits_rollover_policy: 'none',
      });

      // Top-level SELECT query
      mockQuery.mockResolvedValueOnce({ rows: [wallet] });

      // Inside transaction: ledger INSERT returns a row (not a conflict)
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1' }] }) // ledger INSERT RETURNING id
        .mockResolvedValueOnce({ rows: [] }); // UPDATE credit_wallets

      const result = await runMonthlyCreditResetJob();

      expect(result).toEqual({ reset: 1 });

      // Verify the ledger INSERT was called with the correct delta
      // delta = newBalance - currentBalance = 100 - 5 = 95
      const ledgerCall = mockQuery.mock.calls[1];
      expect(ledgerCall[0]).toContain('INSERT INTO credit_transactions');
      expect(ledgerCall[1]).toEqual(
        expect.arrayContaining([wallet.user_id, 95])
      );

      // Verify the wallet UPDATE was called with newBalance = 100
      const walletUpdateCall = mockQuery.mock.calls[2];
      expect(walletUpdateCall[0]).toContain('UPDATE credit_wallets');
      expect(walletUpdateCall[1]).toEqual([wallet.user_id, 100]);
    });
  });

  describe('rollover policy: cap', () => {
    it('rolls over with min(current + monthly, cap)', async () => {
      const wallet = makeWallet({
        plan_credits_balance: 30,
        credits_included_monthly: 100,
        credits_rollover_policy: 'cap',
        credits_rollover_cap: 120,
      });

      mockQuery.mockResolvedValueOnce({ rows: [wallet] });
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1' }] }) // ledger INSERT
        .mockResolvedValueOnce({ rows: [] }); // UPDATE

      const result = await runMonthlyCreditResetJob();

      expect(result).toEqual({ reset: 1 });

      // newBalance = min(30 + 100, 120) = 120
      // delta = 120 - 30 = 90
      const ledgerCall = mockQuery.mock.calls[1];
      expect(ledgerCall[1]).toEqual(
        expect.arrayContaining([wallet.user_id, 90])
      );

      const walletUpdateCall = mockQuery.mock.calls[2];
      expect(walletUpdateCall[1]).toEqual([wallet.user_id, 120]);
    });

    it('caps at rollover_cap when current + monthly exceeds it', async () => {
      const wallet = makeWallet({
        plan_credits_balance: 80,
        credits_included_monthly: 100,
        credits_rollover_policy: 'cap',
        credits_rollover_cap: 150,
      });

      mockQuery.mockResolvedValueOnce({ rows: [wallet] });
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await runMonthlyCreditResetJob();

      // newBalance = min(80 + 100, 150) = 150
      const walletUpdateCall = mockQuery.mock.calls[2];
      expect(walletUpdateCall[1]).toEqual([wallet.user_id, 150]);
    });
  });

  describe('rollover policy: unlimited', () => {
    it('adds monthly credits to current balance with no cap', async () => {
      const wallet = makeWallet({
        plan_credits_balance: 250,
        credits_included_monthly: 100,
        credits_rollover_policy: 'unlimited',
      });

      mockQuery.mockResolvedValueOnce({ rows: [wallet] });
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await runMonthlyCreditResetJob();

      expect(result).toEqual({ reset: 1 });

      // newBalance = 250 + 100 = 350
      // delta = 350 - 250 = 100
      const ledgerCall = mockQuery.mock.calls[1];
      expect(ledgerCall[1]).toEqual(
        expect.arrayContaining([wallet.user_id, 100])
      );

      const walletUpdateCall = mockQuery.mock.calls[2];
      expect(walletUpdateCall[1]).toEqual([wallet.user_id, 350]);
    });
  });

  describe('edge cases', () => {
    it('skips wallets with 0 monthly credits', async () => {
      const wallet = makeWallet({ credits_included_monthly: 0 });

      mockQuery.mockResolvedValueOnce({ rows: [wallet] });

      const result = await runMonthlyCreditResetJob();

      expect(result).toEqual({ reset: 0 });
      // transaction should never be called
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('skips wallets with null monthly credits', async () => {
      const wallet = makeWallet({ credits_included_monthly: null });

      mockQuery.mockResolvedValueOnce({ rows: [wallet] });

      const result = await runMonthlyCreditResetJob();

      expect(result).toEqual({ reset: 0 });
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('defaults to "none" policy when credits_rollover_policy is null', async () => {
      const wallet = makeWallet({
        plan_credits_balance: 40,
        credits_included_monthly: 100,
        credits_rollover_policy: null,
      });

      mockQuery.mockResolvedValueOnce({ rows: [wallet] });
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'txn-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await runMonthlyCreditResetJob();

      // Default 'none' => newBalance = 100
      const walletUpdateCall = mockQuery.mock.calls[2];
      expect(walletUpdateCall[1]).toEqual([wallet.user_id, 100]);
    });
  });

  describe('idempotency', () => {
    it('does NOT update wallet when ledger INSERT returns 0 rows (conflict)', async () => {
      const wallet = makeWallet();

      mockQuery.mockResolvedValueOnce({ rows: [wallet] });

      // Ledger INSERT returns empty (ON CONFLICT DO NOTHING, no RETURNING)
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await runMonthlyCreditResetJob();

      // The wallet was processed but the transaction callback returned early,
      // so resetCount still increments (the transaction itself succeeded)
      expect(result).toEqual({ reset: 1 });

      // Only 2 query calls: the SELECT and the ledger INSERT
      // The wallet UPDATE should NOT have been called
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('continues processing remaining wallets when one fails', async () => {
      const wallet1 = makeWallet({ user_id: 'user-fail' });
      const wallet2 = makeWallet({ user_id: 'user-ok' });

      mockQuery.mockResolvedValueOnce({ rows: [wallet1, wallet2] });

      // First wallet: transaction throws
      mockTransaction.mockRejectedValueOnce(new Error('DB error'));

      // Second wallet: transaction succeeds; reset the mock to execute callback
      mockTransaction.mockImplementationOnce(
        async (cb: (client: { query: jest.Mock }) => Promise<unknown>) => {
          return cb({ query: mockQuery } as any);
        }
      );
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'txn-2' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await runMonthlyCreditResetJob();

      expect(result).toEqual({ reset: 1 });
    });
  });

  describe('batch processing', () => {
    it('processes multiple wallets and returns total count', async () => {
      const wallets = [
        makeWallet({ user_id: 'user-1', credits_rollover_policy: 'none' }),
        makeWallet({ user_id: 'user-2', credits_rollover_policy: 'unlimited', plan_credits_balance: 50 }),
        makeWallet({ user_id: 'user-3', credits_rollover_policy: 'cap', credits_rollover_cap: 200, plan_credits_balance: 120 }),
      ];

      mockQuery.mockResolvedValueOnce({ rows: wallets });

      // Each wallet triggers: ledger INSERT + wallet UPDATE
      for (let i = 0; i < wallets.length; i++) {
        mockQuery
          .mockResolvedValueOnce({ rows: [{ id: `txn-${i}` }] })
          .mockResolvedValueOnce({ rows: [] });
      }

      const result = await runMonthlyCreditResetJob();

      expect(result).toEqual({ reset: 3 });
    });
  });
});
