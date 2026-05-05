/**
 * Validate Middleware Unit Tests
 */

import { jest } from '@jest/globals';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// No external dependencies to mock — validate middleware is pure
const { validate, validateRequest, commonSchemas } = await import(
  '../../../src/middlewares/validate.middleware.js'
);
const { ApiError } = await import('../../../src/utils/ApiError.js');
const { createReq, createRes, createNext } = await import(
  '../../helpers/controller-harness.js'
);

describe('validate middleware', () => {
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    res = createRes();
    next = createNext();
  });

  // -------------------------------------------------------
  // validate() — single target
  // -------------------------------------------------------

  describe('validate(schema, target)', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it('should call next() when body data is valid', () => {
      const req = createReq({ body: { name: 'Alice', age: 30 } });
      validate(schema)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should replace req.body with parsed/transformed data', () => {
      const schema = z.object({
        email: z.string().email().toLowerCase(),
      });
      const req = createReq({ body: { email: 'TEST@EXAMPLE.COM', extra: 'ignored' } });

      validate(schema)(req as Request, res as Response, next);

      expect(req.body).toEqual({ email: 'test@example.com' });
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next(ApiError) with 400 when body data is invalid', () => {
      const req = createReq({ body: { name: '', age: -5 } });
      validate(schema)(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate query params when target is "query"', () => {
      const querySchema = z.object({ page: z.coerce.number().int().positive() });
      const req = createReq({ query: { page: '3' } as any });

      validate(querySchema, 'query')(req as Request, res as Response, next);

      expect(req.query).toEqual({ page: 3 });
      expect(next).toHaveBeenCalledWith();
    });

    it('should validate route params when target is "params"', () => {
      const paramsSchema = z.object({ id: z.string().uuid() });
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const req = createReq({ params: { id: validUuid } });

      validate(paramsSchema, 'params')(req as Request, res as Response, next);

      expect(req.params).toEqual({ id: validUuid });
      expect(next).toHaveBeenCalledWith();
    });

    it('should include field path in validation error details', () => {
      const req = createReq({ body: { name: 123, age: 'not-a-number' } });
      validate(schema)(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error.details).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
      expect(error.details[0]).toHaveProperty('field');
      expect(error.details[0]).toHaveProperty('message');
    });
  });

  // -------------------------------------------------------
  // validateRequest() — multi-target
  // -------------------------------------------------------

  describe('validateRequest(schemas)', () => {
    it('should validate body and params together', () => {
      const req = createReq({
        body: { name: 'Test' },
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });

      validateRequest({
        body: z.object({ name: z.string().min(1) }),
        params: z.object({ id: z.string().uuid() }),
      })(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should collect errors from multiple targets', () => {
      const req = createReq({
        body: {},
        params: { id: 'not-a-uuid' },
      });

      validateRequest({
        body: z.object({ name: z.string() }),
        params: z.object({ id: z.string().uuid() }),
      })(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      // Errors from both body and params
      expect(error.details.length).toBeGreaterThanOrEqual(2);
    });

    it('should prefix error fields with target name', () => {
      const req = createReq({
        body: {},
        params: { id: 'bad' },
      });

      validateRequest({
        body: z.object({ name: z.string() }),
        params: z.object({ id: z.string().uuid() }),
      })(req as Request, res as Response, next);

      const error = (next as jest.Mock<any>).mock.calls[0][0];
      const fields = error.details.map((d: any) => d.field);
      expect(fields.some((f: string) => f.startsWith('params.'))).toBe(true);
      expect(fields.some((f: string) => f.startsWith('body.'))).toBe(true);
    });
  });

  // -------------------------------------------------------
  // commonSchemas
  // -------------------------------------------------------

  describe('commonSchemas', () => {
    it('should validate a proper email', () => {
      const result = commonSchemas.email.safeParse('User@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });

    it('should reject an invalid email', () => {
      const result = commonSchemas.email.safeParse('not-an-email');
      expect(result.success).toBe(false);
    });

    it('should enforce password strength rules', () => {
      // Missing special character
      const weak = commonSchemas.password.safeParse('Abcdefg1');
      expect(weak.success).toBe(false);

      const strong = commonSchemas.password.safeParse('Abcdefg1!');
      expect(strong.success).toBe(true);
    });
  });
});
