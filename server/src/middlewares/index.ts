// Authentication & Authorization
export {
  authenticate,
  optionalAuth,
  authorize,
  authorizeOwnerOrAdmin,
  verifyRefreshToken,
  generateTokens,
} from './auth.middleware.js';

// Error handling
export {
  errorHandler,
  notFoundHandler,
  setupUncaughtHandlers,
} from './error.middleware.js';

// Rate limiting
export {
  globalLimiter,
  authLimiter,
  strictLimiter,
  apiLimiter,
  uploadLimiter,
  createRateLimiter,
} from './rateLimiter.middleware.js';

// Request tracking
export { requestIdMiddleware } from './requestId.middleware.js';

// Validation
export {
  validate,
  validateRequest,
  commonSchemas,
} from './validate.middleware.js';
