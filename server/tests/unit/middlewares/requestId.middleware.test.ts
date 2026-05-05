/**
 * RequestId Middleware Unit Tests
 */

import { jest as _jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

const { requestIdMiddleware } = await import(
  '../../../src/middlewares/requestId.middleware.js'
);
const { createReq, createRes, createNext } = await import(
  '../../helpers/controller-harness.js'
);

describe('requestIdMiddleware', () => {
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    res = createRes();
    next = createNext();
  });

  it('should generate a UUID and attach it to req.requestId', () => {
    const req = createReq({ headers: {} });

    requestIdMiddleware(req as Request, res as Response, next);

    expect((req as any).requestId).toBeDefined();
    // UUID v4 format
    expect((req as any).requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('should set X-Request-ID response header', () => {
    const req = createReq({ headers: {} });

    requestIdMiddleware(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Request-ID',
      expect.stringMatching(/^[0-9a-f-]+$/i)
    );
  });

  it('should reuse an existing X-Request-ID header from the request', () => {
    const existingId = 'client-provided-id-12345';
    const req = createReq({
      headers: { 'x-request-id': existingId },
    });

    requestIdMiddleware(req as Request, res as Response, next);

    expect((req as any).requestId).toBe(existingId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
  });

  it('should call next()', () => {
    const req = createReq({ headers: {} });

    requestIdMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
