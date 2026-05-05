/**
 * Health Controller Unit Tests
 *
 * Tests all health-check endpoints: basic, liveness, readiness,
 * detailed, server info, proactive messaging, circuit breaker reset.
 */

import { jest } from '@jest/globals';
import type { Response } from 'express';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks ────────────────────────────────────────
const { mockQuery } = setupDbMock();
setupLoggerMock();
const mockCache = setupCacheMock();
mockCache.healthCheck = jest.fn<any>().mockReturnValue({ status: 'up', stats: { keys: 0 } });

// ── env mock ────────────────────────────────────────────────────
const mockEnv = {
  isProduction: false,
  nodeEnv: 'test',
  jwt: { secret: 'test-secret' },
};
jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: mockEnv,
  default: mockEnv,
}));

// ── LLM circuit-breaker mock ────────────────────────────────────
const mockCircuitBreaker = {
  getStatus: jest.fn<any>().mockReturnValue({
    state: 'CLOSED',
    consecutiveFailures: 0,
    cooldownMs: 0,
    cooldownRemaining: 0,
  }),
  forceReset: jest.fn(),
};
jest.unstable_mockModule('../../../src/services/llm-circuit-breaker.service.js', () => ({
  llmCircuitBreaker: mockCircuitBreaker,
}));

// ── Model factory mock ──────────────────────────────────────────
const mockModelFactory = {
  isAvailable: jest.fn<any>().mockReturnValue(true),
  getActiveProvider: jest.fn<any>().mockReturnValue('openai'),
};
jest.unstable_mockModule('../../../src/services/model-factory.service.js', () => ({
  modelFactory: mockModelFactory,
}));

// ── Dynamic imports ─────────────────────────────────────────────
const {
  healthCheck,
  livenessProbe,
  readinessProbe,
  detailedHealthCheck,
  serverInfo,
  proactiveMessagingHealth,
  resetCircuitBreaker,
} = await import('../../../src/controllers/health.controller.js');

const { createReq, createRes, getJsonBody, getStatus } =
  await import('../../helpers/controller-harness.js');

const { pgResult } = await import('../../helpers/factories.js');

// ─────────────────────────────────────────────────────────────────

describe('HealthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.healthCheck.mockReturnValue({ status: 'up', stats: { keys: 0 } });
  });

  // ── healthCheck ───────────────────────────────────────────────

  describe('healthCheck', () => {
    it('returns 200 with status ok', async () => {
      const req = createReq();
      const res = createRes();

      await healthCheck(req as any, res as Response);

      expect(getStatus(res)).toBe(200);
      const body = getJsonBody(res);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  // ── livenessProbe ─────────────────────────────────────────────

  describe('livenessProbe', () => {
    it('returns 200 with status alive', async () => {
      const req = createReq();
      const res = createRes();

      await livenessProbe(req as any, res as Response);

      expect(getStatus(res)).toBe(200);
      expect(getJsonBody(res).status).toBe('alive');
    });
  });

  // ── readinessProbe ────────────────────────────────────────────

  describe('readinessProbe', () => {
    it('returns 200 when database is up', async () => {
      const { database } = await import('../../../src/config/database.config.js');
      (database.healthCheck as jest.Mock<any>).mockResolvedValue({ status: 'up', latency: 5 });

      const req = createReq();
      const res = createRes();

      await readinessProbe(req as any, res as Response);

      expect(getStatus(res)).toBe(200);
      expect(getJsonBody(res).status).toBe('ready');
    });

    it('returns 503 when database is down', async () => {
      const { database } = await import('../../../src/config/database.config.js');
      (database.healthCheck as jest.Mock<any>).mockResolvedValue({ status: 'down', message: 'Connection refused' });

      const req = createReq();
      const res = createRes();

      await readinessProbe(req as any, res as Response);

      expect(getStatus(res)).toBe(503);
      expect(getJsonBody(res).status).toBe('not_ready');
    });
  });

  // ── detailedHealthCheck ───────────────────────────────────────

  describe('detailedHealthCheck', () => {
    it('returns 200 with full health details when DB is up', async () => {
      const { database } = await import('../../../src/config/database.config.js');
      (database.healthCheck as jest.Mock<any>).mockResolvedValue({ status: 'up', latency: 3 });
      mockCache.healthCheck = jest.fn<any>().mockReturnValue({
        status: 'up',
        stats: { keys: 42 },
      });
      // Re-register the cache mock so it takes effect via the module system
      // (Already registered at top level; the controller uses the imported reference)

      const req = createReq();
      const res = createRes();

      await detailedHealthCheck(req as any, res as Response);

      expect(getStatus(res)).toBe(200);
      const body = getJsonBody(res);
      expect(body.status).toBe('healthy');
      expect(body.services.database.status).toBe('up');
      expect(body.memory).toBeDefined();
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('returns 503 when database is unhealthy', async () => {
      const { database } = await import('../../../src/config/database.config.js');
      (database.healthCheck as jest.Mock<any>).mockResolvedValue({ status: 'down', message: 'timeout' });

      const req = createReq();
      const res = createRes();

      await detailedHealthCheck(req as any, res as Response);

      expect(getStatus(res)).toBe(503);
      expect(getJsonBody(res).status).toBe('unhealthy');
    });
  });

  // ── serverInfo ────────────────────────────────────────────────

  describe('serverInfo', () => {
    it('returns server info in non-production', async () => {
      mockEnv.isProduction = false;

      const req = createReq();
      const res = createRes();

      await serverInfo(req as any, res as Response);

      expect(getStatus(res)).toBe(200);
      const body = getJsonBody(res);
      expect(body.environment).toBe('test');
      expect(body.nodeVersion).toBeDefined();
    });

    it('returns 404 in production', async () => {
      mockEnv.isProduction = true;

      const req = createReq();
      const res = createRes();

      await serverInfo(req as any, res as Response);

      expect(getStatus(res)).toBe(404);
      expect(getJsonBody(res).message).toBe('Not found');

      // Reset
      mockEnv.isProduction = false;
    });
  });

  // ── proactiveMessagingHealth ───────────────────────────────────

  describe('proactiveMessagingHealth', () => {
    it('returns 200 when LLM is available and circuit breaker is closed', async () => {
      mockModelFactory.isAvailable.mockReturnValue(true);
      mockCircuitBreaker.getStatus.mockReturnValue({
        state: 'CLOSED',
        consecutiveFailures: 0,
        cooldownMs: 0,
        cooldownRemaining: 0,
      });
      mockQuery.mockResolvedValueOnce(
        pgResult([{ total: '10', last24h: '3', last_sent: new Date().toISOString() }])
      );

      const req = createReq();
      const res = createRes();

      await proactiveMessagingHealth(req as any, res as Response);

      expect(getStatus(res)).toBe(200);
      const body = getJsonBody(res);
      expect(body.status).toBe('healthy');
      expect(body.llm.available).toBe(true);
      expect(body.messages.total).toBe(10);
    });

    it('returns 503 when circuit breaker is open', async () => {
      mockModelFactory.isAvailable.mockReturnValue(true);
      mockCircuitBreaker.getStatus.mockReturnValue({
        state: 'OPEN',
        consecutiveFailures: 5,
        cooldownMs: 30000,
        cooldownRemaining: 15000,
      });
      mockQuery.mockResolvedValueOnce(pgResult([{ total: '0', last24h: '0', last_sent: null }]));

      const req = createReq();
      const res = createRes();

      await proactiveMessagingHealth(req as any, res as Response);

      expect(getStatus(res)).toBe(503);
      expect(getJsonBody(res).status).toBe('degraded');
    });

    it('handles missing proactive_messages table gracefully', async () => {
      mockModelFactory.isAvailable.mockReturnValue(true);
      mockCircuitBreaker.getStatus.mockReturnValue({
        state: 'CLOSED',
        consecutiveFailures: 0,
        cooldownMs: 0,
        cooldownRemaining: 0,
      });
      mockQuery.mockRejectedValueOnce(new Error('relation "proactive_messages" does not exist'));

      const req = createReq();
      const res = createRes();

      await proactiveMessagingHealth(req as any, res as Response);

      expect(getStatus(res)).toBe(200);
      const body = getJsonBody(res);
      expect(body.messages.total).toBe(0);
    });
  });

  // ── resetCircuitBreaker ───────────────────────────────────────

  describe('resetCircuitBreaker', () => {
    it('resets the circuit breaker and returns previous + current status', async () => {
      const previousStatus = { state: 'OPEN', consecutiveFailures: 5, cooldownMs: 30000, cooldownRemaining: 10000 };
      const newStatus = { state: 'CLOSED', consecutiveFailures: 0, cooldownMs: 0, cooldownRemaining: 0 };

      mockCircuitBreaker.getStatus
        .mockReturnValueOnce(previousStatus)
        .mockReturnValueOnce(newStatus);

      const req = createReq();
      const res = createRes();

      await resetCircuitBreaker(req as any, res as Response);

      expect(mockCircuitBreaker.forceReset).toHaveBeenCalled();
      expect(getStatus(res)).toBe(200);
      const body = getJsonBody(res);
      expect(body.message).toBe('Circuit breaker reset');
      expect(body.previous).toEqual(previousStatus);
      expect(body.current).toEqual(newStatus);
    });
  });
});
