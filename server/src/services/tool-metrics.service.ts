/**
 * @file Tool Metrics Service
 * @description In-memory per-tool execution metrics. Zero database dependency.
 * Logs a summary every 5 minutes and exposes metrics for admin endpoints.
 */

import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

interface ToolMetricEntry {
  calls: number;
  successes: number;
  failures: number;
  totalMs: number;
  maxMs: number;
  durations: number[];
  lastCalledAt: number;
}

export interface ToolMetricSnapshot {
  toolName: string;
  calls: number;
  successes: number;
  failures: number;
  failureRate: number;
  avgMs: number;
  maxMs: number;
  p95Ms: number;
  lastCalledAt: string;
}

// ============================================
// SERVICE
// ============================================

class ToolMetricsService {
  private metrics = new Map<string, ToolMetricEntry>();
  private summaryInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.summaryInterval = setInterval(() => this.logSummary(), 5 * 60 * 1000);
    this.summaryInterval.unref();
  }

  record(toolName: string, durationMs: number, success: boolean): void {
    let entry = this.metrics.get(toolName);
    if (!entry) {
      entry = { calls: 0, successes: 0, failures: 0, totalMs: 0, maxMs: 0, durations: [], lastCalledAt: 0 };
      this.metrics.set(toolName, entry);
    }

    entry.calls++;
    if (success) entry.successes++;
    else entry.failures++;
    entry.totalMs += durationMs;
    if (durationMs > entry.maxMs) entry.maxMs = durationMs;
    entry.lastCalledAt = Date.now();

    // Keep last 100 durations for P95 calculation
    entry.durations.push(durationMs);
    if (entry.durations.length > 100) entry.durations.shift();
  }

  getMetrics(): ToolMetricSnapshot[] {
    const snapshots: ToolMetricSnapshot[] = [];
    for (const [toolName, entry] of this.metrics) {
      snapshots.push(this.toSnapshot(toolName, entry));
    }
    return snapshots.sort((a, b) => b.calls - a.calls);
  }

  getTopSlowest(n: number = 10): ToolMetricSnapshot[] {
    return this.getMetrics()
      .filter(m => m.calls > 0)
      .sort((a, b) => b.p95Ms - a.p95Ms)
      .slice(0, n);
  }

  getFailureRates(): ToolMetricSnapshot[] {
    return this.getMetrics()
      .filter(m => m.failures > 0)
      .sort((a, b) => b.failureRate - a.failureRate);
  }

  reset(): void {
    this.metrics.clear();
  }

  private toSnapshot(toolName: string, entry: ToolMetricEntry): ToolMetricSnapshot {
    const sorted = [...entry.durations].sort((a, b) => a - b);
    const p95Index = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);

    return {
      toolName,
      calls: entry.calls,
      successes: entry.successes,
      failures: entry.failures,
      failureRate: entry.calls > 0 ? Math.round((entry.failures / entry.calls) * 10000) / 100 : 0,
      avgMs: entry.calls > 0 ? Math.round(entry.totalMs / entry.calls) : 0,
      maxMs: entry.maxMs,
      p95Ms: sorted.length > 0 ? sorted[p95Index] : 0,
      lastCalledAt: entry.lastCalledAt ? new Date(entry.lastCalledAt).toISOString() : '',
    };
  }

  private logSummary(): void {
    if (this.metrics.size === 0) return;

    let totalCalls = 0;
    let totalFailures = 0;
    for (const entry of this.metrics.values()) {
      totalCalls += entry.calls;
      totalFailures += entry.failures;
    }

    const slowest = this.getTopSlowest(5);
    const failing = this.getFailureRates().slice(0, 5);

    logger.info('[ToolMetrics] 5-minute summary', {
      uniqueTools: this.metrics.size,
      totalCalls,
      totalFailures,
      overallFailureRate: totalCalls > 0 ? `${Math.round((totalFailures / totalCalls) * 100)}%` : '0%',
      slowestTools: slowest.map(s => `${s.toolName}(p95=${s.p95Ms}ms)`),
      failingTools: failing.map(f => `${f.toolName}(${f.failureRate}%)`),
    });
  }
}

export const toolMetricsService = new ToolMetricsService();
