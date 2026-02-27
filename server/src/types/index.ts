import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

// Environment types
export type NodeEnv = 'development' | 'production' | 'test' | 'staging';

// User related types
export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  avatar?: string;
  phone?: string;
  lastLogin?: Date;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'user' | 'admin' | 'moderator' | 'doctor' | 'patient';

// JWT Payload
export interface IJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

// Extended Request with user
export interface AuthenticatedRequest extends Request {
  user?: IJwtPayload;
  sessionId?: string;
  requestId?: string;
}

// Controller handler type
export type AsyncHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
  timestamp: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Pagination params
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// Service response type
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Database query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[];
  select?: string;
  lean?: boolean;
}

// Socket event types
export interface SocketUser {
  id: string;
  socketId: string;
  userId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface SocketEvent {
  type: string;
  payload: unknown;
  timestamp: Date;
  userId?: string;
}

// Cache options
export interface CacheOptions {
  ttl?: number;
  key?: string;
  invalidateOn?: string[];
}

// Rate limit config
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

// Email options
export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, unknown>;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
  key?: string;
  location?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    redis?: ServiceHealth;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
}

// Error types
export interface AppErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

// Audit log
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

// Logger meta type
export type LogMeta = Record<string, unknown>;
