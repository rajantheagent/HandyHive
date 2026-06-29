import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All notification routes are protected
router.use('/notifications', authMiddleware);

// GET /api/notifications - History
router.get('/notifications', (req, res, next) => {
  notificationController.getHistory(req, res, next);
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/notifications/:id/read', (req, res, next) => {
  notificationController.markAsRead(req, res, next);
});

// POST /api/notifications/read-all - Mark all as read
router.post('/notifications/read-all', (req, res, next) => {
  notificationController.markAllAsRead(req, res, next);
});

// GET /api/notifications/preferences - Get preferences
router.get('/notifications/preferences', (req, res, next) => {
  notificationController.getPreferences(req, res, next);
});

// PUT /api/notifications/preferences - Update preferences
router.put('/notifications/preferences', (req, res, next) => {
  notificationController.updatePreferences(req, res, next);
});

export default router;
