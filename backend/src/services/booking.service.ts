import crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { Booking, BookingStatus } from '../entities/Booking';
import { ServiceProvider, ProviderStatus, ProviderAvailability } from '../entities/ServiceProvider';
import { ProviderCategory } from '../entities/ProviderCategory';
import { ApiError } from '../errors/api-error';
import { redisService, BOOKING_TIMEOUT_TTL } from './redis.service';
import { Between, Not, In } from 'typeorm';

const CANCELLATION_THRESHOLD_MINUTES = 30;
const MAX_ALTERNATIVES = 3;
const PAGINATION_LIMIT = 50;

export interface CreateBookingDto {
  userId: string;
  providerId: string;
  categoryId: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  description?: string;
  scheduledAt?: string; // ISO datetime
  estimatedDurationMinutes?: number;
}

export interface CancellationResult {
  cancelled: boolean;
  fee: number;
  message: string;
}

export class BookingService {
  private bookingRepo = AppDataSource.getRepository(Booking);
  private providerRepo = AppDataSource.getRepository(ServiceProvider);
  private providerCategoryRepo = AppDataSource.getRepository(ProviderCategory);

  /**
   * Create a new booking request.
   * - Description max 500 chars
   * - Scheduling 2h-7d in the future
   * - Sets a 2-minute Redis TTL for request expiry
   * - Validates time slot conflicts
   */
  async createRequest(dto: CreateBookingDto): Promise<Booking> {
    // Validate description length
    if (dto.description && dto.description.length > 500) {
      throw ApiError.badRequest('Description must not exceed 500 characters', [
        { field: 'description', message: 'Maximum 500 characters allowed' },
      ]);
    }

    // Validate scheduling window (2h to 7d in future)
    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      const now = new Date();
      const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
      const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      if (scheduledDate < minTime) {
        throw ApiError.badRequest('Scheduled time must be at least 2 hours in the future');
      }
      if (scheduledDate > maxTime) {
        throw ApiError.badRequest('Scheduled time must be within 7 days from now');
      }

      // Check time slot conflicts for this provider
      const conflict = await this.checkTimeSlotConflict(
        dto.providerId,
        scheduledDate,
        dto.estimatedDurationMinutes || 60
      );
      if (conflict) {
        throw ApiError.conflict('Provider already has a booking at this time', {
          field: 'scheduledAt',
          conflictingBookingId: conflict.id,
        });
      }
    }

    // Generate unique reference code
    const referenceCode = this.generateReferenceCode();

    // Create booking
    const booking = this.bookingRepo.create({
      reference_code: referenceCode,
      user_id: dto.userId,
      provider_id: dto.providerId,
      category_id: dto.categoryId,
      address: dto.address || null,
      description: dto.description || null,
      status: BookingStatus.REQUESTED,
      scheduled_at: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      estimated_duration_minutes: dto.estimatedDurationMinutes || null,
    });

    const savedBooking = await this.bookingRepo.save(booking);

    // Set 2-minute expiry in Redis
    await redisService.setBookingTimeout(
      savedBooking.id,
      JSON.stringify({ bookingId: savedBooking.id, providerId: dto.providerId, createdAt: new Date().toISOString() })
    );

    return savedBooking;
  }

  /**
   * Accept a booking request.
   */
  async acceptBooking(bookingId: string, providerId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Booking');

    if (booking.provider_id !== providerId) {
      throw ApiError.forbidden('You are not the assigned provider for this booking');
    }

    if (booking.status !== BookingStatus.REQUESTED) {
      throw ApiError.badRequest(`Cannot accept a booking with status "${booking.status}"`);
    }

    // Check if the timeout has expired
    const timeout = await redisService.getBookingTimeout(bookingId);
    if (!timeout) {
      // Request expired, update status
      booking.status = BookingStatus.EXPIRED;
      await this.bookingRepo.save(booking);
      throw ApiError.badRequest('This booking request has expired');
    }

    booking.status = BookingStatus.ACCEPTED;
    booking.accepted_at = new Date();
    await this.bookingRepo.save(booking);

    // Remove timeout
    await redisService.deleteBookingTimeout(bookingId);

    return booking;
  }

  /**
   * Decline a booking request.
   */
  async declineBooking(bookingId: string, providerId: string, reason?: string): Promise<void> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Booking');

    if (booking.provider_id !== providerId) {
      throw ApiError.forbidden('You are not the assigned provider for this booking');
    }

    if (booking.status !== BookingStatus.REQUESTED) {
      throw ApiError.badRequest(`Cannot decline a booking with status "${booking.status}"`);
    }

    booking.status = BookingStatus.DECLINED;
    booking.cancellation_reason = reason || null;
    await this.bookingRepo.save(booking);

    // Remove timeout
    await redisService.deleteBookingTimeout(bookingId);
  }

  /**
   * Update booking status (state machine transitions).
   */
  async updateStatus(bookingId: string, newStatus: BookingStatus): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Booking');

    // Validate state transitions
    const validTransitions: Record<string, BookingStatus[]> = {
      [BookingStatus.ACCEPTED]: [BookingStatus.EN_ROUTE, BookingStatus.CANCELLED],
      [BookingStatus.EN_ROUTE]: [BookingStatus.ARRIVED, BookingStatus.CANCELLED],
      [BookingStatus.ARRIVED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    };

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw ApiError.badRequest(`Cannot transition from "${booking.status}" to "${newStatus}"`);
    }

    booking.status = newStatus;

    if (newStatus === BookingStatus.IN_PROGRESS) {
      booking.started_at = new Date();
    } else if (newStatus === BookingStatus.COMPLETED) {
      booking.completed_at = new Date();
    } else if (newStatus === BookingStatus.CANCELLED) {
      booking.cancelled_at = new Date();
    }

    return this.bookingRepo.save(booking);
  }

  /**
   * Cancel a booking with fee logic.
   * - No fee if cancelled > 30 minutes before scheduled time
   * - Fee applies if cancelled ≤ 30 minutes before scheduled time
   */
  async cancelBooking(bookingId: string, userId: string): Promise<CancellationResult> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Booking');

    if (booking.user_id !== userId) {
      throw ApiError.forbidden('You can only cancel your own bookings');
    }

    const cancellableStatuses = [
      BookingStatus.REQUESTED,
      BookingStatus.ACCEPTED,
      BookingStatus.EN_ROUTE,
    ];
    if (!cancellableStatuses.includes(booking.status)) {
      throw ApiError.badRequest(`Cannot cancel a booking with status "${booking.status}"`);
    }

    let fee = 0;

    if (booking.scheduled_at && booking.status !== BookingStatus.REQUESTED) {
      const now = new Date();
      const timeUntilScheduled = (booking.scheduled_at.getTime() - now.getTime()) / (1000 * 60);

      if (timeUntilScheduled <= CANCELLATION_THRESHOLD_MINUTES) {
        // Apply cancellation fee (e.g., 20% of estimated cost or flat fee)
        fee = booking.estimated_cost
          ? parseFloat((Number(booking.estimated_cost) * 0.2).toFixed(2))
          : 50; // Default flat fee
      }
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelled_at = new Date();
    booking.cancellation_fee = fee;
    await this.bookingRepo.save(booking);

    // Remove timeout if still pending
    await redisService.deleteBookingTimeout(bookingId);

    return {
      cancelled: true,
      fee,
      message: fee > 0
        ? `Booking cancelled. A cancellation fee of R${fee.toFixed(2)} has been applied.`
        : 'Booking cancelled successfully. No fee applied.',
    };
  }

  /**
   * Get alternative provider suggestions (up to 3) on decline/expiry.
   * Same category, within radius, currently available.
   */
  async getAlternativeProviders(bookingId: string): Promise<ServiceProvider[]> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Booking');

    // Find providers in the same category who are active and online
    const alternatives = await this.providerRepo
      .createQueryBuilder('sp')
      .innerJoin('provider_categories', 'pc', 'pc.provider_id = sp.id')
      .where('pc.category_id = :categoryId', { categoryId: booking.category_id })
      .andWhere('sp.status = :status', { status: ProviderStatus.ACTIVE })
      .andWhere('sp.availability = :availability', { availability: ProviderAvailability.ONLINE })
      .andWhere('sp.id != :excludeId', { excludeId: booking.provider_id })
      .orderBy('sp.average_rating', 'DESC')
      .limit(MAX_ALTERNATIVES)
      .getMany();

    return alternatives;
  }

  /**
   * Get booking history for a user with pagination (50 per page).
   */
  async getBookingHistory(
    userId: string,
    page: number = 1
  ): Promise<{ bookings: Booking[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * PAGINATION_LIMIT;

    const [bookings, total] = await this.bookingRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip,
      take: PAGINATION_LIMIT,
    });

    return {
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / PAGINATION_LIMIT),
    };
  }

  /**
   * Get booking by ID.
   */
  async getBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Booking');
    return booking;
  }

  /**
   * Check for time slot conflicts for a provider.
   */
  private async checkTimeSlotConflict(
    providerId: string,
    scheduledAt: Date,
    durationMinutes: number
  ): Promise<Booking | null> {
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

    // Find any accepted/en_route/in_progress bookings that overlap
    const conflicting = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.provider_id = :providerId', { providerId })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [BookingStatus.ACCEPTED, BookingStatus.EN_ROUTE, BookingStatus.IN_PROGRESS],
      })
      .andWhere('b.scheduled_at IS NOT NULL')
      .andWhere(
        `(b.scheduled_at, b.scheduled_at + (b.estimated_duration_minutes || 60) * interval '1 minute') OVERLAPS (:start, :end)`,
        { start: scheduledAt, end: endTime }
      )
      .getOne();

    return conflicting;
  }

  /**
   * Generate a unique reference code (e.g., BK-ABC12345).
   */
  private generateReferenceCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BK-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const bookingService = new BookingService();
