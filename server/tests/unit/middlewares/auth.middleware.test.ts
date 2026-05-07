/**
 * Auth Middleware Unit Tests
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../../src/types/index.js';

// ── Mock setup (BEFORE imports) ──────────────────────────

const JWT_SECRET = 'test-jwt-secret';
const JWT_REFRESH_SECRET = 'test-refresh-secret';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    jwt: {
      secret: JWT_SECRET,
      refreshSecret: JWT_REFRESH_SECRET,
      expiresIn: '15m',
      refreshExpiresIn: '7d',
      issuer: 'test-issuer',
      audience: 'test-audience',
    },
    isProduction: false,
    isDevelopment: true,
    isTest: true,
  },
}));

const mockQuery = jest.fn<any>();

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

// ── Dynamic imports ──────────────────────────────────────

const {
  authenticate,
  optionalAuth,
  authorize,
  authorizeOwnerOrAdmin,
  verifyRefreshToken,
  generateTokens,
} = await import('../../../src/middlewares/auth.middleware.js');

const { ApiError } = await import('../../../src/utils/ApiError.js');

// We need the real jsonwebtoken to generate valid tokens
const jwt = (await import('jsonwebtoken')).default;

const { createReq, createRes, createNext } = await import(
  '../../helpers/controller-harness.js'
);

// ── Helpers ──────────────────────────────────────────────

function signToken(payload: Record<string, unknown>, secret = JWT_SECRET): string {
  return jwt.sign(payload, secret, {
    issuer: 'test-issuer',
    audience: 'test-audience',
    expiresIn: '1h',
  });
}

// ── Tests ────────────────────────────────────────────────

describe('authenticate middleware', () => {
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    res = createRes();
    next = createNext();
  });

  // Token extraction
  describe('token extraction', () => {
    it('should extract token from Authorization Bearer header', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com', role: 'user' });
      const req = createReq({
        headers: { authorization: `Bearer ${token}` },
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u1', email: 'a@b.com', is_active: true, role: 'user' }],
      });

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect((req as any).user).toBeDefined();
      expect((req as any).user.userId).toBe('u1');
    });

    it('should extract token from access_token cookie', async () => {
      const token = signToken({ userId: 'u2', email: 'b@c.com', role: 'user' });
      const req = createReq({
        cookies: { access_token: token },
        headers: {},
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u2', email: 'b@c.com', is_active: true, role: 'user' }],
      });

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect((req as any).user.userId).toBe('u2');
    });
  });

  // Missing token
  describe('missing token', () => {
    it('should call next with 401 ApiError when no token is provided', async () => {
      const req = createReq({ headers: {} });

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('No authentication token');
    });
  });

  // Invalid / expired tokens
  describe('invalid tokens', () => {
    it('should reject a malformed JWT with 401', async () => {
      const req = createReq({
        headers: { authorization: 'Bearer not.a.valid.jwt' },
      });

      await authenticate(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });

    it('should reject an expired JWT with 401', async () => {
      const token = jwt.sign(
        { userId: 'u3', email: 'c@d.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '0s', issuer: 'test-issuer', audience: 'test-audience' }
      );
      const req = createReq({
        headers: { authorization: `Bearer ${token}` },
      });

      await authenticate(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('expired');
    });

    it('should reject a token signed with the wrong secret', async () => {
      const token = jwt.sign(
        { userId: 'u4', email: 'd@e.com', role: 'user' },
        'wrong-secret',
        { issuer: 'test-issuer', audience: 'test-audience' }
      );
      const req = createReq({
        headers: { authorization: `Bearer ${token}` },
      });

      await authenticate(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });
  });

  // Valid token attaches user
  describe('valid token', () => {
    it('should attach decoded user payload to req.user', async () => {
      const payload = { userId: 'u5', email: 'e@f.com', role: 'admin' };
      const token = signToken(payload);
      const req = createReq({
        headers: { authorization: `Bearer ${token}` },
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u5', email: 'current@f.com', is_active: true, role: 'admin' }],
      });

      await authenticate(req as Request, res as Response, next);

      const user = (req as any).user;
      expect(user.userId).toBe('u5');
      expect(user.email).toBe('current@f.com');
      expect(user.role).toBe('admin');
    });

    it('should reject a valid token when the user row no longer exists', async () => {
      const token = signToken({ userId: 'deleted-user', email: 'gone@example.com', role: 'user' });
      const req = createReq({
        headers: { authorization: `Bearer ${token}` },
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await authenticate(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect((req as any).user).toBeUndefined();
    });

    it('should reject a valid token when the user account is inactive', async () => {
      const token = signToken({ userId: 'blocked-user', email: 'blocked@example.com', role: 'user' });
      const req = createReq({
        headers: { authorization: `Bearer ${token}` },
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'blocked-user', email: 'blocked@example.com', is_active: false, role: 'user' }],
      });

      await authenticate(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
      expect((req as any).user).toBeUndefined();
    });
  });
});

// ── optionalAuth ─────────────────────────────────────────

describe('optionalAuth middleware', () => {
  it('should call next() without error when no token is present', async () => {
    const req = createReq({ headers: {} });
    const res = createRes();
    const next = createNext();

    await optionalAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as any).user).toBeUndefined();
  });

  it('should attach user when a valid token is present', async () => {
    const token = signToken({ userId: 'opt1', email: 'o@o.com', role: 'user' });
    const req = createReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createRes();
    const next = createNext();
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'opt1', email: 'current-opt@example.com', is_active: true, role: 'user' }],
    });

    await optionalAuth(req as Request, res as Response, next);

    expect((req as any).user.userId).toBe('opt1');
    expect((req as any).user.email).toBe('current-opt@example.com');
  });

  it('should call next() without error when token is invalid', async () => {
    const req = createReq({
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    const res = createRes();
    const next = createNext();

    await optionalAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    // user should NOT be attached
    expect((req as any).user).toBeUndefined();
  });

  it('should call next() without attaching user when token subject is missing', async () => {
    const token = signToken({ userId: 'ghost', email: 'ghost@example.com', role: 'user' });
    const req = createReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createRes();
    const next = createNext();
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await optionalAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as any).user).toBeUndefined();
  });
});

// ── authorize (role-based) ───────────────────────────────

describe('authorize middleware', () => {
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    res = createRes();
    next = createNext();
  });

  it('should allow through when JWT role is in the allowed list', async () => {
    const req = createReq() as Partial<AuthenticatedRequest>;
    (req as any).user = { userId: 'u1', email: 'a@b.com', role: 'admin' };

    await authorize('admin', 'moderator')(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should fall back to database when JWT role does not match', async () => {
    const req = createReq() as Partial<AuthenticatedRequest>;
    (req as any).user = { userId: 'u2', email: 'b@c.com', role: 'user' };

    mockQuery.mockResolvedValueOnce({ rows: [{ role: 'admin' }] });

    await authorize('admin')(req as Request, res as Response, next);

    expect(mockQuery).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
    // Should update user role
    expect((req as any).user.role).toBe('admin');
  });

  it('should return 403 when user has no matching role in JWT or database', async () => {
    const req = createReq() as Partial<AuthenticatedRequest>;
    (req as any).user = { userId: 'u3', email: 'c@d.com', role: 'user' };

    mockQuery.mockResolvedValueOnce({ rows: [{ role: 'user' }] });

    await authorize('admin')(req as Request, res as Response, next);

    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
  });

  it('should return 401 when req.user is missing', async () => {
    const req = createReq();

    await authorize('admin')(req as Request, res as Response, next);

    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
  });

  it('should return 404 when user is not found in database', async () => {
    const req = createReq() as Partial<AuthenticatedRequest>;
    (req as any).user = { userId: 'ghost', email: 'g@g.com', role: 'user' };

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await authorize('admin')(req as Request, res as Response, next);

    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
  });
});

// ── authorizeOwnerOrAdmin ────────────────────────────────

describe('authorizeOwnerOrAdmin middleware', () => {
  it('should allow admin users regardless of ownership', async () => {
    const req = createReq() as Partial<AuthenticatedRequest>;
    (req as any).user = { userId: 'admin1', role: 'admin' };
    const res = createRes();
    const next = createNext();

    const getOwnerId = jest.fn<any>().mockReturnValue('someone-else');

    await authorizeOwnerOrAdmin(getOwnerId)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    // Should NOT even check ownership for admins
    expect(getOwnerId).not.toHaveBeenCalled();
  });

  it('should allow when user is the resource owner', async () => {
    const req = createReq() as Partial<AuthenticatedRequest>;
    (req as any).user = { userId: 'owner1', role: 'user' };
    const res = createRes();
    const next = createNext();

    const getOwnerId = jest.fn<any>().mockReturnValue('owner1');

    await authorizeOwnerOrAdmin(getOwnerId)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should deny when user is not the owner and not admin', async () => {
    const req = createReq() as Partial<AuthenticatedRequest>;
    (req as any).user = { userId: 'other', role: 'user' };
    const res = createRes();
    const next = createNext();

    const getOwnerId = jest.fn<any>().mockReturnValue('owner1');

    await authorizeOwnerOrAdmin(getOwnerId)(req as Request, res as Response, next);

    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
  });
});

// ── verifyRefreshToken ───────────────────────────────────

describe('verifyRefreshToken middleware', () => {
  it('should decode a valid refresh token from body', () => {
    const token = jwt.sign(
      { userId: 'r1', email: 'r@r.com', role: 'user' },
      JWT_REFRESH_SECRET,
      { issuer: 'test-issuer', audience: 'test-audience', expiresIn: '7d' }
    );
    const req = createReq({ body: { refreshToken: token } });
    const res = createRes();
    const next = createNext();

    verifyRefreshToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as any).user.userId).toBe('r1');
  });

  it('should return 401 when no refresh token is provided', () => {
    const req = createReq({ body: {} });
    const res = createRes();
    const next = createNext();

    verifyRefreshToken(req as Request, res as Response, next);

    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
  });
});

// ── generateTokens ───────────────────────────────────────

describe('generateTokens', () => {
  it('should return accessToken, refreshToken, and expiresIn', () => {
    const result = generateTokens({
      userId: 'gen1',
      email: 'gen@g.com',
      role: 'user',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(typeof result.expiresIn).toBe('number');
    expect(result.expiresIn).toBeGreaterThan(0);
  });
});
