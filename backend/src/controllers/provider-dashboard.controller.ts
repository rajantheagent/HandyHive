import { Request, Response, NextFunction } from 'express';
import { providerDashboardService } from '../services/provider-dashboard.service';
import { getTokenPayload } from '../middleware/auth.middleware';

export class ProviderDashboardController {
  /** GET /api/providers/dashboard/metrics */
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const metrics = await providerDashboardService.getMetrics(payload.userId);
      res.status(200).json(metrics);
    } catch (error) { next(error); }
  }

  /** GET /api/providers/dashboard/earnings?period=daily|weekly|monthly */
  async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      const result = await providerDashboardService.getEarningsBreakdown(payload.userId, period);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  /** GET /api/providers/dashboard/history?page=1 */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const page = parseInt(req.query.page as string, 10) || 1;
      const result = await providerDashboardService.getBookingHistory(payload.userId, page);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }
}

export const providerDashboardController = new ProviderDashboardController();
