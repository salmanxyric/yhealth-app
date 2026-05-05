/**
 * Entitlements Routes
 * Exposes the server-authoritative entitlement bundle to the client.
 * Mounted at /api/me.
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getMyEntitlementsHandler } from '../controllers/entitlements.controller.js';

const router = Router();

/** GET /api/me/entitlements — full entitlement bundle for the current user (ETag-aware). */
router.get('/entitlements', authenticate, getMyEntitlementsHandler);

export default router;
