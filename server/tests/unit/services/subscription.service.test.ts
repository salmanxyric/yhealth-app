/**
 * Subscription Service Unit Tests
 *
 * Tests for plan CRUD, checkout sessions, portal, subscription access,
 * webhook handling, and admin listing operations.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockQuery = jest.fn<any>();
const mockTransaction = jest.fn<any>().mockImplementation(async (cb: any) => {
  const fakeClient = { query: mockQuery, release: jest.fn() };
  return cb(fakeClient);
});
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
  pool: { query: mockQuery, end: jest.fn() },
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

// Mock Stripe
const mockStripeCheckoutCreate = jest.fn<any>();
const mockStripePortalCreate = jest.fn<any>();
const mockStripeCustomersCreate = jest.fn<any>();
const mockStripeProductsCreate = jest.fn<any>();
const mockStripeProductsUpdate = jest.fn<any>();
const mockStripePricesCreate = jest.fn<any>();
const mockStripeSubscriptionsRetrieve = jest.fn<any>();
const mockStripeSessionsRetrieve = jest.fn<any>();
const mockStripeInvoicesRetrieve = jest.fn<any>();

const stripeInstance = {
  checkout: { sessions: { create: mockStripeCheckoutCreate, retrieve: mockStripeSessionsRetrieve } },
  billingPortal: { sessions: { create: mockStripePortalCreate } },
  customers: { create: mockStripeCustomersCreate, list: jest.fn() },
  products: { create: mockStripeProductsCreate, update: mockStripeProductsUpdate },
  prices: { create: mockStripePricesCreate },
  subscriptions: { retrieve: mockStripeSubscriptionsRetrieve },
  invoices: { retrieve: mockStripeInvoicesRetrieve },
};

jest.unstable_mockModule('stripe', () => {
  function StripeMock() { return stripeInstance; }
  StripeMock.prototype = stripeInstance;
  return { default: StripeMock, Stripe: StripeMock, __esModule: true };
});

// Mock env
jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    stripe: { secretKey: 'sk_test_fake', webhookSecret: 'whsec_fake' },
    client: { url: 'http://localhost:3000' },
  },
}));

// Mock mail helper
const mockIsMailConfigured = jest.fn<any>().mockReturnValue(false);
jest.unstable_mockModule('../../../src/helper/mail.js', () => ({
  mailHelper: {
    isMailConfigured: mockIsMailConfigured,
    sendSubscriptionConfirmationEmail: jest.fn(),
    sendSubscriptionInvoiceEmail: jest.fn(),
  },
}));

// Mock credit service
const mockGrantCredits = jest.fn<any>().mockResolvedValue({});
jest.unstable_mockModule('../../../src/services/credit.service.js', () => ({
  grantCredits: mockGrantCredits,
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const {
  listPlans,
  getPlanById,
  createCheckoutSession,
  createPortalSession,
  getSubscriptionByUserId,
  getSubscriptionAccess,
  handleStripeWebhook,
  adminListPlans,
  adminListSubscriptions: _adminListSubscriptions,
} = await import('../../../src/services/subscription.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const samplePlan = {
  id: 'plan-001',
  name: 'Pro',
  slug: 'pro',
  description: 'Pro plan',
  stripe_price_id: 'price_abc',
  stripe_product_id: 'prod_abc',
  amount_cents: 999,
  currency: 'usd',
  interval: 'month',
  features: ['Feature A'],
  is_active: true,
  sort_order: 1,
  credits_included_monthly: 100,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

const sampleSubscription = {
  id: 'sub-001',
  user_id: 'u-001',
  plan_id: 'plan-001',
  stripe_subscription_id: 'sub_stripe_001',
  stripe_customer_id: 'cus_001',
  status: 'active',
  current_period_start: new Date('2024-01-01'),
  current_period_end: new Date('2025-01-01'),
  cancel_at_period_end: false,
  canceled_at: null,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listPlans', () => {
  it('returns only active plans by default', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));

    const plans = await listPlans();

    expect(plans).toHaveLength(1);
    expect(plans[0].name).toBe('Pro');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('is_active = true'),
    );
  });

  it('returns all plans when activeOnly is false', async () => {
    const inactivePlan = { ...samplePlan, is_active: false };
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan, inactivePlan]));

    const plans = await listPlans(false);

    expect(plans).toHaveLength(2);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.not.stringContaining('is_active = true'),
    );
  });
});

describe('getPlanById', () => {
  it('returns plan when found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));

    const plan = await getPlanById('plan-001');

    expect(plan).not.toBeNull();
    expect(plan!.id).toBe('plan-001');
  });

  it('returns null when not found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const plan = await getPlanById('nonexistent');

    expect(plan).toBeNull();
  });
});

describe('createCheckoutSession', () => {
  it('creates a Stripe subscription checkout for plan with stripe_price_id', async () => {
    // getPlanById
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));
    // user email lookup
    mockQuery.mockResolvedValueOnce(pgResult([{ email: 'john@test.com' }]));
    // getOrCreateStripeCustomerId - existing
    mockQuery.mockResolvedValueOnce(pgResult([{ stripe_customer_id: 'cus_001' }]));
    // Stripe session
    mockStripeCheckoutCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/session' });

    const result = await createCheckoutSession('u-001', 'plan-001', 'http://ok', 'http://cancel');

    expect(result.url).toBe('https://checkout.stripe.com/session');
    expect(result.mode).toBe('subscription');
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription' }),
    );
  });

  it('throws error for non-existent plan', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await expect(
      createCheckoutSession('u-001', 'nonexistent', 'http://ok', 'http://cancel'),
    ).rejects.toThrow('Plan not found');
  });

  it('throws error when user not found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));
    mockQuery.mockResolvedValueOnce(pgResult([])); // no user

    await expect(
      createCheckoutSession('u-999', 'plan-001', 'http://ok', 'http://cancel'),
    ).rejects.toThrow('User not found');
  });

  it('creates one-time payment checkout when plan has no stripe_price_id', async () => {
    const noStripePlan = { ...samplePlan, stripe_price_id: null };
    mockQuery.mockResolvedValueOnce(pgResult([noStripePlan]));
    mockQuery.mockResolvedValueOnce(pgResult([{ email: 'john@test.com' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ stripe_customer_id: 'cus_001' }]));
    mockStripeCheckoutCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/payment' });

    const result = await createCheckoutSession('u-001', 'plan-001', 'http://ok', 'http://cancel');

    expect(result.mode).toBe('payment');
  });
});

describe('createPortalSession', () => {
  it('throws when user has no stripe customer', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ stripe_customer_id: null }]));

    await expect(
      createPortalSession('u-001', 'http://return'),
    ).rejects.toThrow('No billing customer found');
  });
});

describe('getSubscriptionByUserId', () => {
  it('returns active subscription', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([sampleSubscription]));

    const sub = await getSubscriptionByUserId('u-001');

    expect(sub).not.toBeNull();
    expect(sub!.status).toBe('active');
  });

  it('returns null when no active subscription', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const sub = await getSubscriptionByUserId('u-999');

    expect(sub).toBeNull();
  });
});

describe('getSubscriptionAccess', () => {
  it('returns subscribed access for active subscription', async () => {
    // getSubscriptionByUserId
    mockQuery.mockResolvedValueOnce(pgResult([sampleSubscription]));
    // getPlanById
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));

    const result = await getSubscriptionAccess('u-001');

    expect(result.access.allowed).toBe(true);
    expect(result.access.reason).toBe('subscribed');
    expect(result.plan).not.toBeNull();
  });

  it('returns trial access for new user within trial period', async () => {
    // getSubscriptionByUserId - no subscription
    mockQuery.mockResolvedValueOnce(pgResult([]));
    // user created_at (recently)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3); // 3 days ago
    mockQuery.mockResolvedValueOnce(pgResult([{ created_at: recentDate }]));

    const result = await getSubscriptionAccess('u-002');

    expect(result.access.allowed).toBe(true);
    expect(result.access.reason).toBe('trial');
    expect(result.access.daysLeftInTrial).toBeGreaterThan(0);
  });

  it('returns expired access for old user without subscription', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30); // 30 days ago, well past 7 day trial
    mockQuery.mockResolvedValueOnce(pgResult([{ created_at: oldDate }]));

    const result = await getSubscriptionAccess('u-003');

    expect(result.access.allowed).toBe(false);
    expect(result.access.reason).toBe('expired');
  });

  it('returns none access when user not found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));
    mockQuery.mockResolvedValueOnce(pgResult([])); // no user row

    const result = await getSubscriptionAccess('u-ghost');

    expect(result.access.allowed).toBe(false);
    expect(result.access.reason).toBe('none');
  });
});

describe('handleStripeWebhook', () => {
  it('handles customer.subscription.created event', async () => {
    const stripeEvent = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_stripe_new',
          customer: 'cus_001',
          status: 'active',
          cancel_at_period_end: false,
          canceled_at: null,
          metadata: { userId: 'u-001' },
          items: {
            data: [{
              price: { id: 'price_abc' },
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            }],
          },
          latest_invoice: null,
        },
      },
    };

    // getPlanByStripePriceId
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));
    // transaction client.query (upsert)
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await handleStripeWebhook(stripeEvent as any);

    expect(mockTransaction).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      '[Subscription] Synced subscription',
      expect.objectContaining({ subscriptionId: 'sub_stripe_new' }),
    );
  });

  it('handles customer.subscription.deleted event', async () => {
    const stripeEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: { id: 'sub_stripe_del' },
      },
    };

    mockQuery.mockResolvedValueOnce(pgResult([]));

    await handleStripeWebhook(stripeEvent as any);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("status = 'canceled'"),
      ['sub_stripe_del'],
    );
  });

  it('handles checkout.session.completed with missing metadata gracefully', async () => {
    const stripeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_001',
          metadata: {},
          payment_status: 'paid',
        },
      },
    };

    await handleStripeWebhook(stripeEvent as any);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[Subscription] Webhook checkout.session.completed: missing metadata',
      expect.any(Object),
    );
  });
});

describe('adminListPlans', () => {
  it('returns paginated plans with total', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '3' }]));
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));

    const result = await adminListPlans({ page: 1, limit: 10 });

    expect(result.total).toBe(3);
    expect(result.plans).toHaveLength(1);
  });

  it('filters by is_active when specified', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([samplePlan]));

    await adminListPlans({ is_active: true });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('is_active'),
      expect.arrayContaining([true]),
    );
  });
});
