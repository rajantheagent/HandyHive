import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { getTokenPayload } from '../middleware/auth.middleware';
import { ApiError } from '../errors/api-error';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get notification history for current user.
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const page = parseInt(req.query.page as string, 10) || 1;
      const result = await notificationService.getHistory(payload.userId, page);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a notification as read.
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const id = req.params.id as string;
      await notificationService.markAsRead(id, payload.userId);
      res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/read-all
   * Mark all notifications as read.
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      await notificationService.markAllAsRead(payload.userId);
      res.status(200).json({ message: 'All marked as read' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/preferences
   * Get notification preferences.
   */
  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const prefs = await notificationService.getPreferences(payload.userId);
      res.status(200).json(prefs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/preferences
   * Update notification preferences.
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { in_app, push, email } = req.body;

      const prefs = await notificationService.updatePreferences(payload.userId, {
        in_app: in_app !== false,
        push: push !== false,
        email: email !== false,
      });

      res.status(200).json(prefs);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
