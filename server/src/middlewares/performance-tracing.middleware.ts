import type { Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { logger } from '../services/logger.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

interface TracePhase {
  name: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export class RequestTrace {
  readonly requestId: string;
  readonly userId: string;
  readonly startTime: number;
  private phases: TracePhase[] = [];
  private activePhases = new Map<string, number>();

  constructor(requestId: string, userId: string) {
    this.requestId = requestId;
    this.userId = userId;
    this.startTime = performance.now();
  }

  startPhase(name: string): void {
    this.activePhases.set(name, performance.now());
  }

  endPhase(name: string): number {
    const startMs = this.activePhases.get(name);
    if (startMs === undefined) return 0;
    this.activePhases.delete(name);
    const endMs = performance.now();
    const durationMs = Math.round(endMs - startMs);
    this.phases.push({
      name,
      startMs: Math.round(startMs - this.startTime),
      endMs: Math.round(endMs - this.startTime),
      durationMs,
    });
    return durationMs;
  }

  get totalMs(): number {
    return Math.round(performance.now() - this.startTime);
  }

  toJSON() {
    return {
      requestId: this.requestId,
      userId: this.userId,
      totalMs: this.totalMs,
      phases: this.phases,
    };
  }
}

// Rolling circular buffer for response time percentiles
const BUFFER_SIZE = 200;
const ttfbBuffer: number[] = [];
const totalBuffer: number[] = [];
let activeStreams = 0;

export function getActiveStreams(): number {
  return activeStreams;
}

export function incrementActiveStreams(): void {
  activeStreams++;
}

export function decrementActiveStreams(): void {
  activeStreams = Math.max(0, activeStreams - 1);
}

export function recordTTFB(ms: number): void {
  if (ttfbBuffer.length >= BUFFER_SIZE) ttfbBuffer.shift();
  ttfbBuffer.push(ms);
}

export function recordTotal(ms: number): void {
  if (totalBuffer.length >= BUFFER_SIZE) totalBuffer.shift();
  totalBuffer.push(ms);
}

function percentile(arr: number[], p: number): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function getPerformanceMetrics() {
  return {
    activeStreams,
    sampleCount: totalBuffer.length,
    ttfb: {
      p50: percentile(ttfbBuffer, 50),
      p95: percentile(ttfbBuffer, 95),
      p99: percentile(ttfbBuffer, 99),
    },
    total: {
      p50: percentile(totalBuffer, 50),
      p95: percentile(totalBuffer, 95),
      p99: percentile(totalBuffer, 99),
    },
  };
}

export function performanceTracingMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const requestId = req.requestId || 'unknown';
  const userId = req.user?.userId || 'anonymous';
  const trace = new RequestTrace(requestId, userId);
  (req as any).trace = trace;

  incrementActiveStreams();

  res.on('close', () => {
    decrementActiveStreams();
    recordTotal(trace.totalMs);

    logger.info('[PerfTrace] Request completed', {
      requestId: trace.requestId,
      userId: trace.userId,
      totalMs: trace.totalMs,
      phases: trace.toJSON().phases,
      statusCode: res.statusCode,
      activeStreams,
    });
  });

  next();
}
