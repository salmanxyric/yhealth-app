/**
 * Entitlement Service Unit Tests
 *
 * Tests for getUserEntitlements (L1/L2/L3 cache), canUseFeature,
 * meetsTier, and invalidateEntitlements.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockQuery = jest.fn<any>();
const mockPoolConnect = jest.fn<any>().mockResolvedValue({
  on: jest.fn(),
  query: jest.fn(),
  release: jest.fn(),
});
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  pool: { query: mockQuery, end: jest.fn(), connect: mockPoolConnect },
  database: { healthCheck: jest.fn() },
  getClient: jest.fn(),
  closePool: jest.fn(),
  testConnection: jest.fn(),
  getPoolStats: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const mockEmitToUser = jest.fn<any>();
jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
  socketService: { emitToUser: mockEmitToUser },
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const {
  getUserEntitlements,
  invalidateEntitlements,
  canUseFeature,
  meetsTier,
} = await import('../../../src/services/entitlement.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

/** Set up mock queries for a full computeEntitlements pass */
function setupComputeEntitlementsMocks(opts: {
  overrides?: any[];
  subscription?: any | null;
  plan?: any | null;
  features?: any[];
  pages?: any[];
  menus?: any[];
  usageEvents?: any[];
  wallet?: any | null;
  userCreatedAt?: Date;
} = {}) {
  const {
    overrides = [],
    subscription = null,
    plan = {
      id: 'plan-free', slug: 'free', name: 'Free', tier: 0,
      is_enterprise: false, version: 1, trial_days: 7, credits_included_monthly: 0,
    },
    features = [],
    pages = [],
    menus = [],
    usageEvents = [],
    wallet = null,
    userCreatedAt = new Date('2024-01-01'),
  } = opts;

  // L2 cache miss
  mockQuery.mockResolvedValueOnce(pgResult([]));
  // admin_overrides
  mockQuery.mockResolvedValueOnce(pgResult(overrides));
  // user_subscriptions
  mockQuery.mockResolvedValueOnce(pgResult(subscription ? [subscription] : []));
  // subscription plan lookup (if subscription exists)
  if (subscription) {
    mockQuery.mockResolvedValueOnce(pgResult(plan ? [plan] : []));
  }
  // free plan fallback (if no subscription)
  if (!subscription) {
    mockQuery.mockResolvedValueOnce(pgResult(plan ? [plan] : []));
  }
  // trial window: user created_at (only if no subscription and plan.trial_days > 0)
  if (!subscription && plan && plan.trial_days > 0) {
    mockQuery.mockResolvedValueOnce(pgResult([{ created_at: userCreatedAt }]));
  }
  // plan_features, plan_pages, plan_menus (parallel)
  mockQuery.mockResolvedValueOnce(pgResult(features));
  mockQuery.mockResolvedValueOnce(pgResult(pages));
  mockQuery.mockResolvedValueOnce(pgResult(menus));
  // usage_events (only if features with limits exist)
  if (features.some((f: any) => f.limit_value !== null && f.limit_period !== null)) {
    mockQuery.mockResolvedValueOnce(pgResult(usageEvents));
  }
  // credit_wallets
  mockQuery.mockResolvedValueOnce(pgResult(wallet ? [wallet] : []));
  // L2 write-through (best effort)
  mockQuery.mockResolvedValueOnce(pgResult([]));
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUserEntitlements', () => {
  it('returns bundle from L2 cache when valid', async () => {
    const cachedBundle = {
      plan: { id: 'plan-free', slug: 'free', tier: 0, name: 'Free', version: 1, isEnterprise: false },
      subscription: { status: 'none', currentPeriodEnd: null, cancelAtPeriodEnd: false, graceEndsAt: null, trialEndsAt: null, daysLeftInTrial: null },
      features: {},
      pages: {},
      menus: {},
      wallet: { planCredits: 0, bonusCredits: 0, total: 0, lastResetAt: null, nextResetAt: null },
      overrides: [],
      computed_at: new Date(),
      expires_at: new Date(Date.now() + 300_000),
      etag: 'abc123',
      plan_id: 'plan-free',
      plan_version: 1,
    };
    mockQuery.mockResolvedValueOnce(pgResult([cachedBundle]));

    const bundle = await getUserEntitlements('u-001');

    expect(bundle.plan.slug).toBe('free');
    expect(bundle.etag).toBe('abc123');
    // Only 1 query (L2 read), no compute
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('computes bundle on L2 cache miss', async () => {
    setupComputeEntitlementsMocks();

    const bundle = await getUserEntitlements('u-new');

    expect(bundle.plan.slug).toBe('free');
    expect(bundle.plan.tier).toBe(0);
    expect(bundle.etag).toBeTruthy();
    expect(bundle.computedAt).toBeTruthy();
  });

  it('resolves active subscription plan instead of free plan', async () => {
    const proPlan = {
      id: 'plan-pro', slug: 'pro', name: 'Pro', tier: 20,
      is_enterprise: false, version: 1, trial_days: 0, credits_included_monthly: 100,
    };
    const sub = {
      id: 'sub-001', user_id: 'u-001', plan_id: 'plan-pro', status: 'active',
      current_period_end: new Date(Date.now() + 86400_000 * 30),
      cancel_at_period_end: false, created_at: new Date(),
    };

    setupComputeEntitlementsMocks({ subscription: sub, plan: proPlan });

    const bundle = await getUserEntitlements('u-pro');

    expect(bundle.plan.slug).toBe('pro');
    expect(bundle.plan.tier).toBe(20);
    expect(bundle.subscription.status).toBe('active');
  });

  it('returns wallet snapshot from credit_wallets table', async () => {
    const wallet = {
      plan_credits_balance: 50,
      bonus_credits_balance: 10,
      last_reset_at: new Date('2024-06-01'),
      next_reset_at: new Date('2024-07-01'),
    };

    setupComputeEntitlementsMocks({ wallet });

    const bundle = await getUserEntitlements('u-wallet');

    expect(bundle.wallet.planCredits).toBe(50);
    expect(bundle.wallet.bonusCredits).toBe(10);
    expect(bundle.wallet.total).toBe(60);
  });

  it('returns zero wallet when no credit_wallets row', async () => {
    setupComputeEntitlementsMocks({ wallet: null });

    const bundle = await getUserEntitlements('u-nowallet');

    expect(bundle.wallet.total).toBe(0);
    expect(bundle.wallet.planCredits).toBe(0);
  });
});

describe('canUseFeature', () => {
  it('returns allowed when feature is enabled and within limit', async () => {
    const features = [{
      feature_key: 'ai_chat',
      is_enabled: true,
      limit_value: 100,
      limit_period: 'month',
      credit_cost: 1,
      credit_cost_default: 1,
    }];

    setupComputeEntitlementsMocks({
      features,
      usageEvents: [{ feature_key: 'ai_chat', used: '5' }],
    });

    const result = await canUseFeature('u-can-use-1', 'ai_chat');

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('ok');
  });

  it('returns disabled when feature is disabled', async () => {
    const features = [{
      feature_key: 'voice_ai',
      is_enabled: false,
      limit_value: null,
      limit_period: null,
      credit_cost: 5,
      credit_cost_default: 5,
    }];

    setupComputeEntitlementsMocks({ features });

    const result = await canUseFeature('u-can-use-2', 'voice_ai');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('disabled');
  });

  it('returns no_plan when feature not in plan', async () => {
    setupComputeEntitlementsMocks({ features: [] });

    const result = await canUseFeature('u-can-use-3', 'nonexistent_feature');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('no_plan');
  });

  it('returns limit_reached when usage meets limit', async () => {
    const features = [{
      feature_key: 'ai_chat',
      is_enabled: true,
      limit_value: 10,
      limit_period: 'day',
      credit_cost: 1,
      credit_cost_default: 1,
    }];

    setupComputeEntitlementsMocks({
      features,
      usageEvents: [{ feature_key: 'ai_chat', used: '10' }],
    });

    const result = await canUseFeature('u-can-use-4', 'ai_chat');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('limit_reached');
  });
});

describe('meetsTier', () => {
  it('returns true when plan tier meets minimum', async () => {
    const proPlan = {
      id: 'plan-pro', slug: 'pro', name: 'Pro', tier: 20,
      is_enterprise: false, version: 1, trial_days: 0, credits_included_monthly: 100,
    };
    const sub = {
      id: 'sub-001', user_id: 'u-001', plan_id: 'plan-pro', status: 'active',
      current_period_end: new Date(Date.now() + 86400_000 * 30),
      cancel_at_period_end: false, created_at: new Date(),
    };

    setupComputeEntitlementsMocks({ subscription: sub, plan: proPlan });

    const result = await meetsTier('u-tier-1', 20);

    expect(result).toBe(true);
  });

  it('returns false when plan tier is below minimum', async () => {
    setupComputeEntitlementsMocks(); // defaults to free tier (0)

    const result = await meetsTier('u-tier-2', 20);

    expect(result).toBe(false);
  });
});

describe('invalidateEntitlements', () => {
  it('clears L1 cache, deletes L2 cache, sends pg_notify, and emits socket event', async () => {
    // L2 DELETE
    mockQuery.mockResolvedValueOnce(pgResult([]));
    // pg_notify
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await invalidateEntitlements('u-001');

    // L2 delete
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM user_entitlements_cache'),
      ['u-001'],
    );
    // pg_notify
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("pg_notify('entitlements_invalidate'"),
      ['u-001'],
    );
    // socket emit
    expect(mockEmitToUser).toHaveBeenCalledWith(
      'u-001',
      'entitlements:invalidate',
      expect.objectContaining({ userId: 'u-001' }),
    );
  });

  it('handles L2 delete failure gracefully', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    mockQuery.mockResolvedValueOnce(pgResult([])); // pg_notify

    await invalidateEntitlements('u-001');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[entitlement] Failed to delete L2 cache row',
      expect.any(Object),
    );
  });
});
