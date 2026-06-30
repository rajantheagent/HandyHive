import { Router } from 'express';
import multer from 'multer';
import { providerController } from '../controllers/provider.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Multer for file upload (memory storage, max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Public: Provider registration
router.post('/providers/register', upload.single('id_document'), (req, res, next) => {
  providerController.register(req, res, next);
});

// Check application status by email
router.get('/providers/check-status', async (req, res, next) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const { providerService } = require('../services/provider.service');
    const result = await providerService.checkExistingApplication(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Protected: Provider profile
router.get('/providers/profile', authMiddleware, (req, res, next) => {
  providerController.getProfile(req, res, next);
});

router.patch('/providers/profile', authMiddleware, (req, res, next) => {
  providerController.updateProfile(req, res, next);
});

// Protected: Availability toggle
router.patch('/providers/availability', authMiddleware, (req, res, next) => {
  providerController.toggleAvailability(req, res, next);
});

// Protected: Location update
router.post('/providers/location', authMiddleware, (req, res, next) => {
  providerController.updateLocation(req, res, next);
});

// Admin: Provider verification
router.get('/admin/providers/pending', authMiddleware, (req, res, next) => {
  providerController.getPendingProviders(req, res, next);
});

router.post('/admin/providers/:id/approve', authMiddleware, (req, res, next) => {
  providerController.approveProvider(req, res, next);
});

router.post('/admin/providers/:id/reject', authMiddleware, (req, res, next) => {
  providerController.rejectProvider(req, res, next);
});

export default router;
