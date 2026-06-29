import { AppDataSource } from '../config/data-source';
import { Rating, ModerationStatus } from '../entities/Rating';
import { Booking, BookingStatus } from '../entities/Booking';
import { ServiceProvider } from '../entities/ServiceProvider';
import { ApiError } from '../errors/api-error';

const REVIEW_WINDOW_DAYS = 7;
const MAX_REVIEW_LENGTH = 1000;
const MAX_RESPONSE_LENGTH = 500;

// Basic profanity/spam patterns for content moderation
const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|ass|bitch|crap)\b/i,
  /\b(idiot|stupid|moron|dumb)\b/i,
];

const SPAM_PATTERNS = [
  /(http|www\.|\.com|\.net)/i,
  /(.)\1{4,}/, // Repeated characters
  /\b(buy|sell|click here|free money|bitcoin)\b/i,
];

const PERSONAL_INFO_PATTERNS = [
  /\b\d{10,}\b/, // Phone numbers
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Emails
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
];

export interface CreateRatingDto {
  bookingId: string;
  userId: string;
  stars: number;
  reviewText?: string;
}

export class RatingService {
  private ratingRepo = AppDataSource.getRepository(Rating);
  private bookingRepo = AppDataSource.getRepository(Booking);
  private providerRepo = AppDataSource.getRepository(ServiceProvider);

  /**
   * Submit a rating for a completed booking.
   * - Stars: 1-5
   * - Review text: 0-1000 chars
   * - Must be within 7 days of booking completion
   */
  async submitRating(dto: CreateRatingDto): Promise<Rating> {
    // Validate stars
    if (!dto.stars || dto.stars < 1 || dto.stars > 5 || !Number.isInteger(dto.stars)) {
      throw ApiError.badRequest('Stars must be an integer between 1 and 5');
    }

    // Validate review text length
    if (dto.reviewText && dto.reviewText.length > MAX_REVIEW_LENGTH) {
      throw ApiError.badRequest(`Review text must not exceed ${MAX_REVIEW_LENGTH} characters`);
    }

    // Get booking
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw ApiError.notFound('Booking');

    // Verify booking belongs to user
    if (booking.user_id !== dto.userId) {
      throw ApiError.forbidden('You can only rate your own bookings');
    }

    // Verify booking is completed
    if (booking.status !== BookingStatus.COMPLETED) {
      throw ApiError.badRequest('Can only rate completed bookings');
    }

    // Check 7-day window
    if (booking.completed_at) {
      const daysSinceCompletion = (Date.now() - booking.completed_at.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCompletion > REVIEW_WINDOW_DAYS) {
        throw ApiError.badRequest('Rating window has expired (7 days after completion)');
      }
    }

    // Check if already rated
    const existingRating = await this.ratingRepo.findOne({
      where: { booking_id: dto.bookingId, user_id: dto.userId },
    });
    if (existingRating) {
      throw ApiError.conflict('You have already rated this booking');
    }

    // Content moderation
    let moderationStatus = ModerationStatus.APPROVED;
    if (dto.reviewText) {
      const flags = this.moderateContent(dto.reviewText);
      if (flags.length > 0) {
        moderationStatus = ModerationStatus.PENDING;
      }
    }

    // Create rating
    const rating = this.ratingRepo.create({
      booking_id: dto.bookingId,
      user_id: dto.userId,
      provider_id: booking.provider_id,
      stars: dto.stars,
      review_text: dto.reviewText || null,
      moderation_status: moderationStatus,
    });

    const savedRating = await this.ratingRepo.save(rating);

    // Update provider average rating
    await this.recalculateProviderRating(booking.provider_id);

    return savedRating;
  }

  /**
   * Provider submits a response to a review (single reply, max 500 chars).
   */
  async submitProviderResponse(ratingId: string, providerId: string, responseText: string): Promise<Rating> {
    if (!responseText || responseText.trim().length === 0) {
      throw ApiError.badRequest('Response text is required');
    }

    if (responseText.length > MAX_RESPONSE_LENGTH) {
      throw ApiError.badRequest(`Response must not exceed ${MAX_RESPONSE_LENGTH} characters`);
    }

    const rating = await this.ratingRepo.findOne({ where: { id: ratingId } });
    if (!rating) throw ApiError.notFound('Rating');

    if (rating.provider_id !== providerId) {
      throw ApiError.forbidden('You can only respond to reviews for your services');
    }

    // Only one response allowed
    if (rating.provider_response) {
      throw ApiError.conflict('You have already responded to this review');
    }

    rating.provider_response = responseText.trim();
    rating.provider_response_at = new Date();

    return this.ratingRepo.save(rating);
  }

  /**
   * Get ratings for a provider.
   */
  async getProviderRatings(providerId: string, page: number = 1): Promise<{
    ratings: Rating[];
    total: number;
    average: number;
    page: number;
  }> {
    const limit = 20;
    const skip = (page - 1) * limit;

    const [ratings, total] = await this.ratingRepo.findAndCount({
      where: { provider_id: providerId, moderation_status: ModerationStatus.APPROVED },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    // Get average
    const result = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.stars)', 'avg')
      .where('r.provider_id = :providerId', { providerId })
      .andWhere('r.moderation_status = :status', { status: ModerationStatus.APPROVED })
      .getRawOne();

    const average = result?.avg ? parseFloat(parseFloat(result.avg).toFixed(1)) : 0;

    return { ratings, total, average, page };
  }

  /**
   * Content moderation: flag reviews with profanity, spam, or personal info.
   */
  private moderateContent(text: string): string[] {
    const flags: string[] = [];

    for (const pattern of PROFANITY_PATTERNS) {
      if (pattern.test(text)) {
        flags.push('profanity');
        break;
      }
    }

    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(text)) {
        flags.push('spam');
        break;
      }
    }

    for (const pattern of PERSONAL_INFO_PATTERNS) {
      if (pattern.test(text)) {
        flags.push('personal_info');
        break;
      }
    }

    return flags;
  }

  /**
   * Recalculate provider's average rating (arithmetic mean, 1 decimal place).
   */
  private async recalculateProviderRating(providerId: string): Promise<void> {
    const result = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.stars)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.provider_id = :providerId', { providerId })
      .getRawOne();

    const avgRating = result?.avg ? parseFloat(parseFloat(result.avg).toFixed(1)) : 0;
    const totalRatings = result?.count ? parseInt(result.count, 10) : 0;

    await this.providerRepo.update(providerId, {
      average_rating: avgRating,
      total_ratings: totalRatings,
    });
  }

  /**
   * Admin: approve or reject a flagged review.
   */
  async moderateRating(ratingId: string, status: ModerationStatus): Promise<Rating> {
    const rating = await this.ratingRepo.findOne({ where: { id: ratingId } });
    if (!rating) throw ApiError.notFound('Rating');

    rating.moderation_status = status;
    const updated = await this.ratingRepo.save(rating);

    // Recalculate if approved
    if (status === ModerationStatus.APPROVED) {
      await this.recalculateProviderRating(rating.provider_id);
    }

    return updated;
  }

  /**
   * Get pending ratings for admin moderation.
   */
  async getPendingRatings(): Promise<Rating[]> {
    return this.ratingRepo.find({
      where: { moderation_status: ModerationStatus.PENDING },
      order: { created_at: 'ASC' },
    });
  }
}

export const ratingService = new RatingService();
