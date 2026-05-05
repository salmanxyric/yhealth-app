/**
 * Entitlements Controller Unit Tests
 * Tests: entitlement bundle fetching with ETag, 304 caching, auth guard.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockGetUserEntitlements = jest.fn<any>();
jest.unstable_mockModule('../../../src/services/entitlement.service.js', () => ({
  getUserEntitlements: mockGetUserEntitlements,
}));

const mockEnsureWalletForEntitlements = jest.fn<any>();
jest.unstable_mockModule('../../../src/services/credit.service.js', () => ({
  ensureWalletForEntitlements: mockEnsureWalletForEntitlements,
}));

// ── Dynamic imports AFTER mocks ──
const { getMyEntitlementsHandler } = await import(
  '../../../src/controllers/entitlements.controller.js'
);

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => jest.clearAllMocks());

describe('getMyEntitlementsHandler', () => {
  const mockBundle = {
    etag: 'abc123',
    tier: 'pro',
    features: { ai_coach: true, advanced_analytics: true },
    credits: { ai_coach: 10 },
  };

  it('returns 200 with entitlement bundle on success', async () => {
    mockEnsureWalletForEntitlements.mockResolvedValueOnce(undefined);
    mockGetUserEntitlements.mockResolvedValueOnce(mockBundle);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getMyEntitlementsHandler, req, res, next);

    expect(mockEnsureWalletForEntitlements).toHaveBeenCalledWith('u-1');
    expect(mockGetUserEntitlements).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);

    const data = getJsonBody(res).data;
    expect(data.tier).toBe('pro');
    expect(data.features.ai_coach).toBe(true);
  });

  it('sets ETag and Cache-Control headers', async () => {
    mockEnsureWalletForEntitlements.mockResolvedValueOnce(undefined);
    mockGetUserEntitlements.mockResolvedValueOnce(mockBundle);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getMyEntitlementsHandler, req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('ETag', 'W/"abc123"');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, max-age=60');
  });

  it('returns 304 when If-None-Match matches ETag', async () => {
    mockEnsureWalletForEntitlements.mockResolvedValueOnce(undefined);
    mockGetUserEntitlements.mockResolvedValueOnce(mockBundle);

    const req = createAuthReq({ userId: 'u-1' }, {
      headers: { 'if-none-match': 'W/"abc123"' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getMyEntitlementsHandler, req, res, next);

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();
    // Should NOT have sent a JSON body
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns full body when If-None-Match does not match', async () => {
    mockEnsureWalletForEntitlements.mockResolvedValueOnce(undefined);
    mockGetUserEntitlements.mockResolvedValueOnce(mockBundle);

    const req = createAuthReq({ userId: 'u-1' }, {
      headers: { 'if-none-match': 'W/"stale-etag"' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getMyEntitlementsHandler, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toBeDefined();
  });

  it('calls next with 401 when user is not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getMyEntitlementsHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('calls ensureWalletForEntitlements before fetching entitlements', async () => {
    // Verify ordering: wallet creation happens first
    const callOrder: string[] = [];
    mockEnsureWalletForEntitlements.mockImplementation(async () => {
      callOrder.push('wallet');
    });
    mockGetUserEntitlements.mockImplementation(async () => {
      callOrder.push('entitlements');
      return mockBundle;
    });

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getMyEntitlementsHandler, req, res, next);

    expect(callOrder).toEqual(['wallet', 'entitlements']);
  });

  it('propagates service errors to next', async () => {
    mockEnsureWalletForEntitlements.mockResolvedValueOnce(undefined);
    mockGetUserEntitlements.mockRejectedValueOnce(new Error('DB connection lost'));

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getMyEntitlementsHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.message).toBe('DB connection lost');
  });
});
