import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import activityController from '../controllers/activity.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Activity Logs
// ============================================

// Get activity logs with pagination and filters
router.get(
  '/logs',
  activityController.getActivityLogs
);

// Get recent activities (for dashboard feed)
router.get(
  '/recent',
  activityController.getRecentActivities
);

// Complete an activity
router.post(
  '/logs/:logId/complete',
  activityController.completeActivity
);

// Skip an activity
router.post(
  '/logs/:logId/skip',
  activityController.skipActivity
);

// ============================================
// Activity Stats & Analytics
// ============================================

// Get activity stats for a period
router.get(
  '/stats',
  activityController.getActivityStats
);

// Get activity breakdown by type
router.get(
  '/breakdown',
  activityController.getActivityBreakdown
);

// Get calendar data for week/month view
router.get(
  '/calendar',
  activityController.getCalendarData
);

export default router;
