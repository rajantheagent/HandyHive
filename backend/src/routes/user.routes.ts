import { Router } from 'express';
import { gdprController } from '../controllers/gdpr.controller';
import { providerDashboardController } from '../controllers/provider-dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GDPR endpoints (protected)
router.get('/users/data-export', authMiddleware, (req, res, next) => {
  gdprController.exportData(req, res, next);
});

router.delete('/users/account', authMiddleware, (req, res, next) => {
  gdprController.deleteAccount(req, res, next);
});

// Provider dashboard endpoints (protected)
router.get('/providers/dashboard/metrics', authMiddleware, (req, res, next) => {
  providerDashboardController.getMetrics(req, res, next);
});

router.get('/providers/dashboard/earnings', authMiddleware, (req, res, next) => {
  providerDashboardController.getEarnings(req, res, next);
});

router.get('/providers/dashboard/history', authMiddleware, (req, res, next) => {
  providerDashboardController.getHistory(req, res, next);
});

export default router;
