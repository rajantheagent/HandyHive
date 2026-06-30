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

// Check application status by email (lightweight query)
router.get('/providers/check-status', async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(200).json({ exists: false });
      return;
    }
    const { AppDataSource } = require('../config/data-source');
    const { ServiceProvider } = require('../entities/ServiceProvider');
    const repo = AppDataSource.getRepository(ServiceProvider);
    const provider = await repo.findOne({ where: { email: email.toLowerCase().trim() }, select: ['id', 'status'] });
    if (provider) {
      res.status(200).json({ exists: true, status: provider.status });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch {
    res.status(200).json({ exists: false });
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
