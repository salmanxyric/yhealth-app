/**
 * Subscription Controller Unit Tests
 * Tests: plan listing, checkout session, portal session, subscription access,
 *        verify session, sync from stripe, admin CRUD, revenue stats, invoice generation.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockListPlans = jest.fn<any>();
const mockGetPlanById = jest.fn<any>();
const mockCreatePlan = jest.fn<any>();
const mockUpdatePlan = jest.fn<any>();
const mockDeletePlan = jest.fn<any>();
const mockCreateCheckoutSession = jest.fn<any>();
const mockCreatePortalSession = jest.fn<any>();
const mockVerifyCheckoutSession = jest.fn<any>();
const mockSyncSubscriptionFromStripeRecovery = jest.fn<any>();
const mockGetSubscriptionAccess = jest.fn<any>();
const mockGetLatestInvoiceUrl = jest.fn<any>();
const mockAdminListPlans = jest.fn<any>();
const mockAdminListSubscriptions = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/subscription.service.js', () => ({
  listPlans: mockListPlans,
  getPlanById: mockGetPlanById,
  createPlan: mockCreatePlan,
  updatePlan: mockUpdatePlan,
  deletePlan: mockDeletePlan,
  createCheckoutSession: mockCreateCheckoutSession,
  createPortalSession: mockCreatePortalSession,
  verifyCheckoutSession: mockVerifyCheckoutSession,
  syncSubscriptionFromStripeRecovery: mockSyncSubscriptionFromStripeRecovery,
  getSubscriptionAccess: mockGetSubscriptionAccess,
  getLatestInvoiceUrl: mockGetLatestInvoiceUrl,
  adminListPlans: mockAdminListPlans,
  adminListSubscriptions: mockAdminListSubscriptions,
}));

const mockGetRevenueStats = jest.fn<any>();
jest.unstable_mockModule('../../../src/services/subscription-revenue.service.js', () => ({
  getRevenueStats: mockGetRevenueStats,
}));

// ── Dynamic imports AFTER mocks ──
const {
  getPlansHandler,
  createCheckoutSessionHandler,
  createPortalSessionHandler,
  getMySubscriptionHandler,
  verifySessionHandler,
  syncFromStripeHandler,
  adminListPlansHandler,
  adminGetPlanHandler,
  adminCreatePlanHandler,
  adminUpdatePlanHandler,
  adminDeletePlanHandler,
  adminListSubscriptionsHandler,
  getRevenueStatsHandler,
  adminUpdateSubscriptionHandler,
  adminDeleteSubscriptionHandler,
  generateInvoiceHandler,
} = await import('../../../src/controllers/subscription.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// getPlansHandler
// ─────────────────────────────────────────────
describe('getPlansHandler', () => {
  it('returns 200 with plans (activeOnly defaults to true)', async () => {
    const plans = [{ id: 'p1', name: 'Pro', slug: 'pro' }];
    mockListPlans.mockResolvedValueOnce(plans);

    const req = createReq({ query: {} });
    const res = createRes();
    const next = createNext();

    await getPlansHandler(req as any, res as any, next);

    expect(mockListPlans).toHaveBeenCalledWith(true);
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ plans });
  });

  it('passes activeOnly=false when query param is "false"', async () => {
    mockListPlans.mockResolvedValueOnce([]);

    const req = createReq({ query: { activeOnly: 'false' } });
    const res = createRes();
    const next = createNext();

    await getPlansHandler(req as any, res as any, next);

    expect(mockListPlans).toHaveBeenCalledWith(false);
  });
});

// ─────────────────────────────────────────────
// createCheckoutSessionHandler
// ─────────────────────────────────────────────
describe('createCheckoutSessionHandler', () => {
  it('returns 200 with checkout URL on success', async () => {
    mockCreateCheckoutSession.mockResolvedValueOnce({
      url: 'https://checkout.stripe.com/xyz',
      mode: 'subscription',
    });

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { planId: 'plan-1', successUrl: 'http://ok', cancelUrl: 'http://cancel' },
    } as any);
    const res = createRes();
    const next = createNext();

    await createCheckoutSessionHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toMatchObject({ url: 'https://checkout.stripe.com/xyz', mode: 'subscription' });
  });

  it('calls next with 401 when user is not authenticated', async () => {
    const req = createReq({
      body: { planId: 'p1', successUrl: 'u', cancelUrl: 'c' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(createCheckoutSessionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('calls next with 400 when service returns no URL', async () => {
    mockCreateCheckoutSession.mockResolvedValueOnce({ url: null, mode: 'subscription' });

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { planId: 'p1', successUrl: 'u', cancelUrl: 'c' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(createCheckoutSessionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// verifySessionHandler
// ─────────────────────────────────────────────
describe('verifySessionHandler', () => {
  it('returns 200 with verified result on success', async () => {
    mockVerifyCheckoutSession.mockResolvedValueOnce({
      success: true,
      reason: 'session_complete',
      subscription: { id: 'sub-1' },
    });

    const req = createAuthReq({ userId: 'u-1' }, { body: { session_id: 'cs_test_123' } } as any);
    const res = createRes();
    const next = createNext();

    await verifySessionHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toMatchObject({ verified: true, reason: 'session_complete' });
  });

  it('calls next with 400 when session_id is empty', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { body: { session_id: '  ' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(verifySessionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 400 when verification fails', async () => {
    mockVerifyCheckoutSession.mockResolvedValueOnce({ success: false, error: 'expired' });

    const req = createAuthReq({ userId: 'u-1' }, { body: { session_id: 'cs_test_bad' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(verifySessionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// syncFromStripeHandler
// ─────────────────────────────────────────────
describe('syncFromStripeHandler', () => {
  it('returns 200 when sync succeeds', async () => {
    mockSyncSubscriptionFromStripeRecovery.mockResolvedValueOnce({
      synced: true,
      reason: 'found_checkout',
      subscription: { id: 'sub-1' },
    });

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await syncFromStripeHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toMatchObject({ synced: true });
  });

  it('calls next with 400 when sync fails', async () => {
    mockSyncSubscriptionFromStripeRecovery.mockResolvedValueOnce({ synced: false, error: 'no session' });

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(syncFromStripeHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// createPortalSessionHandler
// ─────────────────────────────────────────────
describe('createPortalSessionHandler', () => {
  it('returns 200 with portal URL', async () => {
    mockCreatePortalSession.mockResolvedValueOnce({ url: 'https://billing.stripe.com/p/sess_abc' });

    const req = createAuthReq({ userId: 'u-1' }, { body: { returnUrl: 'http://return' } } as any);
    const res = createRes();
    const next = createNext();

    await createPortalSessionHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ url: 'https://billing.stripe.com/p/sess_abc' });
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ body: { returnUrl: 'http://return' } });
    const res = createRes();
    const next = createNext();

    await callHandler(createPortalSessionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getMySubscriptionHandler
// ─────────────────────────────────────────────
describe('getMySubscriptionHandler', () => {
  it('returns 200 with subscription and access info', async () => {
    mockGetSubscriptionAccess.mockResolvedValueOnce({
      subscription: {
        id: 'sub-1',
        status: 'active',
        current_period_start: '2025-01-01T00:00:00Z',
        current_period_end: '2025-02-01T00:00:00Z',
        cancel_at_period_end: false,
        canceled_at: null,
      },
      plan: { id: 'plan-1', name: 'Pro', slug: 'pro', amount_cents: 999, interval: 'month' },
      access: { allowed: true, reason: 'active_subscription', trialEndsAt: null, daysLeftInTrial: null },
    });
    mockGetLatestInvoiceUrl.mockResolvedValueOnce('https://stripe.com/invoice/123');

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getMySubscriptionHandler, req, res, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.subscription).toBeDefined();
    expect(data.subscription.id).toBe('sub-1');
    expect(data.access.allowed).toBe(true);
    expect(data.invoiceUrl).toBe('https://stripe.com/invoice/123');
  });

  it('returns null subscription when user has no subscription', async () => {
    mockGetSubscriptionAccess.mockResolvedValueOnce({
      subscription: null,
      plan: null,
      access: { allowed: false, reason: 'no_subscription', trialEndsAt: null, daysLeftInTrial: null },
    });

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await getMySubscriptionHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.subscription).toBeNull();
    expect(data.access.allowed).toBe(false);
  });
});

// ─────────────────────────────────────────────
// adminListPlansHandler
// ─────────────────────────────────────────────
describe('adminListPlansHandler', () => {
  it('returns paginated plans', async () => {
    mockAdminListPlans.mockResolvedValueOnce({
      plans: [{ id: 'p1' }],
      total: 1,
    });

    const req = createAuthReq({ userId: 'admin-1', role: 'admin' }, { query: { page: '1', limit: '10' } } as any);
    const res = createRes();
    const next = createNext();

    await adminListPlansHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.meta).toBeDefined();
    expect(body.meta.total).toBe(1);
  });
});

// ─────────────────────────────────────────────
// adminGetPlanHandler
// ─────────────────────────────────────────────
describe('adminGetPlanHandler', () => {
  it('returns 200 with plan', async () => {
    mockGetPlanById.mockResolvedValueOnce({ id: 'p1', name: 'Pro' });

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'p1' } } as any);
    const res = createRes();
    const next = createNext();

    await adminGetPlanHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.plan.id).toBe('p1');
  });

  it('calls next with 404 when plan not found', async () => {
    mockGetPlanById.mockResolvedValueOnce(null);

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'missing' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(adminGetPlanHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// adminCreatePlanHandler
// ─────────────────────────────────────────────
describe('adminCreatePlanHandler', () => {
  it('returns 201 with created plan', async () => {
    const plan = { id: 'p-new', name: 'Enterprise' };
    mockCreatePlan.mockResolvedValueOnce(plan);

    const req = createAuthReq({ userId: 'admin-1' }, {
      body: { name: 'Enterprise', slug: 'enterprise', amount_cents: 4999, interval: 'month' },
    } as any);
    const res = createRes();
    const next = createNext();

    await adminCreatePlanHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(201);
    expect(getJsonBody(res).data.plan.id).toBe('p-new');
  });
});

// ─────────────────────────────────────────────
// adminUpdatePlanHandler
// ─────────────────────────────────────────────
describe('adminUpdatePlanHandler', () => {
  it('returns 200 with updated plan', async () => {
    mockUpdatePlan.mockResolvedValueOnce({ id: 'p1', name: 'Pro Updated' });

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'p1' }, body: { name: 'Pro Updated' } } as any);
    const res = createRes();
    const next = createNext();

    await adminUpdatePlanHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
  });

  it('calls next with 404 when plan not found', async () => {
    mockUpdatePlan.mockResolvedValueOnce(null);

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'gone' }, body: { name: 'X' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(adminUpdatePlanHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// adminDeletePlanHandler
// ─────────────────────────────────────────────
describe('adminDeletePlanHandler', () => {
  it('returns 200 with deleted flag', async () => {
    mockDeletePlan.mockResolvedValueOnce(true);

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'p1' } } as any);
    const res = createRes();
    const next = createNext();

    await adminDeletePlanHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.deleted).toBe(true);
  });

  it('calls next with 404 when plan not found', async () => {
    mockDeletePlan.mockResolvedValueOnce(false);

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'gone' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(adminDeletePlanHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// adminListSubscriptionsHandler
// ─────────────────────────────────────────────
describe('adminListSubscriptionsHandler', () => {
  it('returns paginated subscriptions', async () => {
    mockAdminListSubscriptions.mockResolvedValueOnce({
      subscriptions: [{ id: 's1' }],
      total: 1,
    });

    const req = createAuthReq({ userId: 'admin-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await adminListSubscriptionsHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).meta).toBeDefined();
  });
});

// ─────────────────────────────────────────────
// getRevenueStatsHandler
// ─────────────────────────────────────────────
describe('getRevenueStatsHandler', () => {
  it('returns 200 with stats for default period (month)', async () => {
    const stats = { totalRevenue: 5000, subscriptionCount: 10 };
    mockGetRevenueStats.mockResolvedValueOnce(stats);

    const req = createAuthReq({ userId: 'admin-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await getRevenueStatsHandler(req as any, res as any, next);

    expect(mockGetRevenueStats).toHaveBeenCalledWith('month');
    expect(getStatus(res)).toBe(200);
  });

  it('respects explicit period query param', async () => {
    mockGetRevenueStats.mockResolvedValueOnce({});

    const req = createAuthReq({ userId: 'admin-1' }, { query: { period: 'year' } } as any);
    const res = createRes();
    const next = createNext();

    await getRevenueStatsHandler(req as any, res as any, next);

    expect(mockGetRevenueStats).toHaveBeenCalledWith('year');
  });
});

// ─────────────────────────────────────────────
// adminUpdateSubscriptionHandler
// ─────────────────────────────────────────────
describe('adminUpdateSubscriptionHandler', () => {
  it('returns 200 with updated subscription', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', status: 'canceled' }], rowCount: 1 });

    const req = createAuthReq({ userId: 'admin-1' }, {
      params: { id: 's1' },
      body: { status: 'canceled' },
    } as any);
    const res = createRes();
    const next = createNext();

    await adminUpdateSubscriptionHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.subscription.status).toBe('canceled');
  });

  it('calls next with 400 when no fields provided', async () => {
    const req = createAuthReq({ userId: 'admin-1' }, {
      params: { id: 's1' },
      body: {},
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(adminUpdateSubscriptionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 404 when subscription not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = createAuthReq({ userId: 'admin-1' }, {
      params: { id: 'gone' },
      body: { status: 'active' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(adminUpdateSubscriptionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// adminDeleteSubscriptionHandler
// ─────────────────────────────────────────────
describe('adminDeleteSubscriptionHandler', () => {
  it('returns 200 with deleted flag', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1' }], rowCount: 1 });

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 's1' } } as any);
    const res = createRes();
    const next = createNext();

    await adminDeleteSubscriptionHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data.deleted).toBe(true);
  });

  it('calls next with 404 when subscription not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'gone' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(adminDeleteSubscriptionHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// generateInvoiceHandler
// ─────────────────────────────────────────────
describe('generateInvoiceHandler', () => {
  it('returns 200 with invoice data', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'sub-1',
        user_id: 'u-1',
        plan_id: 'p-1',
        amount_cents: 999,
        currency: 'usd',
        plan_name: 'Pro',
        user_email: 'test@example.com',
        user_first_name: 'John',
        user_last_name: 'Doe',
        current_period_start: new Date('2025-01-01'),
        current_period_end: new Date('2025-02-01'),
      }],
      rowCount: 1,
    });

    const req = createAuthReq({ userId: 'admin-1' }, { body: { subscriptionId: 'sub-1' } } as any);
    const res = createRes();
    const next = createNext();

    await generateInvoiceHandler(req as any, res as any, next);

    expect(getStatus(res)).toBe(200);
    const data = getJsonBody(res).data;
    expect(data.customer.name).toBe('John Doe');
    expect(data.plan.amount).toBe(9.99);
    expect(data.total).toBe(9.99);
  });

  it('calls next with 400 when subscriptionId missing', async () => {
    const req = createAuthReq({ userId: 'admin-1' }, { body: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(generateInvoiceHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 404 when subscription not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const req = createAuthReq({ userId: 'admin-1' }, { body: { subscriptionId: 'gone' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(generateInvoiceHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });
});
