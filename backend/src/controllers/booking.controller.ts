import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { getTokenPayload } from '../middleware/auth.middleware';
import { ApiError } from '../errors/api-error';
import { BookingStatus } from '../entities/Booking';

export class BookingController {
  /**
   * POST /api/bookings
   * Create a new booking request.
   */
  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { providerId, categoryId, latitude, longitude, address, description, scheduledAt, estimatedDurationMinutes } = req.body;

      if (!providerId) throw ApiError.badRequest('Provider ID is required');
      if (!categoryId) throw ApiError.badRequest('Category ID is required');

      const booking = await bookingService.createRequest({
        userId: payload.userId,
        providerId,
        categoryId,
        latitude,
        longitude,
        address,
        description,
        scheduledAt,
        estimatedDurationMinutes,
      });

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id
   * Get booking details.
   */
  async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const booking = await bookingService.getBooking(id);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/accept
   * Provider accepts a booking request.
   */
  async acceptBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const id = req.params.id as string;
      const booking = await bookingService.acceptBooking(id, payload.userId);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/decline
   * Provider declines a booking request.
   */
  async declineBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const id = req.params.id as string;
      const { reason } = req.body;
      await bookingService.declineBooking(id, payload.userId, reason);
      res.status(200).json({ message: 'Booking declined' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/bookings/:id/status
   * Update booking status (state machine transitions).
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(BookingStatus).includes(status)) {
        throw ApiError.badRequest('Invalid booking status');
      }

      const booking = await bookingService.updateStatus(id, status);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings/:id/cancel
   * Cancel a booking (with fee logic).
   */
  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const id = req.params.id as string;
      const result = await bookingService.cancelBooking(id, payload.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id/alternatives
   * Get alternative provider suggestions after decline/expiry.
   */
  async getAlternatives(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const alternatives = await bookingService.getAlternativeProviders(id);
      res.status(200).json(alternatives);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/history
   * Get booking history for the current user with pagination.
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const page = parseInt(req.query.page as string, 10) || 1;
      const result = await bookingService.getBookingHistory(payload.userId, page);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
