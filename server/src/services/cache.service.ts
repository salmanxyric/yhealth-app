import NodeCache from 'node-cache';
import { logger } from './logger.service.js';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;
  private readonly defaultTTL: number;

  private constructor() {
    this.defaultTTL = 300; // 5 minutes default
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 60,
      useClones: true,
      deleteOnExpire: true,
    });

    this.setupEventHandlers();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private setupEventHandlers(): void {
    this.cache.on('set', (key: string) => {
      logger.debug('Cache set', { key });
    });

    this.cache.on('del', (key: string) => {
      logger.debug('Cache delete', { key });
    });

    this.cache.on('expired', (key: string) => {
      logger.debug('Cache expired', { key });
    });

    this.cache.on('flush', () => {
      logger.info('Cache flushed');
    });
  }

  /**
   * Get a value from cache
   */
  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set a value in cache
   */
  public set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl ?? this.defaultTTL);
  }

  /**
   * Delete a key from cache
   */
  public delete(key: string | string[]): number {
    return this.cache.del(key);
  }

  /**
   * Check if key exists
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get or set - returns cached value or sets new value
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) {
      logger.debug('Cache hit', { key });
      return cached;
    }

    logger.debug('Cache miss', { key });
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete keys matching a pattern
   */
  public deleteByPattern(pattern: string | RegExp): number {
    const keys = this.cache.keys();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const matchingKeys = keys.filter(key => regex.test(key));

    return this.cache.del(matchingKeys);
  }

  /**
   * Flush all cache
   */
  public flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Get all keys
   */
  public keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get TTL for a key
   */
  public getTTL(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Set TTL for existing key
   */
  public setTTL(key: string, ttl: number): boolean {
    return this.cache.ttl(key, ttl);
  }

  /**
   * Get multiple values
   */
  public mget<T>(keys: string[]): Record<string, T> {
    return this.cache.mget<T>(keys);
  }

  /**
   * Set multiple values
   */
  public mset<T>(items: Array<{ key: string; val: T; ttl?: number }>): boolean {
    return this.cache.mset(items);
  }

  /**
   * Health check
   */
  public healthCheck(): { status: 'up' | 'down'; stats: CacheStats } {
    try {
      const stats = this.getStats();
      return { status: 'up', stats };
    } catch {
      return {
        status: 'down',
        stats: { hits: 0, misses: 0, keys: 0, ksize: 0, vsize: 0 },
      };
    }
  }
}

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  session: (id: string) => `session:${id}`,
  token: (token: string) => `token:${token}`,
  config: (key: string) => `config:${key}`,
  list: (resource: string, params?: string) =>
    `list:${resource}${params ? `:${params}` : ''}`,
  count: (resource: string, filter?: string) =>
    `count:${resource}${filter ? `:${filter}` : ''}`,
};

export const cache = CacheService.getInstance();
export default cache;
