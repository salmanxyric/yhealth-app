import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import notificationsController from '../controllers/notifications.controller.js';

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

export default router;
