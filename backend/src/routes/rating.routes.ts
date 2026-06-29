import { Router } from 'express';
import { ratingController } from '../controllers/rating.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/ratings - Submit a rating (protected)
router.post('/ratings', authMiddleware, (req, res, next) => {
  ratingController.submitRating(req, res, next);
});

// POST /api/ratings/:id/respond - Provider response (protected)
router.post('/ratings/:id/respond', authMiddleware, (req, res, next) => {
  ratingController.submitResponse(req, res, next);
});

// GET /api/ratings/provider/:providerId - Get provider ratings (public)
router.get('/ratings/provider/:providerId', (req, res, next) => {
  ratingController.getProviderRatings(req, res, next);
});

// Admin: Get pending ratings
router.get('/admin/ratings/pending', authMiddleware, (req, res, next) => {
  ratingController.getPendingRatings(req, res, next);
});

// Admin: Moderate a rating
router.patch('/admin/ratings/:id/moderate', authMiddleware, (req, res, next) => {
  ratingController.moderateRating(req, res, next);
});

export default router;
