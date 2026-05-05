/**
 * Subscription Routes
 * Public/authenticated: list plans, checkout session, portal session, my subscription
 */

import { Router, type Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  getPlansHandler,
  createCheckoutSessionHandler,
  createPortalSessionHandler,
  verifySessionHandler,
  syncFromStripeHandler,
  getMySubscriptionHandler,
} from '../controllers/subscription.controller.js';
import {
  checkoutSessionSchema,
  portalSessionSchema,
  verifySessionSchema,
} from '../validators/subscription.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { query } from '../config/database.config.js';
import { invalidateEntitlements } from '../services/entitlement.service.js';
import Stripe from 'stripe';
import { env } from '../config/env.config.js';
import { logger } from '../services/logger.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

/** GET /api/subscription/plans - List plans (public, optional auth) */
router.get('/plans', getPlansHandler);

/** POST /api/subscription/checkout-session - Create Stripe Checkout session (auth required) */
router.post('/checkout-session', authenticate, validate(checkoutSessionSchema, 'body'), createCheckoutSessionHandler);

/** POST /api/subscription/portal-session - Create Stripe Customer Portal session (auth required) */
router.post('/portal-session', authenticate, validate(portalSessionSchema, 'body'), createPortalSessionHandler);

/** POST /api/subscription/verify-session - Verify checkout session with Stripe (callback when webhook not run) */
router.post('/verify-session', authenticate, validate(verifySessionSchema, 'body'), verifySessionHandler);

/** POST /api/subscription/sync-from-stripe - Recovery: sync subscription from Stripe if user paid but DB was not updated */
router.post('/sync-from-stripe', authenticate, syncFromStripeHandler);

/** GET /api/subscription/me - Get current user subscription (auth required) */
router.get('/me', authenticate, getMySubscriptionHandler);

/**
 * POST /api/subscription/cancel
 * User-initiated cancellation. Sets cancel_at_period_end=true on Stripe so
 * the user keeps access until the paid period ends. Reason is stored on the
 * `canceled_at` audit metadata. For managed Stripe plans only.
 */
router.post(
  '/cancel',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const reason = (req.body?.reason ?? '').toString().slice(0, 500);

    const subRow = await query<{
      id: string;
      stripe_subscription_id: string | null;
      status: string;
      cancel_at_period_end: boolean;
    }>(
      `SELECT id, stripe_subscription_id, status, cancel_at_period_end
         FROM user_subscriptions
        WHERE user_id = $1
          AND status IN ('active', 'trialing', 'past_due')
        ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const sub = subRow.rows[0];
    if (!sub) throw ApiError.badRequest('No active subscription to cancel');
    if (sub.cancel_at_period_end) {
      ApiResponse.success(res, { alreadyScheduled: true });
      return;
    }

    // Ask Stripe to cancel at period end (keeps user active during paid period).
    if (sub.stripe_subscription_id && env.stripe.secretKey) {
      try {
        const stripe = new Stripe(env.stripe.secretKey, {
          apiVersion: '2025-12-15.clover',
        });
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
          metadata: { cancel_reason: reason },
        });
      } catch (err) {
        logger.error('[subscription] Stripe cancel failed', {
          userId,
          subId: sub.id,
          error: (err as Error).message,
        });
        throw ApiError.badRequest(
          'Could not schedule cancellation with the payment provider. Please try again or contact support.'
        );
      }
    }

    await query(
      `UPDATE user_subscriptions
          SET cancel_at_period_end = true,
              canceled_at          = COALESCE(canceled_at, NOW() AT TIME ZONE 'UTC'),
              updated_at           = NOW() AT TIME ZONE 'UTC'
        WHERE id = $1`,
      [sub.id]
    );
    await invalidateEntitlements(userId);

    ApiResponse.success(res, { scheduledCancellation: true });
  })
);

export default router;
