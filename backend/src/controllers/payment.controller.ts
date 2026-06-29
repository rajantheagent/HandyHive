import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { getTokenPayload } from '../middleware/auth.middleware';
import { ApiError } from '../errors/api-error';
import { PaymentMethod } from '../entities/Payment';

export class PaymentController {
  /**
   * POST /api/payments/intent
   * Create a payment intent.
   */
  async createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { bookingId, amount, method } = req.body;

      if (!bookingId) throw ApiError.badRequest('Booking ID is required');
      if (!amount || amount <= 0) throw ApiError.badRequest('Amount must be positive');
      if (!method || !Object.values(PaymentMethod).includes(method)) {
        throw ApiError.badRequest('Valid payment method is required');
      }

      const result = await paymentService.createPaymentIntent({
        bookingId,
        userId: payload.userId,
        amount,
        method,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/:id/confirm
   * Confirm payment and hold in escrow.
   */
  async confirmPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const payment = await paymentService.confirmPayment(id);
      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/:id/release
   * Release escrow (user confirms completion).
   */
  async releaseEscrow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const payment = await paymentService.releaseEscrow(id);
      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/:id/refund
   * Process a refund.
   */
  async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { amount } = req.body;
      const payment = await paymentService.processRefund(id, amount);
      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/:id/dispute
   * Create a payment dispute.
   */
  async createDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const id = req.params.id as string;
      const { reason } = req.body;

      if (!reason) throw ApiError.badRequest('Dispute reason is required');

      const dispute = await paymentService.createDispute(id, payload.userId, reason);
      res.status(201).json(dispute);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/estimate
   * Calculate price estimate.
   */
  async getEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hourlyRate, durationMinutes } = req.body;

      if (!hourlyRate || hourlyRate <= 0) throw ApiError.badRequest('Hourly rate is required');
      if (!durationMinutes || durationMinutes <= 0) throw ApiError.badRequest('Duration is required');

      const estimate = paymentService.calculatePriceEstimate(hourlyRate, durationMinutes);
      res.status(200).json(estimate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/earnings
   * Get provider earnings breakdown.
   */
  async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';

      const earnings = await paymentService.getProviderEarnings(payload.userId, period);
      res.status(200).json(earnings);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
