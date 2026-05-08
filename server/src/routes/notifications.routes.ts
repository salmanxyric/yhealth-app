import { Router, type Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import type { AuthenticatedRequest } from '../types/index.js';
import notificationsController from '../controllers/notifications.controller.js';
import { webPushService } from '../services/web-push.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Notification retrieval
// ============================================

// Get all notifications with pagination and filters
router.get('/', notificationsController.getNotifications);

// Get unread notification count (for badge)
router.get('/unread-count', notificationsController.getUnreadCount);

// Get notification statistics
router.get('/stats', notificationsController.getNotificationStats);

// Get single notification by ID
router.get('/:id', notificationsController.getNotificationById);

// ============================================
// Mark as read/unread
// ============================================

// Mark single notification as read
router.patch('/:id/read', notificationsController.markAsRead);

// Mark single notification as unread
router.patch('/:id/unread', notificationsController.markAsUnread);

// Mark multiple notifications as read
router.post('/mark-read', notificationsController.markMultipleAsRead);

// Mark all notifications as read
router.post('/mark-all-read', notificationsController.markAllAsRead);

// ============================================
// Archive/Unarchive
// ============================================

// Archive notification
router.patch('/:id/archive', notificationsController.archiveNotification);

// Unarchive notification
router.patch('/:id/unarchive', notificationsController.unarchiveNotification);

// ============================================
// Delete operations
// ============================================

// Delete single notification
router.delete('/:id', notificationsController.deleteNotification);

// Delete multiple notifications
router.post('/delete-multiple', notificationsController.deleteMultipleNotifications);

// Delete all read notifications
router.delete('/read/all', notificationsController.deleteAllRead);

// ============================================
// Create notification (for testing / internal use)
// ============================================

router.post('/', notificationsController.createNotification);

// ============================================
// Maintenance
// ============================================

// Cleanup expired notifications
router.post('/cleanup-expired', notificationsController.cleanupExpired);

// ============================================
// Web Push subscriptions
// ============================================

router.post('/push/subscribe', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  const { subscription } = req.body;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw ApiError.badRequest('Valid push subscription object required');
  }

  await webPushService.saveSubscription(userId, subscription, req.headers['user-agent']);
  ApiResponse.success(res, null, 'Push subscription saved');
}));

router.post('/push/unsubscribe', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  const { endpoint } = req.body;
  if (!endpoint) throw ApiError.badRequest('endpoint is required');

  await webPushService.removeSubscription(userId, endpoint);
  ApiResponse.success(res, null, 'Push subscription removed');
}));

router.get('/push/vapid-key', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  ApiResponse.success(res, { publicKey: process.env.VAPID_PUBLIC_KEY || '' });
}));

export default router;
