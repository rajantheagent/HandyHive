import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All payment routes are protected
router.use('/payments', authMiddleware);

// POST /api/payments/intent - Create payment intent
router.post('/payments/intent', (req, res, next) => {
  paymentController.createPaymentIntent(req, res, next);
});

// POST /api/payments/estimate - Calculate price estimate
router.post('/payments/estimate', (req, res, next) => {
  paymentController.getEstimate(req, res, next);
});

// GET /api/payments/earnings - Provider earnings
router.get('/payments/earnings', (req, res, next) => {
  paymentController.getEarnings(req, res, next);
});

// POST /api/payments/:id/confirm - Confirm and hold in escrow
router.post('/payments/:id/confirm', (req, res, next) => {
  paymentController.confirmPayment(req, res, next);
});

// POST /api/payments/:id/release - Release escrow
router.post('/payments/:id/release', (req, res, next) => {
  paymentController.releaseEscrow(req, res, next);
});

// POST /api/payments/:id/refund - Process refund
router.post('/payments/:id/refund', (req, res, next) => {
  paymentController.processRefund(req, res, next);
});

// POST /api/payments/:id/dispute - Create dispute
router.post('/payments/:id/dispute', (req, res, next) => {
  paymentController.createDispute(req, res, next);
});

export default router;
