/**
 * Common Service Mocks
 *
 * Reusable mock registrations for transitive dependencies that most services import.
 * Each function calls jest.unstable_mockModule() — MUST be called before dynamic imports.
 */

import { jest } from '@jest/globals';

export function setupLoggerMock(basePath: string = '../..') {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  };
  jest.unstable_mockModule(`${basePath}/src/services/logger.service.js`, () => ({
    logger: mockLogger,
  }));
  return mockLogger;
}

export function setupCacheMock(basePath: string = '../..') {
  const mockCache = {
    get: jest.fn<any>().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn(),
    deleteByPattern: jest.fn().mockReturnValue(0),
    getOrSet: jest.fn<any>().mockImplementation(
      async (_key: string, factory: () => Promise<unknown>) => factory()
    ),
    has: jest.fn<any>().mockReturnValue(false),
    clear: jest.fn(),
    getStats: jest.fn().mockReturnValue({ keys: 0, hits: 0, misses: 0 }),
  };
  jest.unstable_mockModule(`${basePath}/src/services/cache.service.js`, () => ({
    cache: mockCache,
    default: mockCache,
    cacheKeys: {
      user: (id: string) => `user:${id}`,
      userByEmail: (email: string) => `user:email:${email}`,
      session: (id: string) => `session:${id}`,
      token: (token: string) => `token:${token}`,
      config: (key: string) => `config:${key}`,
      list: (resource: string, params?: string) => `list:${resource}${params ? `:${params}` : ''}`,
      count: (resource: string, filter?: string) => `count:${resource}${filter ? `:${filter}` : ''}`,
    },
  }));
  return mockCache;
}

export function setupRedisCacheMock(basePath: string = '../..') {
  const mockRedis = {
    get: jest.fn<any>().mockResolvedValue(null),
    set: jest.fn<any>().mockResolvedValue(true),
    delete: jest.fn<any>().mockResolvedValue(true),
    del: jest.fn<any>().mockResolvedValue(true),
    has: jest.fn<any>().mockResolvedValue(false),
    flush: jest.fn(),
    getStats: jest.fn().mockReturnValue({ keys: 0, hits: 0, misses: 0 }),
    zAdd: jest.fn<any>().mockResolvedValue(true),
    zAddMultiple: jest.fn<any>().mockResolvedValue(true),
    zRange: jest.fn<any>().mockResolvedValue([]),
    zRevRange: jest.fn<any>().mockResolvedValue([]),
    zRank: jest.fn<any>().mockResolvedValue(null),
    zRevRank: jest.fn<any>().mockResolvedValue(null),
    zScore: jest.fn<any>().mockResolvedValue(null),
    zCard: jest.fn<any>().mockResolvedValue(0),
    zRem: jest.fn<any>().mockResolvedValue(true),
    zDelete: jest.fn<any>().mockResolvedValue(true),
    expire: jest.fn<any>().mockResolvedValue(true),
  };
  jest.unstable_mockModule(`${basePath}/src/services/redis-cache.service.js`, () => ({
    redisCacheService: mockRedis,
  }));
  return mockRedis;
}

export function setupQueueMock(basePath: string = '../..') {
  const mockQueueInstance = {
    add: jest.fn<any>().mockResolvedValue(undefined),
    close: jest.fn<any>().mockResolvedValue(undefined),
    getJobs: jest.fn<any>().mockResolvedValue([]),
  };

  jest.unstable_mockModule('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => mockQueueInstance),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
    })),
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
    })),
  }));

  jest.unstable_mockModule(`${basePath}/src/config/queue.config.js`, () => ({
    redisConnection: {},
    queueConfig: { defaultJobOptions: {} },
    QueueNames: {
      ACTIVITY_EVENT_PROCESSING: 'activity-event-processing',
      EXERCISE_INGESTION: 'exercise-ingestion',
      EMAIL_DELIVERY: 'email-delivery',
      EMBEDDING_SYNC: 'embedding-sync',
      STREAK_EVENTS: 'streak-events',
    },
    JobPriorities: { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, BACKGROUND: 1 },
  }));

  return mockQueueInstance;
}

export function setupEmailMock(basePath: string = '../..') {
  const mockEmail = {
    sendEmail: jest.fn<any>().mockResolvedValue(true),
    sendVerificationEmail: jest.fn<any>().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn<any>().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn<any>().mockResolvedValue(true),
  };
  jest.unstable_mockModule(`${basePath}/src/services/email.service.js`, () => ({
    emailService: mockEmail,
  }));
  return mockEmail;
}

export function setupModelFactoryMock(basePath: string = '../..') {
  const mockModelFactory = {
    getModel: jest.fn().mockReturnValue({
      invoke: jest.fn<any>().mockResolvedValue({ content: 'mock response' }),
    }),
    getActiveProvider: jest.fn().mockReturnValue('mock'),
  };
  jest.unstable_mockModule(`${basePath}/src/services/model-factory.service.js`, () => ({
    modelFactory: mockModelFactory,
  }));
  return mockModelFactory;
}

/**
 * Setup all common mocks at once. Returns all mock objects.
 */
export function setupAllCommonMocks(basePath: string = '../..') {
  return {
    logger: setupLoggerMock(basePath),
    cache: setupCacheMock(basePath),
    redis: setupRedisCacheMock(basePath),
    queue: setupQueueMock(basePath),
    email: setupEmailMock(basePath),
    modelFactory: setupModelFactoryMock(basePath),
  };
}
