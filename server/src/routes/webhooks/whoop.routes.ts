/**
 * @file WHOOP Webhook Routes
 * @description Webhook endpoints for receiving real-time WHOOP data updates
 */

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { logger } from '../../services/logger.service.js';
import { whoopDataService } from '../../services/whoop-data.service.js';
import type { Request, Response } from 'express';

const router = Router();

/**
 * @route   POST /api/webhooks/whoop
 * @desc    Webhook endpoint for WHOOP data events
 * @access  Public (but should verify webhook signature)
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    
    logger.info('[WHOOPWebhook] Received webhook', {
      eventType: payload.event_type || payload.type,
      hasData: !!payload.data,
    });
    
    // Verify webhook signature if provided
    const signature = req.headers['x-whoop-signature'] as string;
    if (signature) {
      // TODO: Implement webhook signature verification
      // const isValid = verifyWhoopWebhookSignature(signature, JSON.stringify(payload));
      // if (!isValid) {
      //   throw ApiError.unauthorized('Invalid webhook signature');
      // }
    }
    
    // Process webhook event
    const eventType = payload.event_type || payload.type || 'unknown';
    
    try {
      switch (eventType) {
        case 'recovery.created':
        case 'recovery.updated':
          await whoopDataService.processRecoveryWebhook(payload);
          break;
          
        case 'sleep.created':
        case 'sleep.updated':
          await whoopDataService.processSleepWebhook(payload);
          break;
          
        case 'workout.created':
        case 'workout.updated':
          await whoopDataService.processWorkoutWebhook(payload);
          break;
          
        case 'cycle.created':
        case 'cycle.updated':
          await whoopDataService.processCycleWebhook(payload);
          break;
          
        default:
          logger.warn('[WHOOPWebhook] Unknown event type', { eventType });
      }
      
      ApiResponse.success(res, { processed: true }, 'Webhook processed successfully');
    } catch (error) {
      logger.error('[WHOOPWebhook] Error processing webhook', {
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Return 200 to prevent WHOOP from retrying
      // Log error for manual investigation
      ApiResponse.success(res, { processed: false, error: 'Processing failed' }, 'Webhook received but processing failed');
    }
  })
);

/**
 * @route   GET /api/webhooks/whoop/verify
 * @desc    Webhook verification endpoint (for WHOOP webhook setup)
 * @access  Public
 */
router.get('/verify', (req: Request, res: Response) => {
  // WHOOP webhook verification (if supported)
  const challenge = req.query.challenge as string;
  const verifyToken = req.query.verify_token as string;
  
  const expectedToken = process.env['WHOOP_WEBHOOK_VERIFY_TOKEN'] || 'yhealth_verify_token';
  
  if (verifyToken === expectedToken && challenge) {
    logger.info('[WHOOPWebhook] Verification successful');
    res.status(200).send(challenge);
  } else {
    logger.warn('[WHOOPWebhook] Verification failed', { verifyToken, hasChallenge: !!challenge });
    res.sendStatus(403);
  }
});

export default router;

