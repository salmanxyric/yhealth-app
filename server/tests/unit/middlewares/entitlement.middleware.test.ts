/**
 * Entitlement Middleware Unit Tests
 *
 * Tests the entitlement gate middleware stack: requirePlan, requireFeature,
 * requireFeatureLimit, consumeCredits.
 *
 * Enforcement modes:
 *   - shadow:      log would-be-denials but always next()
 *   - enforce-all: block on denial
 *   - enforce-new: block only users created after ROLLOUT_START
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../../src/types/index.js';

// ── Mock setup (BEFORE imports) ──────────────────────────

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
};

const mockEnv: Record<string, any> = {
  isProduction: false,
  isDevelopment: true,
  isTest: true,
  entitlement: {
    mode: 'enforce-all',
    rolloutStart: null,
  },
};

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: mockEnv,
}));

const mockQuery = jest.fn<any>().mockResolvedValue({ rows: [] });

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

const mockGetUserEntitlements = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/entitlement.service.js', () => ({
  getUserEntitlements: mockGetUserEntitlements,
}));

const mockReserveCredits = jest.fn<any>();
const mockSettleCredits = jest.fn<any>();
const mockReleaseCredits = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/credit.service.js', () => ({
  reserveCredits: mockReserveCredits,
  settleCredits: mockSettleCredits,
  releaseCredits: mockReleaseCredits,
}));

jest.unstable_mockModule('../../../src/utils/tokenCounter.js', () => ({
  countTokens: jest.fn<any>().mockReturnValue(10),
}));

// ── Dynamic imports ──────────────────────────────────────

const {
  requirePlan,
  requireFeature,
  requireFeatureLimit,
  consumeCredits,
} = await import('../../../src/middlewares/entitlement.middleware.js');

const { ApiError } = await import('../../../src/utils/ApiError.js');
const { createReq, createRes, createNext } = await import(
  '../../helpers/controller-harness.js'
);

// ── Helpers ──────────────────────────────────────────────

function authReq(overrides: Partial<AuthenticatedRequest> = {}): Partial<AuthenticatedRequest> {
  const req = createReq(overrides as Partial<Request>) as Partial<AuthenticatedRequest>;
  req.user = { userId: 'test-user', email: 't@t.com', role: 'user', ...(overrides as any).user };
  return req;
}

function makeBundle(overrides: Record<string, any> = {}) {
  return {
    plan: { tier: 1, slug: 'free', ...overrides.plan },
    features: overrides.features ?? {},
    wallet: { total: 100, ...overrides.wallet },
    computedAt: overrides.computedAt ?? new Date().toISOString(),
  };
}

// ── Tests ────────────────────────────────────────────────

describe('entitlement middleware', () => {
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
    res = createRes();
    next = createNext();
    mockEnv.entitlement.mode = 'enforce-all';
  });

  // ─────────────────────────────────────
  // requirePlan
  // ─────────────────────────────────────
  describe('requirePlan', () => {
    it('should call next() when user tier meets minimum', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(makeBundle({ plan: { tier: 2 } }));

      await requirePlan(1)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should return 402 when user tier is below minimum in enforce-all mode', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(makeBundle({ plan: { tier: 0 } }));

      await requirePlan(2)(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(402);
      expect(error.code).toBe('PLAN_UPGRADE_REQUIRED');
    });

    it('should log shadow denial and call next() in shadow mode', async () => {
      mockEnv.entitlement.mode = 'shadow';
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(makeBundle({ plan: { tier: 0 } }));

      await requirePlan(2)(req as Request, res as Response, next);

      // Should NOT block
      expect(next).toHaveBeenCalledWith();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      const req = createReq(); // no user attached

      await requirePlan(1)(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────
  // requireFeature
  // ─────────────────────────────────────
  describe('requireFeature', () => {
    it('should call next() when feature is enabled', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { 'ai-coach': { enabled: true } } })
      );

      await requireFeature('ai-coach')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should return 402 when feature is disabled in enforce-all mode', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { 'ai-coach': { enabled: false } } })
      );

      await requireFeature('ai-coach')(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(402);
      expect(error.code).toBe('FEATURE_DISABLED');
    });

    it('should return 402 when feature key is not in the bundle at all', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(makeBundle({ features: {} }));

      await requireFeature('unknown-feature')(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error.statusCode).toBe(402);
    });

    it('should allow through in shadow mode even when disabled', async () => {
      mockEnv.entitlement.mode = 'shadow';
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { 'ai-coach': { enabled: false } } })
      );

      await requireFeature('ai-coach')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  // ─────────────────────────────────────
  // requireFeatureLimit
  // ─────────────────────────────────────
  describe('requireFeatureLimit', () => {
    it('should call next() when usage is under the limit', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { chat: { enabled: true, limit: 10, limitPeriod: 'day' } } })
      );
      mockQuery.mockResolvedValueOnce({ rows: [{ used: '5' }] });

      await requireFeatureLimit('chat')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should return 429 when usage is at or above the limit', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { chat: { enabled: true, limit: 10, limitPeriod: 'day' } } })
      );
      mockQuery.mockResolvedValueOnce({ rows: [{ used: '10' }] });

      await requireFeatureLimit('chat')(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('FEATURE_LIMIT_REACHED');
    });

    it('should call next() when feature has no limit defined', async () => {
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { chat: { enabled: true, limit: null } } })
      );

      await requireFeatureLimit('chat')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should shadow-log and allow in shadow mode when limit exceeded', async () => {
      mockEnv.entitlement.mode = 'shadow';
      const req = authReq();
      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { chat: { enabled: true, limit: 5, limitPeriod: 'day' } } })
      );
      mockQuery.mockResolvedValueOnce({ rows: [{ used: '5' }] });

      await requireFeatureLimit('chat')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────
  // consumeCredits
  // ─────────────────────────────────────
  describe('consumeCredits', () => {
    it('should return 400 when Idempotency-Key header is missing (enforce mode)', async () => {
      const req = authReq({ headers: {} } as any);

      await consumeCredits('ai-coach')(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('MISSING_IDEMPOTENCY_KEY');
    });

    it('should shadow-log and allow when Idempotency-Key is missing in shadow mode', async () => {
      mockEnv.entitlement.mode = 'shadow';
      const req = authReq({ headers: {} } as any);

      await consumeCredits('ai-coach')(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should reserve credits and attach creditContext to req', async () => {
      const req = authReq({
        headers: { 'idempotency-key': 'idem-1' },
        method: 'POST',
        path: '/api/v1/ai/chat',
      } as any);
      // Add event listener capabilities to res
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
      (res as any).on = jest.fn((event: string, cb: (...args: unknown[]) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
        return res;
      });

      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { 'ai-coach': { enabled: true, creditCost: 5 } } })
      );
      mockReserveCredits.mockResolvedValueOnce({ ok: true });

      await consumeCredits('ai-coach')(req as Request, res as Response, next);

      expect(mockReserveCredits).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
      expect((req as any).creditContext).toBeDefined();
      expect((req as any).creditContext.reservedAmount).toBe(5);
    });

    it('should return 402 when credits are exhausted in enforce mode', async () => {
      const req = authReq({
        headers: { 'idempotency-key': 'idem-2' },
        method: 'POST',
        path: '/api/v1/ai/chat',
      } as any);
      (res as any).on = jest.fn().mockReturnValue(res);

      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({
          features: { 'ai-coach': { enabled: true, creditCost: 5 } },
          wallet: { total: 0 },
        })
      );
      mockReserveCredits.mockResolvedValueOnce({ ok: false });

      await consumeCredits('ai-coach')(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(402);
      expect(error.code).toBe('CREDITS_EXHAUSTED');
    });

    it('should skip reservation when creditCost is 0', async () => {
      const req = authReq({
        headers: { 'idempotency-key': 'idem-3' },
      } as any);

      mockGetUserEntitlements.mockResolvedValueOnce(
        makeBundle({ features: { free_feature: { enabled: true, creditCost: 0 } } })
      );

      await consumeCredits('free_feature')(req as Request, res as Response, next);

      expect(mockReserveCredits).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 401 when user is not authenticated', async () => {
      const req = createReq({ headers: { 'idempotency-key': 'idem-4' } });

      await consumeCredits('ai-coach')(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });
  });
});
