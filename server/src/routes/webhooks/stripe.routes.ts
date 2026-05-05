/**
 * Stripe Webhook Routes
 * Must be mounted with express.raw({ type: 'application/json' }) so signature verification works
 */

import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.config.js';
import { logger } from '../../services/logger.service.js';
import { handleStripeWebhook } from '../../services/subscription.service.js';
import {
  acquireEventLock,
  markEventProcessed,
  markEventFailed,
  routeStripeEvent,
} from '../../services/stripe-webhook.service.js';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      throw ApiError.badRequest('Missing stripe-signature header');
    }
    if (!env.stripe.webhookSecret) {
      logger.error('[StripeWebhook] STRIPE_WEBHOOK_SECRET is not set');
      throw ApiError.internal('Webhook not configured');
    }

    // req.body is raw Buffer when mounted with express.raw()
    const body = req.body as Buffer | string;
    if (!body) {
      throw ApiError.badRequest('Missing body');
    }

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(env.stripe.secretKey!, { apiVersion: '2025-12-15.clover' });
      event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      logger.warn('[StripeWebhook] Signature verification failed', { message });
      throw ApiError.badRequest(message);
    }

    // Idempotency guard: acquire lock on event.id; replays short-circuit 200.
    let fresh = false;
    try {
      fresh = await acquireEventLock(event);
    } catch (err) {
      logger.error('[StripeWebhook] Event log write failed', {
        type: event.type,
        id: event.id,
        error: (err as Error).message,
      });
      // Do NOT 500 — Stripe will retry. We accept the event and process
      // inline; the log write error is a downstream observability concern.
    }

    if (!fresh) {
      logger.info('[StripeWebhook] Duplicate event — already processed', {
        id: event.id,
        type: event.type,
      });
      res.status(200).send();
      return;
    }

    try {
      // Run both the legacy subscription sync AND the new hardened router.
      // They operate on different tables (user_subscriptions vs invoices/grace)
      // so running both is additive, not duplicative.
      await handleStripeWebhook(event);
      await routeStripeEvent(event);
      await markEventProcessed(event.id);
    } catch (err) {
      const msg = (err as Error).message;
      logger.error('[StripeWebhook] Handler error', { type: event.type, id: event.id, error: msg });
      await markEventFailed(event.id, msg);
      throw err;
    }

    res.status(200).send();
  })
);

export default router;
