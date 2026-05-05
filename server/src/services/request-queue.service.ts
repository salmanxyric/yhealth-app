import { logger } from './logger.service.js';

interface QueuedRequest {
  resolve: () => void;
  reject: (err: Error) => void;
  enqueueTime: number;
}

class RequestQueueService {
  private active = 0;
  private readonly queue: QueuedRequest[] = [];
  private readonly maxConcurrent: number;
  private readonly maxQueueSize: number;
  private readonly queueTimeoutMs: number;

  constructor(opts?: { maxConcurrent?: number; maxQueueSize?: number; queueTimeoutMs?: number }) {
    this.maxConcurrent = opts?.maxConcurrent ?? parseInt(process.env['CHAT_MAX_CONCURRENT'] || '50', 10);
    this.maxQueueSize = opts?.maxQueueSize ?? parseInt(process.env['CHAT_MAX_QUEUE'] || '200', 10);
    this.queueTimeoutMs = opts?.queueTimeoutMs ?? 30_000;
  }

  get activeCount(): number { return this.active; }
  get queueSize(): number { return this.queue.length; }
  get isAtCapacity(): boolean { return this.queue.length >= this.maxQueueSize; }

  async acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new CapacityError(this.active, this.queue.length);
    }

    return new Promise<void>((resolve, reject) => {
      const entry: QueuedRequest = { resolve, reject, enqueueTime: Date.now() };
      this.queue.push(entry);

      const timer = setTimeout(() => {
        const idx = this.queue.indexOf(entry);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          reject(new QueueTimeoutError(this.queueTimeoutMs));
        }
      }, this.queueTimeoutMs);

      const originalResolve = entry.resolve;
      entry.resolve = () => {
        clearTimeout(timer);
        originalResolve();
      };
    });
  }

  release(): void {
    this.active = Math.max(0, this.active - 1);

    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.active++;
      const waitMs = Date.now() - next.enqueueTime;
      if (waitMs > 5000) {
        logger.warn('[RequestQueue] Long queue wait', { waitMs, queueSize: this.queue.length });
      }
      next.resolve();
    }
  }

  getStats() {
    return {
      active: this.active,
      maxConcurrent: this.maxConcurrent,
      queued: this.queue.length,
      maxQueueSize: this.maxQueueSize,
    };
  }
}

export class CapacityError extends Error {
  readonly statusCode = 503;
  readonly retryAfter = 5;
  constructor(active: number, queued: number) {
    super(`Service at capacity (${active} active, ${queued} queued)`);
    this.name = 'CapacityError';
  }
}

export class QueueTimeoutError extends Error {
  readonly statusCode = 504;
  constructor(timeoutMs: number) {
    super(`Request queued for ${timeoutMs}ms without being served`);
    this.name = 'QueueTimeoutError';
  }
}

export const chatRequestQueue = new RequestQueueService();
