/**
 * Rate Limiter Middleware Unit Tests
 *
 * Tests the rate limiter configuration and factory functions.
 * The actual rate-limiting behaviour (counting, windowing) is owned
 * by express-rate-limit — we test our configuration layer.
 */

import { jest } from '@jest/globals';
import type { Request as _Request, Response as _Response, NextFunction as _NextFunction } from 'express';

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
    rateLimit: { windowMs: 900000, max: 100 },
    isTest: true,
    isProduction: false,
    isDevelopment: true,
  },
}));

// ── Dynamic imports ──────────────────────────────────────

const {
  globalLimiter,
  authLimiter,
  strictLimiter,
  apiLimiter,
  uploadLimiter,
  createRateLimiter,
  aiGenerationLimiter,
  messagingLimiter,
  exportLimiter,
} = await import('../../../src/middlewares/rateLimiter.middleware.js');

// ── Tests ────────────────────────────────────────────────

describe('rateLimiter middleware', () => {
  describe('exported limiters', () => {
    it('should export globalLimiter as a middleware function', () => {
      expect(typeof globalLimiter).toBe('function');
    });

    it('should export authLimiter as a middleware function', () => {
      expect(typeof authLimiter).toBe('function');
    });

    it('should export strictLimiter as a middleware function', () => {
      expect(typeof strictLimiter).toBe('function');
    });

    it('should export apiLimiter as a middleware function', () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should export uploadLimiter as a middleware function', () => {
      expect(typeof uploadLimiter).toBe('function');
    });

    it('should export domain-specific limiters', () => {
      expect(typeof aiGenerationLimiter).toBe('function');
      expect(typeof messagingLimiter).toBe('function');
      expect(typeof exportLimiter).toBe('function');
    });
  });

  describe('createRateLimiter factory', () => {
    it('should return a middleware function with default IP-based key', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 10,
        message: 'Custom limit',
      });
      expect(typeof limiter).toBe('function');
    });

    it('should return a middleware function with user-based key', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 10,
        keyGenerator: 'user',
      });
      expect(typeof limiter).toBe('function');
    });

    it('should accept a custom message', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 5,
        message: 'Slow down!',
      });
      expect(typeof limiter).toBe('function');
    });
  });
});
