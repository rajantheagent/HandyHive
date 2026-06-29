import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All admin routes are protected (admin auth would be separate in production)
router.use('/admin', authMiddleware);

// Dashboard
router.get('/admin/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));

// User management
router.get('/admin/search', (req, res, next) => adminController.searchUsers(req, res, next));
router.post('/admin/users/:id/suspend', (req, res, next) => adminController.suspendUser(req, res, next));

// Commission
router.get('/admin/commission', (req, res, next) => adminController.getCommissionRate(req, res, next));
router.put('/admin/commission', (req, res, next) => adminController.updateCommissionRate(req, res, next));

// Categories
router.get('/admin/categories', (req, res, next) => adminController.getCategories(req, res, next));
router.post('/admin/categories', (req, res, next) => adminController.createCategory(req, res, next));
router.patch('/admin/categories/:id', (req, res, next) => adminController.updateCategory(req, res, next));
router.delete('/admin/categories/:id', (req, res, next) => adminController.deactivateCategory(req, res, next));

// Disputes
router.get('/admin/disputes', (req, res, next) => adminController.getDisputes(req, res, next));
router.post('/admin/disputes/:id/resolve', (req, res, next) => adminController.resolveDispute(req, res, next));

// Reports
router.get('/admin/reports', (req, res, next) => adminController.generateReport(req, res, next));

export default router;
