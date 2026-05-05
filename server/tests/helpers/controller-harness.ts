/**
 * Controller Test Harness
 *
 * Streamlines controller unit testing by setting up all common mocks
 * and providing helper functions for request/response creation.
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, IJwtPayload } from '../../src/types/index.js';
import { setupDbMock } from './mock-db.js';
import { setupLoggerMock, setupCacheMock } from './mock-services.js';

export interface ControllerTestContext {
  mockQuery: jest.Mock<any>;
  mockTransaction: jest.Mock<any>;
  mockLogger: ReturnType<typeof setupLoggerMock>;
  mockCache: ReturnType<typeof setupCacheMock>;
  serviceMocks: Record<string, jest.Mock<any>>;
}

/**
 * Setup common infrastructure mocks for controller tests.
 * Call this BEFORE registering service-specific mocks and importing the controller.
 *
 * Usage:
 * ```
 * const ctx = setupControllerMocks();
 *
 * // Add service-specific mocks
 * jest.unstable_mockModule('...service.js', () => ({ ... }));
 *
 * // Dynamic import controller
 * const { myController } = await import('...controller.js');
 * ```
 */
export function setupControllerMocks(basePath: string = '../..'): ControllerTestContext {
  const { mockQuery, mockTransaction } = setupDbMock(basePath);
  const mockLogger = setupLoggerMock(basePath);
  const mockCache = setupCacheMock(basePath);

  return {
    mockQuery,
    mockTransaction,
    mockLogger,
    mockCache,
    serviceMocks: {},
  };
}

/**
 * Create a mock Express Request
 */
export function createReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    get: jest.fn() as unknown as Request['get'],
    ...overrides,
  };
}

/**
 * Create a mock Express Response with chainable methods
 */
export function createRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res) as unknown as Response['status'];
  res.json = jest.fn().mockReturnValue(res) as unknown as Response['json'];
  res.send = jest.fn().mockReturnValue(res) as unknown as Response['send'];
  res.cookie = jest.fn().mockReturnValue(res) as unknown as Response['cookie'];
  res.clearCookie = jest.fn().mockReturnValue(res) as unknown as Response['clearCookie'];
  res.setHeader = jest.fn().mockReturnValue(res) as unknown as Response['setHeader'];
  res.end = jest.fn().mockReturnValue(res) as unknown as Response['end'];
  res.redirect = jest.fn() as unknown as Response['redirect'];
  return res;
}

/**
 * Create a mock NextFunction
 */
export function createNext(): NextFunction {
  return jest.fn() as unknown as NextFunction;
}

/**
 * Create a mock authenticated request with user payload
 */
export function createAuthReq(
  user: Partial<IJwtPayload> = {},
  overrides: Partial<AuthenticatedRequest> = {}
): Partial<AuthenticatedRequest> {
  return {
    ...createReq(overrides as Partial<Request>),
    user: {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
      ...user,
    } as IJwtPayload,
    ...overrides,
  };
}

/**
 * Extract the JSON response body from a mock response
 */
export function getJsonBody(res: Partial<Response>): any {
  return (res.json as jest.Mock<any>).mock.calls[0]?.[0];
}

/**
 * Extract the status code from a mock response
 */
export function getStatus(res: Partial<Response>): number | undefined {
  return (res.status as jest.Mock<any>).mock.calls[0]?.[0];
}

/**
 * Assert a successful API response shape
 */
export function expectSuccess(res: Partial<Response>, statusCode: number = 200) {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  const body = getJsonBody(res);
  expect(body).toHaveProperty('success', true);
  return body;
}

/**
 * Call an asyncHandler-wrapped controller handler and wait for completion.
 * asyncHandler returns void (not a promise), so `await handler()` resolves
 * before internal `.catch(next)` fires. This helper ensures the inner
 * promise settles before assertions run.
 */
export async function callHandler(
  handler: (...args: unknown[]) => unknown,
  req: Partial<Request | AuthenticatedRequest>,
  res: Partial<Response>,
  next: NextFunction
): Promise<void> {
  handler(req, res, next);
  await new Promise(r => process.nextTick(r));
}

/**
 * Assert an error was passed to next()
 */
export function expectNextCalledWithError(next: NextFunction, statusCode?: number) {
  expect(next).toHaveBeenCalled();
  const error = (next as jest.Mock<any>).mock.calls[0]?.[0];
  expect(error).toBeDefined();
  if (statusCode) {
    expect(error.statusCode || error.status).toBe(statusCode);
  }
  return error;
}
