import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All booking routes are protected
router.use('/bookings', authMiddleware);

// POST /api/bookings - Create a new booking request
router.post('/bookings', (req, res, next) => {
  bookingController.createBooking(req, res, next);
});

// GET /api/bookings/history - Get booking history (must be before :id route)
router.get('/bookings/history', (req, res, next) => {
  bookingController.getHistory(req, res, next);
});

// GET /api/bookings/:id - Get booking details
router.get('/bookings/:id', (req, res, next) => {
  bookingController.getBooking(req, res, next);
});

// POST /api/bookings/:id/accept - Provider accepts
router.post('/bookings/:id/accept', (req, res, next) => {
  bookingController.acceptBooking(req, res, next);
});

// POST /api/bookings/:id/decline - Provider declines
router.post('/bookings/:id/decline', (req, res, next) => {
  bookingController.declineBooking(req, res, next);
});

// PATCH /api/bookings/:id/status - Update status
router.patch('/bookings/:id/status', (req, res, next) => {
  bookingController.updateStatus(req, res, next);
});

// POST /api/bookings/:id/cancel - Cancel booking
router.post('/bookings/:id/cancel', (req, res, next) => {
  bookingController.cancelBooking(req, res, next);
});

// GET /api/bookings/:id/alternatives - Get alternative providers
router.get('/bookings/:id/alternatives', (req, res, next) => {
  bookingController.getAlternatives(req, res, next);
});

export default router;
