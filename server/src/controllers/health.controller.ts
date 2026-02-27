import type { Request, Response } from 'express';
import { database } from '../config/database.config.js';
import { cache } from '../services/cache.service.js';
import { env } from '../config/env.config.js';
import type { HealthCheckResponse } from '../types/index.js';

// Server start time for uptime calculation
const startTime = Date.now();

/**
 * Basic health check - for load balancer
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Liveness probe - is the server running?
 */
export async function livenessProbe(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Readiness probe - is the server ready to receive traffic?
 */
export async function readinessProbe(_req: Request, res: Response): Promise<void> {
  const dbHealth = await database.healthCheck();

  if (dbHealth.status === 'down') {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Database connection unavailable',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Detailed health check - for monitoring dashboards
 */
export async function detailedHealthCheck(_req: Request, res: Response): Promise<void> {
  const [dbHealth, cacheHealth] = await Promise.all([
    database.healthCheck(),
    Promise.resolve(cache.healthCheck()),
  ]);

  const memoryUsage = process.memoryUsage();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const isHealthy = dbHealth.status === 'up';

  const response: HealthCheckResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime,
    version: process.env['npm_package_version'] || '1.0.0',
    services: {
      database: {
        status: dbHealth.status,
        ...(dbHealth.latency !== undefined && { latency: dbHealth.latency }),
        ...(dbHealth.message && { message: dbHealth.message }),
      },
      cache: {
        status: cacheHealth.status,
        message: `Keys: ${cacheHealth.stats.keys}`,
      },
    },
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    },
  };

  res.status(isHealthy ? 200 : 503).json(response);
}

/**
 * Server info endpoint
 */
export async function serverInfo(_req: Request, res: Response): Promise<void> {
  // Only expose in non-production environments
  if (env.isProduction) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  res.status(200).json({
    environment: env.nodeEnv,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  });
}

export default {
  healthCheck,
  livenessProbe,
  readinessProbe,
  detailedHealthCheck,
  serverInfo,
};
