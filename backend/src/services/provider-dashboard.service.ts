import { AppDataSource } from '../config/data-source';
import { ServiceProvider } from '../entities/ServiceProvider';
import { Booking, BookingStatus } from '../entities/Booking';
import { Earning } from '../entities/Earning';
import { ApiError } from '../errors/api-error';

const PAGINATION_LIMIT = 50;

export interface ProviderDashboardMetrics {
  totalEarnings: number;
  completedBookings: number;
  averageRating: number;
  acceptanceRate: number;
}

export class ProviderDashboardService {
  private providerRepo = AppDataSource.getRepository(ServiceProvider);
  private bookingRepo = AppDataSource.getRepository(Booking);
  private earningRepo = AppDataSource.getRepository(Earning);

  /**
   * Get provider dashboard metrics:
   * - Total lifetime earnings
   * - Completed bookings count
   * - Average rating
   * - Acceptance rate (past 30 days)
   */
  async getMetrics(providerId: string): Promise<ProviderDashboardMetrics> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw ApiError.notFound('Provider');

    // Total earnings
    const earningsResult = await this.earningRepo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.provider_id = :providerId', { providerId })
      .getRawOne();
    const totalEarnings = parseFloat(earningsResult?.total || '0');

    // Completed bookings
    const completedBookings = await this.bookingRepo.count({
      where: { provider_id: providerId, status: BookingStatus.COMPLETED },
    });

    // Acceptance rate: accepted / (accepted + declined + expired) over past 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rateResult = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('b.provider_id = :providerId', { providerId })
      .andWhere('b.created_at >= :since', { since: thirtyDaysAgo })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [BookingStatus.ACCEPTED, BookingStatus.DECLINED, BookingStatus.EXPIRED,
                   BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED],
      })
      .groupBy('b.status')
      .getRawMany();

    let accepted = 0;
    let total = 0;
    for (const row of rateResult) {
      const count = parseInt(row.count, 10);
      total += count;
      if ([BookingStatus.ACCEPTED, BookingStatus.EN_ROUTE, BookingStatus.ARRIVED,
           BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED].includes(row.status)) {
        accepted += count;
      }
    }
    const acceptanceRate = total > 0 ? parseFloat(((accepted / total) * 100).toFixed(1)) : 0;

    return {
      totalEarnings,
      completedBookings,
      averageRating: provider.average_rating ? parseFloat(Number(provider.average_rating).toFixed(1)) : 0,
      acceptanceRate,
    };
  }

  /**
   * Earnings breakdown by period.
   */
  async getEarningsBreakdown(providerId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<{
    total: number;
    breakdown: { date: string; amount: number }[];
  }> {
    let daysBack: number;
    switch (period) {
      case 'weekly': daysBack = 84; break;  // 12 weeks
      case 'monthly': daysBack = 365; break; // 12 months
      default: daysBack = 30; break;         // 30 days
    }

    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const earnings = await this.earningRepo
      .createQueryBuilder('e')
      .select('DATE(e.earning_date)', 'date')
      .addSelect('SUM(e.amount)', 'total')
      .where('e.provider_id = :providerId', { providerId })
      .andWhere('e.earning_date >= :startDate', { startDate })
      .groupBy('DATE(e.earning_date)')
      .orderBy('date', 'DESC')
      .getRawMany();

    const total = earnings.reduce((sum, e) => sum + parseFloat(e.total || '0'), 0);

    return {
      total: parseFloat(total.toFixed(2)),
      breakdown: earnings.map(e => ({
        date: e.date,
        amount: parseFloat(parseFloat(e.total).toFixed(2)),
      })),
    };
  }

  /**
   * Provider booking history with pagination (50 per page).
   */
  async getBookingHistory(providerId: string, page: number = 1): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * PAGINATION_LIMIT;

    const [bookings, total] = await this.bookingRepo.findAndCount({
      where: { provider_id: providerId },
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
}

export const providerDashboardService = new ProviderDashboardService();
