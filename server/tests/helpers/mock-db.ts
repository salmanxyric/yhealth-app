/**
 * Centralized Database Mock
 *
 * Provides a single function to mock both config/database.config.js and database/pg.js
 * so that no service accidentally hits the real database during unit tests.
 */

import { jest } from '@jest/globals';

export interface MockDbSetup {
  mockQuery: jest.Mock<(...args: any[]) => any>;
  mockTransaction: jest.Mock<(...args: any[]) => any>;
  mockGetClient: jest.Mock<(...args: any[]) => any>;
}

/**
 * Register database mocks for both import paths.
 * MUST be called before any `await import()` of services.
 *
 * The transaction mock executes the callback with the mockQuery as the client,
 * matching the real signature: `transaction(cb: (client) => Promise<T>): Promise<T>`
 */
export function setupDbMock(basePath?: string): MockDbSetup {
  const resolvedBase = basePath ?? '../..';
  // Paths resolve relative to THIS file (tests/helpers/), not the calling test file
  const mockQuery = jest.fn<any>();

  const mockClient = {
    query: mockQuery,
    release: jest.fn(),
  };

  const mockTransaction = jest.fn<any>().mockImplementation(
    async (cb: (client: typeof mockClient) => Promise<unknown>) => cb(mockClient)
  );

  const mockGetClient = jest.fn<any>().mockResolvedValue(mockClient);

  const dbMockShape = {
    query: mockQuery,
    transaction: mockTransaction,
    pool: { query: mockQuery, end: jest.fn() },
    database: { healthCheck: jest.fn().mockResolvedValue(true) },
    getClient: mockGetClient,
    closePool: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
    getPoolStats: jest.fn().mockReturnValue({ total: 10, idle: 8, waiting: 0 }),
    default: {},
  };

  jest.unstable_mockModule(`${resolvedBase}/src/config/database.config.js`, () => dbMockShape);
  jest.unstable_mockModule(`${resolvedBase}/src/database/pg.js`, () => ({
    query: mockQuery,
    transaction: mockTransaction,
    pool: dbMockShape.pool,
  }));

  return { mockQuery, mockTransaction, mockGetClient };
}
