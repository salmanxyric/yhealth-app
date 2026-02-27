import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import type { AuthenticatedRequest } from '../types/index.js';

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Middleware to add request ID to each request
 * Uses X-Request-ID header if provided, otherwise generates a new one
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const existingId = req.headers['x-request-id'];
  const requestId = (typeof existingId === 'string' && existingId) || generateRequestId();

  // Attach to request object
  (req as AuthenticatedRequest).requestId = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
}

export default requestIdMiddleware;
