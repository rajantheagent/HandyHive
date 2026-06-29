import { Request, Response, NextFunction } from 'express';
import { gdprService } from '../services/gdpr.service';
import { getTokenPayload } from '../middleware/auth.middleware';

export class GdprController {
  /** GET /api/users/data-export */
  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const data = await gdprService.exportPersonalData(payload.userId);
      res.status(200).json(data);
    } catch (error) { next(error); }
  }

  /** DELETE /api/users/account */
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const result = await gdprService.requestDeletion(payload.userId);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }
}

export const gdprController = new GdprController();
