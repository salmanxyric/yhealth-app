import type { Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest, QueryOptions, LogMeta } from '../types/index.js';
import { logger } from '../services/logger.service.js';

/**
 * Base controller with common CRUD operations and utilities
 */
export abstract class BaseController {
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Send success response
   */
  protected success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    return ApiResponse.success(res, data, { message, statusCode });
  }

  /**
   * Send created response
   */
  protected created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.created(res, data, message);
  }

  /**
   * Send no content response
   */
  protected noContent(res: Response): Response {
    return ApiResponse.noContent(res);
  }

  /**
   * Send paginated response
   */
  protected paginated<T>(
    res: Response,
    data: T[],
    pagination: { page: number; limit: number; total: number },
    message = 'Success'
  ): Response {
    return ApiResponse.paginated(res, data, pagination, message);
  }

  /**
   * Parse pagination from request query
   */
  protected getPagination(req: AuthenticatedRequest): {
    page: number;
    limit: number;
    skip: number;
    sort: Record<string, 1 | -1>;
  } {
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 10));
    const skip = (page - 1) * limit;

    const sortField = (req.query['sort'] as string) || 'createdAt';
    const sortOrder = req.query['order'] === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder as 1 | -1 };

    return { page, limit, skip, sort };
  }

  /**
   * Parse query options from request
   */
  protected getQueryOptions(req: AuthenticatedRequest): QueryOptions {
    const { page, limit, sort } = this.getPagination(req);

    const options: QueryOptions = {
      page,
      limit,
      sort,
      lean: true,
    };

    const populate = req.query['populate'] as string | undefined;
    const select = req.query['select'] as string | undefined;

    if (populate) options.populate = populate;
    if (select) options.select = select;

    return options;
  }

  /**
   * Get authenticated user ID
   */
  protected getUserId(req: AuthenticatedRequest): string {
    if (!req.user?.userId) {
      throw ApiError.unauthorized('User not authenticated');
    }
    return req.user.userId;
  }

  /**
   * Get user from request
   */
  protected getUser(req: AuthenticatedRequest) {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }
    return req.user;
  }

  /**
   * Log controller action
   */
  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: LogMeta): void {
    logger[level](`[${this.serviceName}] ${message}`, meta);
  }
}

export default BaseController;
