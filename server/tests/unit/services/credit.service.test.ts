/**
 * Credit Service Unit Tests
 *
 * Tests for wallet CRUD, grant, reserve, settle, release, and refund operations.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockQuery = jest.fn<any>();
const mockTransaction = jest.fn<any>().mockImplementation(async (cb: any) => {
  const fakeClient = {
    query: jest.fn<any>(),
    release: jest.fn(),
  };
  return cb(fakeClient);
});
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
  pool: { query: mockQuery, end: jest.fn(), connect: jest.fn() },
  database: { healthCheck: jest.fn() },
  getClient: jest.fn(),
  closePool: jest.fn(),
  testConnection: jest.fn(),
  getPoolStats: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const mockInvalidateEntitlements = jest.fn<any>().mockResolvedValue(undefined);
const mockEmitWalletDelta = jest.fn<any>();
jest.unstable_mockModule('../../../src/services/entitlement.service.js', () => ({
  invalidateEntitlements: mockInvalidateEntitlements,
  emitWalletDelta: mockEmitWalletDelta,
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const {
  getWallet,
  ensureWallet,
  grantCredits,
  reserveCredits,
  settleCredits,
  releaseCredits,
  refundCredits,
} = await import('../../../src/services/credit.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const sampleWallet = {
  user_id: 'u-001',
  plan_credits_balance: 100,
  bonus_credits_balance: 20,
  currency: 'usd',
  lifetime_granted: '120',
  lifetime_consumed: '0',
  last_reset_at: null,
  next_reset_at: null,
  version: 1,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getWallet', () => {
  it('returns wallet when found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([sampleWallet]));

    const wallet = await getWallet('u-001');

    expect(wallet).not.toBeNull();
    expect(wallet!.plan_credits_balance).toBe(100);
    expect(wallet!.bonus_credits_balance).toBe(20);
  });

  it('returns null when no wallet exists', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const wallet = await getWallet('u-999');

    expect(wallet).toBeNull();
  });
});

describe('ensureWallet', () => {
  it('returns existing wallet without write', async () => {
    // getWallet returns existing
    mockQuery.mockResolvedValueOnce(pgResult([sampleWallet]));

    const wallet = await ensureWallet('u-001');

    expect(wallet.user_id).toBe('u-001');
    // Should NOT have called transaction
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('creates new wallet when missing', async () => {
    // getWallet returns null
    mockQuery.mockResolvedValueOnce(pgResult([]));
    // transaction will be called
    const newWallet = { ...sampleWallet, plan_credits_balance: 0, bonus_credits_balance: 0, was_inserted: true };
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const fakeClient = {
        query: jest.fn<any>().mockResolvedValueOnce(pgResult([newWallet])),
        release: jest.fn(),
      };
      return cb(fakeClient);
    });

    const wallet = await ensureWallet('u-new');

    expect(wallet).toBeDefined();
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('creates wallet with initial credits when specified', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));
    const seededWallet = {
      ...sampleWallet,
      plan_credits_balance: 50,
      bonus_credits_balance: 10,
      was_inserted: true,
    };
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      // INSERT wallet
      clientQuery.mockResolvedValueOnce(pgResult([seededWallet]));
      // plan ledger row
      clientQuery.mockResolvedValueOnce(pgResult([{ id: 'tx-1' }]));
      // bonus ledger row
      clientQuery.mockResolvedValueOnce(pgResult([{ id: 'tx-2' }]));
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });

    const wallet = await ensureWallet('u-new', { initialPlanCredits: 50, initialBonusCredits: 10 });

    expect(wallet.plan_credits_balance).toBe(50);
    expect(wallet.bonus_credits_balance).toBe(10);
  });
});

describe('grantCredits', () => {
  it('adds credits to wallet and writes ledger row', async () => {
    // ensureWallet: getWallet returns existing
    mockQuery.mockResolvedValueOnce(pgResult([sampleWallet]));
    // transaction
    const grantedWallet = { ...sampleWallet, plan_credits_balance: 150 };
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      // FOR UPDATE read
      clientQuery.mockResolvedValueOnce(pgResult([sampleWallet]));
      // writeLedgerRow INSERT
      clientQuery.mockResolvedValueOnce(pgResult([{ id: 'tx-grant' }]));
      // UPDATE wallet
      clientQuery.mockResolvedValueOnce(pgResult([grantedWallet]));
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });

    const wallet = await grantCredits({
      userId: 'u-001',
      amount: 50,
      bucket: 'plan',
      reason: 'test grant',
    });

    expect(wallet.plan_credits_balance).toBe(150);
    expect(mockInvalidateEntitlements).toHaveBeenCalledWith('u-001');
    expect(mockEmitWalletDelta).toHaveBeenCalledWith('u-001', expect.objectContaining({ planCredits: 150 }));
    expect(mockLogger.info).toHaveBeenCalledWith('[credit] Credits granted', expect.any(Object));
  });

  it('throws error for zero or negative amount', async () => {
    await expect(
      grantCredits({ userId: 'u-001', amount: 0, bucket: 'plan', reason: 'test' }),
    ).rejects.toThrow('amount must be positive');

    await expect(
      grantCredits({ userId: 'u-001', amount: -5, bucket: 'plan', reason: 'test' }),
    ).rejects.toThrow('amount must be positive');
  });

  it('skips wallet update on idempotent replay', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([sampleWallet]));
    // transaction: ledger insert returns 0 rows (idempotent conflict)
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      clientQuery.mockResolvedValueOnce(pgResult([sampleWallet])); // FOR UPDATE
      clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'INSERT', oid: 0, fields: [] }); // ON CONFLICT DO NOTHING
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });

    const wallet = await grantCredits({
      userId: 'u-001',
      amount: 50,
      bucket: 'plan',
      reason: 'replay',
      idempotencyKey: 'idem-key-1',
    });

    // Should return pre-read wallet unchanged
    expect(wallet.plan_credits_balance).toBe(100);
  });
});

describe('reserveCredits', () => {
  it('returns ok:true with zero amount (free feature)', async () => {
    const result = await reserveCredits({
      userId: 'u-001',
      amount: 0,
      featureKey: 'free_feature',
      endpoint: '/api/chat',
      requestId: 'req-001',
      idempotencyKey: 'idem-001',
    });

    expect(result.ok).toBe(true);
    expect(result.reservationId).toBeUndefined();
  });

  it('returns insufficient_credits when wallet balance too low', async () => {
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      // replay check: no prior
      clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
      // wallet UPDATE returns 0 rows (insufficient)
      clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] });
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });

    const result = await reserveCredits({
      userId: 'u-001',
      amount: 500,
      featureKey: 'ai_chat',
      endpoint: '/api/chat',
      requestId: 'req-002',
      idempotencyKey: 'idem-002',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('insufficient_credits');
  });

  it('returns replay result for duplicate idempotency key', async () => {
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      // replay check: found prior
      clientQuery.mockResolvedValueOnce(pgResult([{ id: 'tx-prior', delta: -5 }]));
      // prior usage event
      clientQuery.mockResolvedValueOnce(pgResult([{ id: 'ue-prior' }]));
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });

    const result = await reserveCredits({
      userId: 'u-001',
      amount: 5,
      featureKey: 'ai_chat',
      endpoint: '/api/chat',
      requestId: 'req-003',
      idempotencyKey: 'idem-dup',
    });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe('replay');
    expect(result.priorUsageEventId).toBe('ue-prior');
  });

  it('throws for negative amount', async () => {
    await expect(
      reserveCredits({
        userId: 'u-001',
        amount: -1,
        featureKey: 'ai_chat',
        endpoint: '/api/chat',
        requestId: 'req-neg',
        idempotencyKey: 'idem-neg',
      }),
    ).rejects.toThrow('negative amount');
  });
});

describe('settleCredits', () => {
  it('settles reservation and updates usage_events', async () => {
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      // find reservation
      clientQuery.mockResolvedValueOnce(pgResult([{
        id: 'tx-res', delta: -10, balance_after_plan: 90, balance_after_bonus: 20,
      }]));
      // existing settle check (none)
      clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
      // settle marker insert
      clientQuery.mockResolvedValueOnce(pgResult([{ id: 'tx-settle' }]));
      // usage_events update
      clientQuery.mockResolvedValueOnce(pgResult([]));
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });
    // getWallet after settle for socket emit
    mockQuery.mockResolvedValueOnce(pgResult([sampleWallet]));

    await settleCredits({
      userId: 'u-001',
      featureKey: 'ai_chat',
      requestId: 'req-settle',
      idempotencyKey: 'idem-settle',
      actualAmount: 10,
    });

    expect(mockEmitWalletDelta).toHaveBeenCalledWith('u-001', expect.any(Object));
  });
});

describe('releaseCredits', () => {
  it('delegates to settleCredits with actualAmount 0', async () => {
    // The settleCredits mock handles the internal flow
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      // find reservation
      clientQuery.mockResolvedValueOnce(pgResult([{
        id: 'tx-res', delta: -5, balance_after_plan: 95, balance_after_bonus: 20,
      }]));
      // existing settle check
      clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
      // release: restore credits (diff > 0)
      clientQuery.mockResolvedValueOnce(pgResult([{ plan_credits_balance: 100, bonus_credits_balance: 20 }]));
      // release ledger
      clientQuery.mockResolvedValueOnce(pgResult([]));
      // settle marker
      clientQuery.mockResolvedValueOnce(pgResult([]));
      // usage_events update
      clientQuery.mockResolvedValueOnce(pgResult([]));
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });
    mockQuery.mockResolvedValueOnce(pgResult([sampleWallet]));

    await releaseCredits('u-001', 'ai_chat', 'req-rel', 'idem-rel');

    // Should complete without errors
    expect(mockTransaction).toHaveBeenCalled();
  });
});

describe('refundCredits', () => {
  it('delegates to grantCredits with refund kind', async () => {
    // ensureWallet: getWallet returns existing
    mockQuery.mockResolvedValueOnce(pgResult([sampleWallet]));
    // grantCredits transaction
    const refundedWallet = { ...sampleWallet, plan_credits_balance: 110 };
    mockTransaction.mockImplementationOnce(async (cb: any) => {
      const clientQuery = jest.fn<any>();
      clientQuery.mockResolvedValueOnce(pgResult([sampleWallet])); // FOR UPDATE
      clientQuery.mockResolvedValueOnce(pgResult([{ id: 'tx-refund' }])); // ledger
      clientQuery.mockResolvedValueOnce(pgResult([refundedWallet])); // UPDATE wallet
      const fakeClient = { query: clientQuery, release: jest.fn() };
      return cb(fakeClient);
    });

    await refundCredits({
      userId: 'u-001',
      featureKey: 'ai_chat',
      amount: 10,
      requestId: 'req-refund',
      reason: 'ai_failure',
    });

    expect(mockInvalidateEntitlements).toHaveBeenCalledWith('u-001');
  });

  it('does nothing for zero amount', async () => {
    await refundCredits({
      userId: 'u-001',
      featureKey: 'ai_chat',
      amount: 0,
      requestId: 'req-zero',
      reason: 'no_charge',
    });

    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
