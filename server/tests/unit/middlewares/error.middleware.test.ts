/**
 * Error Middleware Unit Tests
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// ── Mock setup (BEFORE imports) ──────────────────────────

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
    isProduction: false,
    isDevelopment: true,
    isTest: true,
    rateLimit: { windowMs: 900000, max: 100 },
  },
}));

// ── Dynamic imports ──────────────────────────────────────

const { errorHandler, notFoundHandler } = await import(
  '../../../src/middlewares/error.middleware.js'
);
const { ApiError } = await import('../../../src/utils/ApiError.js');
const { createReq, createRes, createNext } = await import(
  '../../helpers/controller-harness.js'
);

// ── Helpers ──────────────────────────────────────────────

function callErrorHandler(
  error: Error,
  reqOverrides: Partial<Request> = {}
): { res: Partial<Response>; next: NextFunction } {
  const req = createReq(reqOverrides);
  const res = createRes();
  const next = createNext();
  errorHandler(error, req as Request, res as Response, next);
  return { res, next };
}

function getJsonBody(res: Partial<Response>): any {
  return (res.json as jest.Mock<any>).mock.calls[0]?.[0];
}

function getStatus(res: Partial<Response>): number | undefined {
  return (res.status as jest.Mock<any>).mock.calls[0]?.[0];
}

// ── Tests ────────────────────────────────────────────────

describe('errorHandler middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  // ApiError passthrough
  describe('ApiError passthrough', () => {
    it('should return the same statusCode and message from an ApiError', () => {
      const error = ApiError.badRequest('Invalid input');
      const { res } = callErrorHandler(error);

      expect(getStatus(res)).toBe(400);
      const body = getJsonBody(res);
      expect(body.success).toBe(false);
      expect(body.message).toBe('Invalid input');
      expect(body.code).toBe('BAD_REQUEST');
    });

    it('should include error details when present', () => {
      const error = ApiError.validation([
        { field: 'email', message: 'required', code: 'invalid_type' },
      ]);
      const { res } = callErrorHandler(error);

      const body = getJsonBody(res);
      expect(body.errors).toBeDefined();
      expect(body.errors[0].field).toBe('email');
    });

    it('should include requestId when present on request', () => {
      const error = ApiError.badRequest('Oops');
      const { res } = callErrorHandler(error, { requestId: 'req-123' } as any);

      const body = getJsonBody(res);
      expect(body.requestId).toBe('req-123');
    });
  });

  // PostgreSQL errors
  describe('PostgreSQL error normalisation', () => {
    it('should convert 23505 (unique violation) to 409 Conflict', () => {
      const pgError = Object.assign(new Error('duplicate key'), {
        code: '23505',
        detail: 'Key (email)=(test@x.com) already exists.',
      });
      const { res } = callErrorHandler(pgError);

      expect(getStatus(res)).toBe(409);
      const body = getJsonBody(res);
      expect(body.message).toContain('email already exists');
    });

    it('should convert 23503 (FK violation) to 400', () => {
      const pgError = Object.assign(new Error('FK violation'), {
        code: '23503',
        detail: 'Key (user_id)=(abc) is not present in table "users".',
        constraint: 'fk_user',
        table: 'orders',
      });
      const { res } = callErrorHandler(pgError);

      expect(getStatus(res)).toBe(400);
    });

    it('should convert 23502 (not-null violation) to 400', () => {
      const pgError = Object.assign(new Error('not null'), {
        code: '23502',
        column: 'username',
      });
      const { res } = callErrorHandler(pgError);

      expect(getStatus(res)).toBe(400);
      expect(getJsonBody(res).message).toContain('username is required');
    });

    it('should convert 23514 (check constraint) to 400', () => {
      const pgError = Object.assign(new Error('check'), { code: '23514' });
      const { res } = callErrorHandler(pgError);

      expect(getStatus(res)).toBe(400);
      expect(getJsonBody(res).message).toBe('Invalid data provided');
    });

    it('should convert 42P01 (undefined table) to 500', () => {
      const pgError = Object.assign(
        new Error('relation "foo" does not exist'),
        { code: '42P01' }
      );
      const { res } = callErrorHandler(pgError);

      expect(getStatus(res)).toBe(500);
    });

    it('should convert 42703 (undefined column) to 500', () => {
      const pgError = Object.assign(
        new Error('column "bar" does not exist'),
        { code: '42703' }
      );
      const { res } = callErrorHandler(pgError);

      expect(getStatus(res)).toBe(500);
    });
  });

  // JWT errors
  describe('JWT error normalisation', () => {
    it('should convert JsonWebTokenError to 401', () => {
      const jwtErr = new Error('invalid signature');
      jwtErr.name = 'JsonWebTokenError';
      const { res } = callErrorHandler(jwtErr);

      expect(getStatus(res)).toBe(401);
      expect(getJsonBody(res).message).toBe('Invalid token');
    });

    it('should convert TokenExpiredError to 401 with expiry info', () => {
      const jwtErr = Object.assign(new Error('jwt expired'), {
        name: 'TokenExpiredError',
        expiredAt: new Date('2025-01-01T00:00:00Z'),
      });
      const { res } = callErrorHandler(jwtErr);

      expect(getStatus(res)).toBe(401);
      expect(getJsonBody(res).message).toContain('Token expired');
    });

    it('should convert NotBeforeError to 401', () => {
      const jwtErr = new Error('jwt not active');
      jwtErr.name = 'NotBeforeError';
      const { res } = callErrorHandler(jwtErr);

      expect(getStatus(res)).toBe(401);
      expect(getJsonBody(res).message).toBe('Token not yet valid');
    });
  });

  // Unknown / generic errors
  describe('unknown errors', () => {
    it('should default to 500 for unrecognised errors', () => {
      const { res } = callErrorHandler(new Error('Something broke'));

      expect(getStatus(res)).toBe(500);
    });

    it('should include stack trace in development mode', () => {
      const { res } = callErrorHandler(new Error('dev error'));
      const body = getJsonBody(res);

      // env.isDevelopment is true in our mock
      expect(body.stack).toBeDefined();
    });

    it('should convert SyntaxError with body property to 400', () => {
      const syntaxErr = Object.assign(
        new SyntaxError('Unexpected token i in JSON'),
        { body: '{ bad json' }
      );
      const { res } = callErrorHandler(syntaxErr);

      expect(getStatus(res)).toBe(400);
      expect(getJsonBody(res).message).toBe('Invalid JSON in request body');
    });
  });

  // Response already sent
  describe('headers already sent', () => {
    it('should bail out when res.headersSent is true', () => {
      const req = createReq();
      const res = createRes();
      (res as any).headersSent = true;
      const next = createNext();

      errorHandler(new Error('late'), req as Request, res as Response, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  // Logging behaviour
  describe('error logging', () => {
    it('should log 5xx errors at error level', () => {
      callErrorHandler(new Error('server boom'));
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log 4xx errors at warn level', () => {
      callErrorHandler(ApiError.badRequest('bad'));
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});

// ── notFoundHandler ──────────────────────────────────────

describe('notFoundHandler', () => {
  it('should respond with 404 and route information', () => {
    const req = createReq({ method: 'GET', path: '/api/v1/missing' });
    const res = createRes();
    const next = createNext();

    notFoundHandler(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = (res.json as jest.Mock<any>).mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toContain('GET');
    expect(body.message).toContain('/api/v1/missing');
    expect(body.code).toBe('NOT_FOUND');
  });

  it('should include requestId when present', () => {
    const req = createReq({ method: 'POST', path: '/nope' });
    (req as any).requestId = 'rid-456';
    const res = createRes();
    const next = createNext();

    notFoundHandler(req as Request, res as Response, next);

    const body = (res.json as jest.Mock<any>).mock.calls[0][0];
    expect(body.requestId).toBe('rid-456');
  });
});
