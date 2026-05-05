/**
 * Stale Reservation Cleanup Job Unit Tests
 *
 * Tests for runStaleReservationCleanup — releases credit reservations stuck
 * in 'reserved' status for more than 30 minutes and restores credits to wallets.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery, mockTransaction } = setupDbMock();
const mockLogger = setupLoggerMock();

// Dynamic import AFTER mocks
const { runStaleReservationCleanup } = await import('../../../src/jobs/stale-reservation-cleanup.job.js');

// ============================================
// HELPERS
// ============================================

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt-001',
    user_id: 'user-001',
    feature_key: 'ai_coach_message',
    credits_reserved: 5,
    request_id: 'req-abc',
    idempotency_key: 'reserve:evt-001',
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

describe('runStaleReservationCleanup', () => {
  it('returns { released: 0 } when no stale reservations exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await runStaleReservationCleanup();

    expect(result).toEqual({ released: 0 });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('releases stale reservations and restores credits to wallet', async () => {
    const reservation = makeReservation({ credits_reserved: 10 });

    // Top-level SELECT stale reservations
    mockQuery.mockResolvedValueOnce({ rows: [reservation] });

    // Inside transaction:
    mockQuery
      // 1. UPDATE credit_wallets (restore credits)
      .mockResolvedValueOnce({
        rows: [{ plan_credits_balance: 110, bonus_credits_balance: 20 }],
      })
      // 2. UPDATE usage_events SET status = 'released'
      .mockResolvedValueOnce({ rows: [] })
      // 3. INSERT credit_transactions (compensating ledger)
      .mockResolvedValueOnce({ rows: [] });

    const result = await runStaleReservationCleanup();

    expect(result).toEqual({ released: 1 });

    // Verify wallet credits were restored
    const walletUpdateCall = mockQuery.mock.calls[1];
    expect(walletUpdateCall[0]).toContain('UPDATE credit_wallets');
    expect(walletUpdateCall[1]).toEqual([reservation.user_id, reservation.credits_reserved]);

    // Verify usage event was marked released
    const usageUpdateCall = mockQuery.mock.calls[2];
    expect(usageUpdateCall[0]).toContain('UPDATE usage_events');
    expect(usageUpdateCall[1]).toEqual([reservation.id]);

    // Verify compensating ledger entry was written
    const ledgerCall = mockQuery.mock.calls[3];
    expect(ledgerCall[0]).toContain('INSERT INTO credit_transactions');
    // Idempotency key should be stale_release:<reservation_id>
    expect(ledgerCall[1]).toContain(`stale_release:${reservation.id}`);
  });

  it('skips reservation when wallet is not found', async () => {
    const reservation = makeReservation();

    mockQuery.mockResolvedValueOnce({ rows: [reservation] });

    // Wallet UPDATE returns no rows (wallet not found)
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await runStaleReservationCleanup();

    // The transaction callback returns early, but no error is thrown,
    // so released still increments
    expect(result).toEqual({ released: 1 });

    // Only 2 queries: the SELECT and the wallet UPDATE
    // usage_events and ledger should NOT be called
    expect(mockQuery).toHaveBeenCalledTimes(2);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Wallet not found'),
      expect.objectContaining({ userId: reservation.user_id })
    );
  });

  it('uses correct idempotency key for ledger entry', async () => {
    const reservation = makeReservation({ id: 'evt-unique-42' });

    mockQuery.mockResolvedValueOnce({ rows: [reservation] });
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ plan_credits_balance: 50, bonus_credits_balance: 0 }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await runStaleReservationCleanup();

    const ledgerCall = mockQuery.mock.calls[3];
    // The idempotency_key is the 5th positional param ($5)
    expect(ledgerCall[1][4]).toBe('stale_release:evt-unique-42');
  });

  it('processes multiple stale reservations and returns total count', async () => {
    const reservations = [
      makeReservation({ id: 'evt-1', user_id: 'user-1', credits_reserved: 3 }),
      makeReservation({ id: 'evt-2', user_id: 'user-2', credits_reserved: 7 }),
    ];

    mockQuery.mockResolvedValueOnce({ rows: reservations });

    // Each reservation: wallet UPDATE + usage UPDATE + ledger INSERT
    for (const _r of reservations) {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ plan_credits_balance: 100, bonus_credits_balance: 0 }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
    }

    const result = await runStaleReservationCleanup();

    expect(result).toEqual({ released: 2 });
  });

  it('continues processing when one reservation fails', async () => {
    const reservations = [
      makeReservation({ id: 'evt-fail', user_id: 'user-fail' }),
      makeReservation({ id: 'evt-ok', user_id: 'user-ok' }),
    ];

    mockQuery.mockResolvedValueOnce({ rows: reservations });

    // First reservation: transaction throws
    mockTransaction.mockRejectedValueOnce(new Error('Lock timeout'));

    // Second reservation: transaction succeeds
    mockTransaction.mockImplementationOnce(
      async (cb: (client: { query: jest.Mock }) => Promise<unknown>) => {
        return cb({ query: mockQuery } as any);
      }
    );
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ plan_credits_balance: 100, bonus_credits_balance: 0 }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await runStaleReservationCleanup();

    expect(result).toEqual({ released: 1 });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to release'),
      expect.objectContaining({ reservationId: 'evt-fail' })
    );
  });

  it('logs info when reservations are released', async () => {
    const reservation = makeReservation();

    mockQuery.mockResolvedValueOnce({ rows: [reservation] });
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ plan_credits_balance: 100, bonus_credits_balance: 0 }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await runStaleReservationCleanup();

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Released stale reservations'),
      expect.objectContaining({ released: 1 })
    );
  });
});
