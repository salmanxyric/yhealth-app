import type { AppErrorDetails } from '../types/index.js';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: AppErrorDetails[];
  public readonly timestamp: Date;

  constructor(
    statusCode: number,
    message: string,
    options: {
      code?: string;
      isOperational?: boolean;
      details?: AppErrorDetails[];
      stack?: string;
    } = {}
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = options.code || this.getDefaultCode(statusCode);
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    this.timestamp = new Date();

    if (options.stack) {
      this.stack = options.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  private getDefaultCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  public toJSON(): Record<string, unknown> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp.toISOString(),
      },
    };
  }

  // Static factory methods for common errors
  static badRequest(message = 'Bad Request', details?: AppErrorDetails[]): ApiError {
    return new ApiError(400, message, { code: 'BAD_REQUEST', details });
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message, { code: 'CONFLICT' });
  }

  static unprocessableEntity(message = 'Unprocessable Entity', details?: AppErrorDetails[]): ApiError {
    return new ApiError(422, message, { code: 'UNPROCESSABLE_ENTITY', details });
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message, { code: 'TOO_MANY_REQUESTS' });
  }

  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(500, message, { code: 'INTERNAL_SERVER_ERROR', isOperational: false });
  }

  static serviceUnavailable(message = 'Service Unavailable'): ApiError {
    return new ApiError(503, message, { code: 'SERVICE_UNAVAILABLE' });
  }

  static validation(errors: AppErrorDetails[]): ApiError {
    return new ApiError(400, 'Validation Error', {
      code: 'VALIDATION_ERROR',
      details: errors,
    });
  }

  static fromError(error: Error, statusCode = 500): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    return new ApiError(statusCode, error.message, {
      isOperational: false,
      stack: error.stack,
    });
  }
}

export default ApiError;
