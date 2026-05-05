/**
 * Tool Metrics Service Unit Tests
 *
 * Tests the in-memory per-tool execution metrics singleton.
 * Covers recording, aggregation, P95 calculation, sorting, and reset.
 */

import { toolMetricsService } from '../../../src/services/tool-metrics.service.js';

describe('ToolMetricsService', () => {
  beforeEach(() => {
    toolMetricsService.reset();
  });

  // ─── 1. Single call recording ───────────────────────────────────

  describe('record() + getMetrics() — single call', () => {
    it('should record a single successful tool call and return its metrics', () => {
      toolMetricsService.record('searchTool', 42, true);

      const metrics = toolMetricsService.getMetrics();
      expect(metrics).toHaveLength(1);

      const m = metrics[0];
      expect(m.toolName).toBe('searchTool');
      expect(m.calls).toBe(1);
      expect(m.successes).toBe(1);
      expect(m.failures).toBe(0);
      expect(m.failureRate).toBe(0);
      expect(m.avgMs).toBe(42);
      expect(m.maxMs).toBe(42);
      expect(m.p95Ms).toBe(42);
    });

    it('should record a single failed tool call correctly', () => {
      toolMetricsService.record('brokenTool', 100, false);

      const metrics = toolMetricsService.getMetrics();
      expect(metrics).toHaveLength(1);

      const m = metrics[0];
      expect(m.successes).toBe(0);
      expect(m.failures).toBe(1);
      expect(m.failureRate).toBe(100);
    });
  });

  // ─── 2. Multiple calls — counts, avgMs, maxMs ──────────────────

  describe('record() — multiple calls', () => {
    it('should accumulate counts, compute avgMs, and track maxMs', () => {
      toolMetricsService.record('fetchTool', 10, true);
      toolMetricsService.record('fetchTool', 20, true);
      toolMetricsService.record('fetchTool', 30, true);

      const metrics = toolMetricsService.getMetrics();
      expect(metrics).toHaveLength(1);

      const m = metrics[0];
      expect(m.calls).toBe(3);
      expect(m.successes).toBe(3);
      expect(m.avgMs).toBe(20); // (10+20+30)/3 = 20
      expect(m.maxMs).toBe(30);
    });
  });

  // ─── 3. Success / failure tracking and failureRate ──────────────

  describe('failureRate calculation', () => {
    it('should compute failureRate as percentage rounded to 2 decimals', () => {
      // 1 failure out of 3 calls = 33.33%
      toolMetricsService.record('flaky', 10, true);
      toolMetricsService.record('flaky', 10, false);
      toolMetricsService.record('flaky', 10, true);

      const m = toolMetricsService.getMetrics()[0];
      expect(m.failures).toBe(1);
      expect(m.failureRate).toBe(33.33);
    });

    it('should return 0 failureRate when all calls succeed', () => {
      toolMetricsService.record('reliable', 5, true);
      toolMetricsService.record('reliable', 5, true);

      const m = toolMetricsService.getMetrics()[0];
      expect(m.failureRate).toBe(0);
    });

    it('should return 100 failureRate when all calls fail', () => {
      toolMetricsService.record('disaster', 5, false);
      toolMetricsService.record('disaster', 5, false);

      const m = toolMetricsService.getMetrics()[0];
      expect(m.failureRate).toBe(100);
    });
  });

  // ─── 4. P95 calculation with many calls ─────────────────────────

  describe('P95 calculation', () => {
    it('should compute P95 from sorted durations using ceil(length * 0.95) - 1', () => {
      // Record 20 calls with durations 1..20
      for (let i = 1; i <= 20; i++) {
        toolMetricsService.record('latencyTool', i, true);
      }

      const m = toolMetricsService.getMetrics()[0];
      // P95 index = ceil(20 * 0.95) - 1 = ceil(19) - 1 = 19 - 1 = 18
      // sorted[18] = 19 (0-indexed, durations 1..20)
      expect(m.p95Ms).toBe(19);
    });

    it('should retain only the last 100 durations for P95', () => {
      // Record 110 calls — first 10 are very slow (9999ms)
      for (let i = 0; i < 10; i++) {
        toolMetricsService.record('overflow', 9999, true);
      }
      // Next 100 calls are fast (1ms each)
      for (let i = 0; i < 100; i++) {
        toolMetricsService.record('overflow', 1, true);
      }

      const m = toolMetricsService.getMetrics()[0];
      // The 10 slow durations have been shifted out; only 100 x 1ms remain
      expect(m.p95Ms).toBe(1);
    });
  });

  // ─── 5. getTopSlowest ordering ─────────────────────────────────

  describe('getTopSlowest()', () => {
    it('should return tools sorted by P95 latency descending', () => {
      toolMetricsService.record('fast', 10, true);
      toolMetricsService.record('medium', 50, true);
      toolMetricsService.record('slow', 200, true);

      const top = toolMetricsService.getTopSlowest(3);
      expect(top).toHaveLength(3);
      expect(top[0].toolName).toBe('slow');
      expect(top[1].toolName).toBe('medium');
      expect(top[2].toolName).toBe('fast');
    });

    it('should limit results to n entries', () => {
      toolMetricsService.record('a', 100, true);
      toolMetricsService.record('b', 200, true);
      toolMetricsService.record('c', 300, true);

      const top = toolMetricsService.getTopSlowest(2);
      expect(top).toHaveLength(2);
      expect(top[0].toolName).toBe('c');
      expect(top[1].toolName).toBe('b');
    });
  });

  // ─── 6. getFailureRates — only tools with failures ─────────────

  describe('getFailureRates()', () => {
    it('should return only tools that have failures', () => {
      toolMetricsService.record('healthy', 10, true);
      toolMetricsService.record('sick', 10, false);
      toolMetricsService.record('mixed', 10, true);
      toolMetricsService.record('mixed', 10, false);

      const failing = toolMetricsService.getFailureRates();
      const names = failing.map((m) => m.toolName);

      expect(names).toContain('sick');
      expect(names).toContain('mixed');
      expect(names).not.toContain('healthy');
    });

    it('should sort by failureRate descending', () => {
      // sick: 1/1 = 100%, mixed: 1/3 = 33.33%
      toolMetricsService.record('sick', 10, false);
      toolMetricsService.record('mixed', 10, true);
      toolMetricsService.record('mixed', 10, true);
      toolMetricsService.record('mixed', 10, false);

      const failing = toolMetricsService.getFailureRates();
      expect(failing[0].toolName).toBe('sick');
      expect(failing[1].toolName).toBe('mixed');
    });

    it('should return empty array when no tools have failures', () => {
      toolMetricsService.record('perfect', 5, true);
      expect(toolMetricsService.getFailureRates()).toHaveLength(0);
    });
  });

  // ─── 7. reset() ────────────────────────────────────────────────

  describe('reset()', () => {
    it('should clear all recorded metrics', () => {
      toolMetricsService.record('tool1', 10, true);
      toolMetricsService.record('tool2', 20, false);

      expect(toolMetricsService.getMetrics()).toHaveLength(2);

      toolMetricsService.reset();

      expect(toolMetricsService.getMetrics()).toHaveLength(0);
      expect(toolMetricsService.getTopSlowest(10)).toHaveLength(0);
      expect(toolMetricsService.getFailureRates()).toHaveLength(0);
    });
  });

  // ─── 8. Multiple tools tracked independently ───────────────────

  describe('independent tool tracking', () => {
    it('should track metrics for each tool separately', () => {
      toolMetricsService.record('alpha', 100, true);
      toolMetricsService.record('alpha', 200, false);
      toolMetricsService.record('beta', 5, true);

      const metrics = toolMetricsService.getMetrics();
      expect(metrics).toHaveLength(2);

      const alpha = metrics.find((m) => m.toolName === 'alpha')!;
      const beta = metrics.find((m) => m.toolName === 'beta')!;

      expect(alpha.calls).toBe(2);
      expect(alpha.failures).toBe(1);
      expect(alpha.maxMs).toBe(200);

      expect(beta.calls).toBe(1);
      expect(beta.failures).toBe(0);
      expect(beta.maxMs).toBe(5);
    });
  });

  // ─── 9. lastCalledAt is a valid ISO string ─────────────────────

  describe('lastCalledAt', () => {
    it('should be a valid ISO 8601 date string', () => {
      toolMetricsService.record('timestamped', 10, true);

      const m = toolMetricsService.getMetrics()[0];
      expect(m.lastCalledAt).toBeTruthy();

      // Parsing the ISO string and converting back should produce the same string
      const parsed = new Date(m.lastCalledAt);
      expect(parsed.toISOString()).toBe(m.lastCalledAt);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    it('should update lastCalledAt on subsequent calls', () => {
      toolMetricsService.record('updating', 10, true);
      const first = toolMetricsService.getMetrics()[0].lastCalledAt;

      // Record again — lastCalledAt should be >= first
      toolMetricsService.record('updating', 20, true);
      const second = toolMetricsService.getMetrics()[0].lastCalledAt;

      expect(new Date(second).getTime()).toBeGreaterThanOrEqual(
        new Date(first).getTime(),
      );
    });
  });

  // ─── 10. getMetrics sorting — by call count descending ─────────

  describe('getMetrics() sorting', () => {
    it('should return metrics sorted by call count descending', () => {
      toolMetricsService.record('low', 1, true);
      toolMetricsService.record('high', 1, true);
      toolMetricsService.record('high', 1, true);
      toolMetricsService.record('high', 1, true);
      toolMetricsService.record('mid', 1, true);
      toolMetricsService.record('mid', 1, true);

      const metrics = toolMetricsService.getMetrics();
      expect(metrics[0].toolName).toBe('high');
      expect(metrics[0].calls).toBe(3);
      expect(metrics[1].toolName).toBe('mid');
      expect(metrics[1].calls).toBe(2);
      expect(metrics[2].toolName).toBe('low');
      expect(metrics[2].calls).toBe(1);
    });
  });
});
