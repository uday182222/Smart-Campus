import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notificationsController } from '../controllers/notifications.controller';

const router = Router();

// All notification routes require authentication
router.use(authMiddleware.authenticate);

// POST /api/notifications/send - Send notification(s) (Admin/Staff only)
router.post(
  '/send',
  authMiddleware.authorize('ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF'),
  notificationsController.sendNotification
);

// GET /api/notifications/:userId - Get notifications for a user
router.get('/:userId', notificationsController.getUserNotifications);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', notificationsController.markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', notificationsController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationsController.deleteNotification);

// POST /api/notifications/preferences - Update notification preferences
router.post('/preferences', notificationsController.updatePreferences);

// GET /api/notifications/preferences/:userId - Get notification preferences
router.get('/preferences/:userId', notificationsController.getPreferences);

// POST /api/notifications/test - Send test notification (Admin only)
router.post(
  '/test',
  authMiddleware.authorize('ADMIN', 'SUPER_ADMIN'),
  notificationsController.sendTestNotification
);

export default router;
