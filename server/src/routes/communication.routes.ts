import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { communicationController } from '../controllers/communication.controller.js';

const router = Router();
router.use(authenticate);

const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 30, keyGenerator: 'user' });

router.get('/preferences', communicationController.getPreferences);

router.put(
  '/preferences',
  writeLimiter,
  validate(
    z.object({
      checkin_push_enabled: z.boolean().optional(),
      quiet_hours_start: z.number().int().min(0).max(23).nullable().optional(),
      quiet_hours_end: z.number().int().min(0).max(23).nullable().optional(),
      workdays_only: z.boolean().optional(),
      max_checkins_per_day: z.number().int().min(0).max(5).optional(),
      missed_followup_hours: z.number().int().min(1).max(168).optional(),
      push_achievements: z.boolean().optional(),
      push_streaks: z.boolean().optional(),
      push_nudges: z.boolean().optional(),
      email_digest: z.boolean().optional(),
      email_urgent_only: z.boolean().optional(),
    })
  ),
  communicationController.updatePreferences
);

router.post(
  '/push-tokens',
  writeLimiter,
  validate(
    z.object({
      token: z.string().min(10).max(4096),
      platform: z.enum(['ios', 'android', 'web']).optional(),
    })
  ),
  communicationController.registerPushToken
);

router.post(
  '/push-tokens/revoke',
  writeLimiter,
  validate(z.object({ token: z.string().min(10).max(4096) })),
  communicationController.removePushToken
);

export default router;
