import { Router } from 'express';
import { addressController } from '../controllers/address.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected: Address CRUD
router.get('/addresses', authMiddleware, (req, res, next) => {
  addressController.getAddresses(req, res, next);
});

router.post('/addresses', authMiddleware, (req, res, next) => {
  addressController.createAddress(req, res, next);
});

router.patch('/addresses/:id', authMiddleware, (req, res, next) => {
  addressController.updateAddress(req, res, next);
});

router.delete('/addresses/:id', authMiddleware, (req, res, next) => {
  addressController.deleteAddress(req, res, next);
});

// Public: Geocoding endpoints
router.post('/geocode', (req, res, next) => {
  addressController.geocode(req, res, next);
});

router.post('/reverse-geocode', (req, res, next) => {
  addressController.reverseGeocode(req, res, next);
});

router.get('/autocomplete', (req, res, next) => {
  addressController.autocomplete(req, res, next);
});

export default router;
