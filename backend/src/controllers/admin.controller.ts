import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { getTokenPayload } from '../middleware/auth.middleware';
import { ApiError } from '../errors/api-error';
import { DisputeResolution } from '../entities/Dispute';

export class AdminController {
  /** GET /api/admin/dashboard */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await adminService.getDashboardMetrics();
      res.status(200).json(metrics);
    } catch (error) { next(error); }
  }

  /** GET /api/admin/search?q=xxx */
  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = (req.query.q as string) || '';
      if (!q) throw ApiError.badRequest('Search query is required');
      const results = await adminService.searchUsers(q);
      res.status(200).json(results);
    } catch (error) { next(error); }
  }

  /** POST /api/admin/users/:id/suspend */
  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const id = req.params.id as string;
      const { reason, targetType, action } = req.body;
      await adminService.suspendUser(payload.userId, id, targetType || 'provider', reason, action || 'suspend');
      res.status(200).json({ message: 'User suspended' });
    } catch (error) { next(error); }
  }

  /** PUT /api/admin/commission */
  async updateCommissionRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rate } = req.body;
      if (rate === undefined) throw ApiError.badRequest('Rate is required');
      const result = adminService.updateCommissionRate(rate);
      res.status(200).json(result);
    } catch (error) { next(error); }
  }

  /** GET /api/admin/commission */
  async getCommissionRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ rate: adminService.getCommissionRate() });
    } catch (error) { next(error); }
  }

  /** POST /api/admin/categories */
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, iconUrl } = req.body;
      if (!name) throw ApiError.badRequest('Category name is required');
      const category = await adminService.createCategory(name, description, iconUrl);
      res.status(201).json(category);
    } catch (error) { next(error); }
  }

  /** PATCH /api/admin/categories/:id */
  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, description, icon_url, is_active } = req.body;
      const category = await adminService.updateCategory(id, { name, description, icon_url, is_active });
      res.status(200).json(category);
    } catch (error) { next(error); }
  }

  /** DELETE /api/admin/categories/:id */
  async deactivateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await adminService.deactivateCategory(id);
      res.status(200).json({ message: 'Category deactivated' });
    } catch (error) { next(error); }
  }

  /** GET /api/admin/categories */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await adminService.getCategories();
      res.status(200).json(categories);
    } catch (error) { next(error); }
  }

  /** GET /api/admin/disputes */
  async getDisputes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputes = await adminService.getOpenDisputes();
      res.status(200).json(disputes);
    } catch (error) { next(error); }
  }

  /** POST /api/admin/disputes/:id/resolve */
  async resolveDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const id = req.params.id as string;
      const { resolution, refundAmount } = req.body;

      if (!resolution || !Object.values(DisputeResolution).includes(resolution)) {
        throw ApiError.badRequest('Valid resolution is required (full_refund, partial_refund, dismissed)');
      }

      const dispute = await adminService.resolveDispute(payload.userId, id, resolution, refundAmount);
      res.status(200).json(dispute);
    } catch (error) { next(error); }
  }

  /** GET /api/admin/reports */
  async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = (req.query.type as 'bookings' | 'revenue' | 'users') || 'bookings';
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      const data = await adminService.generateReport(type, period);
      res.status(200).json({ type, period, data, generatedAt: new Date().toISOString() });
    } catch (error) { next(error); }
  }
}

export const adminController = new AdminController();
