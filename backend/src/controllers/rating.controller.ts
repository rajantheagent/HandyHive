import { Request, Response, NextFunction } from 'express';
import { ratingService } from '../services/rating.service';
import { getTokenPayload } from '../middleware/auth.middleware';
import { ApiError } from '../errors/api-error';
import { ModerationStatus } from '../entities/Rating';

export class RatingController {
  /**
   * POST /api/ratings
   * Submit a rating for a completed booking.
   */
  async submitRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { bookingId, stars, reviewText } = req.body;

      if (!bookingId) throw ApiError.badRequest('Booking ID is required');

      const rating = await ratingService.submitRating({
        bookingId,
        userId: payload.userId,
        stars,
        reviewText,
      });

      res.status(201).json(rating);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ratings/:id/respond
   * Provider submits a response to a review.
   */
  async submitResponse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const ratingId = req.params.id as string;
      const { responseText } = req.body;

      const rating = await ratingService.submitProviderResponse(ratingId, payload.userId, responseText);
      res.status(200).json(rating);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ratings/provider/:providerId
   * Get ratings for a specific provider.
   */
  async getProviderRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.params.providerId as string;
      const page = parseInt(req.query.page as string, 10) || 1;

      const result = await ratingService.getProviderRatings(providerId, page);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/ratings/pending
   * Get pending ratings for moderation.
   */
  async getPendingRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ratings = await ratingService.getPendingRatings();
      res.status(200).json(ratings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/ratings/:id/moderate
   * Approve or reject a flagged review.
   */
  async moderateRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ratingId = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(ModerationStatus).includes(status)) {
        throw ApiError.badRequest('Status must be "approved" or "rejected"');
      }

      const rating = await ratingService.moderateRating(ratingId, status);
      res.status(200).json(rating);
    } catch (error) {
      next(error);
    }
  }
}

export const ratingController = new RatingController();
