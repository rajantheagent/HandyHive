import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { ServiceProvider, ProviderStatus } from '../entities/ServiceProvider';
import { Booking, BookingStatus } from '../entities/Booking';
import { Payment, PaymentStatus } from '../entities/Payment';
import { Dispute, DisputeStatus, DisputeResolution } from '../entities/Dispute';
import { ServiceCategory } from '../entities/ServiceCategory';
import { AdminAction, AdminActionType } from '../entities/AdminAction';
import { Earning } from '../entities/Earning';
import { ApiError } from '../errors/api-error';
import { notificationService } from './notification.service';
import { paymentService } from './payment.service';
import { RecipientType, NotificationType } from '../entities/Notification';
import { ILike } from 'typeorm';

// Commission rate stored in memory (applies only to new bookings)
let currentCommissionRate = 0.15;

export interface DashboardMetrics {
  totalUsers: number;
  activeProviders: number;
  dailyBookings: number;
  totalRevenue: number;
  pendingVerifications: number;
}

export class AdminService {
  private userRepo = AppDataSource.getRepository(User);
  private providerRepo = AppDataSource.getRepository(ServiceProvider);
  private bookingRepo = AppDataSource.getRepository(Booking);
  private paymentRepo = AppDataSource.getRepository(Payment);
  private disputeRepo = AppDataSource.getRepository(Dispute);
  private categoryRepo = AppDataSource.getRepository(ServiceCategory);
  private actionRepo = AppDataSource.getRepository(AdminAction);
  private earningRepo = AppDataSource.getRepository(Earning);

  /**
   * Get admin dashboard metrics.
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeProviders, pendingVerifications] = await Promise.all([
      this.userRepo.count(),
      this.providerRepo.count({ where: { status: ProviderStatus.ACTIVE } }),
      this.providerRepo.count({ where: { status: ProviderStatus.PENDING } }),
    ]);

    const dailyBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.created_at >= :today', { today })
      .getCount();

    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.platform_commission)', 'total')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    return {
      totalUsers,
      activeProviders,
      dailyBookings,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
      pendingVerifications,
    };
  }

  /**
   * Search users and providers (results within 2 seconds).
   */
  async searchUsers(query: string): Promise<{ users: User[]; providers: ServiceProvider[] }> {
    const [users, providers] = await Promise.all([
      this.userRepo.find({
        where: [
          { email: ILike(`%${query}%`) },
          { full_name: ILike(`%${query}%`) },
        ],
        take: 20,
      }),
      this.providerRepo.find({
        where: [
          { email: ILike(`%${query}%`) },
          { full_name: ILike(`%${query}%`) },
        ],
        take: 20,
      }),
    ]);

    return { users, providers };
  }

  /**
   * Suspend or deactivate a user/provider.
   * Reason must be at least 10 characters.
   */
  async suspendUser(
    adminId: string,
    targetId: string,
    targetType: 'user' | 'provider',
    reason: string,
    action: 'suspend' | 'deactivate'
  ): Promise<void> {
    if (!reason || reason.trim().length < 10) {
      throw ApiError.badRequest('Reason must be at least 10 characters');
    }

    if (targetType === 'provider') {
      const provider = await this.providerRepo.findOne({ where: { id: targetId } });
      if (!provider) throw ApiError.notFound('Provider');

      provider.status = action === 'suspend' ? ProviderStatus.SUSPENDED : ProviderStatus.DEACTIVATED;
      await this.providerRepo.save(provider);

      // Cascade: cancel pending/future bookings and notify affected users
      await this.cascadeSuspension(targetId);
    }

    // Log admin action
    await this.logAction(adminId, AdminActionType.SUSPEND_PROVIDER, targetId, targetType, reason);
  }

  /**
   * Cascade provider suspension: cancel pending bookings, notify users.
   */
  private async cascadeSuspension(providerId: string): Promise<void> {
    const pendingBookings = await this.bookingRepo.find({
      where: [
        { provider_id: providerId, status: BookingStatus.REQUESTED },
        { provider_id: providerId, status: BookingStatus.ACCEPTED },
        { provider_id: providerId, status: BookingStatus.EN_ROUTE },
      ],
    });

    for (const booking of pendingBookings) {
      booking.status = BookingStatus.CANCELLED;
      booking.cancelled_at = new Date();
      booking.cancellation_reason = 'Provider account suspended by admin';
      await this.bookingRepo.save(booking);

      // Notify affected user
      await notificationService.send({
        recipientId: booking.user_id,
        recipientType: RecipientType.USER,
        type: NotificationType.BOOKING_STATUS,
        bookingRef: booking.reference_code,
        title: 'Booking Cancelled',
        body: `Your booking ${booking.reference_code} has been cancelled because the provider's account was suspended.`,
      });
    }
  }

  /**
   * Update commission rate (applies only to new bookings after change).
   */
  updateCommissionRate(newRate: number): { previousRate: number; newRate: number } {
    if (newRate < 0 || newRate > 1) {
      throw ApiError.badRequest('Commission rate must be between 0 and 1');
    }
    const previousRate = currentCommissionRate;
    currentCommissionRate = newRate;
    return { previousRate, newRate };
  }

  getCommissionRate(): number {
    return currentCommissionRate;
  }

  /**
   * Service category CRUD.
   */
  async createCategory(name: string, description?: string, iconUrl?: string): Promise<ServiceCategory> {
    const existing = await this.categoryRepo.findOne({ where: { name } });
    if (existing) throw ApiError.conflict('Category with this name already exists');

    const category = this.categoryRepo.create({
      name,
      description: description || null,
      icon_url: iconUrl || null,
      is_active: true,
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, updates: Partial<Pick<ServiceCategory, 'name' | 'description' | 'icon_url' | 'is_active'>>): Promise<ServiceCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw ApiError.notFound('Category');
    Object.assign(category, updates);
    return this.categoryRepo.save(category);
  }

  async deactivateCategory(id: string): Promise<void> {
    await this.categoryRepo.update(id, { is_active: false });
  }

  async getCategories(): Promise<ServiceCategory[]> {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  /**
   * Resolve a dispute: full refund, partial refund, or dismiss.
   */
  async resolveDispute(
    adminId: string,
    disputeId: string,
    resolution: DisputeResolution,
    refundAmount?: number
  ): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({ where: { id: disputeId } });
    if (!dispute) throw ApiError.notFound('Dispute');

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw ApiError.badRequest('Dispute is already resolved');
    }

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution = resolution;
    dispute.resolved_by = adminId;
    dispute.resolved_at = new Date();

    if (resolution === DisputeResolution.FULL_REFUND) {
      await paymentService.processRefund(dispute.payment_id);
      dispute.refund_amount = null; // Full amount
    } else if (resolution === DisputeResolution.PARTIAL_REFUND && refundAmount) {
      await paymentService.processRefund(dispute.payment_id, refundAmount);
      dispute.refund_amount = refundAmount;
    }

    await this.logAction(adminId, AdminActionType.RESOLVE_DISPUTE, disputeId, 'dispute', `Resolution: ${resolution}`);

    return this.disputeRepo.save(dispute);
  }

  /**
   * Get open disputes.
   */
  async getOpenDisputes(): Promise<Dispute[]> {
    return this.disputeRepo.find({
      where: { status: DisputeStatus.OPEN },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Generate exportable report (bookings, revenue, user activity).
   */
  async generateReport(type: 'bookings' | 'revenue' | 'users', period: 'daily' | 'weekly' | 'monthly'): Promise<any[]> {
    let daysBack: number;
    switch (period) {
      case 'weekly': daysBack = 7; break;
      case 'monthly': daysBack = 30; break;
      default: daysBack = 1; break;
    }
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    switch (type) {
      case 'bookings':
        return this.bookingRepo
          .createQueryBuilder('b')
          .select(['b.id', 'b.reference_code', 'b.status', 'b.created_at', 'b.estimated_cost', 'b.final_cost'])
          .where('b.created_at >= :startDate', { startDate })
          .orderBy('b.created_at', 'DESC')
          .getMany();

      case 'revenue':
        return this.paymentRepo
          .createQueryBuilder('p')
          .select(['p.id', 'p.amount', 'p.platform_commission', 'p.provider_payout', 'p.status', 'p.paid_at'])
          .where('p.paid_at >= :startDate', { startDate })
          .andWhere('p.status = :status', { status: PaymentStatus.COMPLETED })
          .orderBy('p.paid_at', 'DESC')
          .getMany();

      case 'users':
        return this.userRepo
          .createQueryBuilder('u')
          .select(['u.id', 'u.email', 'u.full_name', 'u.created_at', 'u.email_verified'])
          .where('u.created_at >= :startDate', { startDate })
          .orderBy('u.created_at', 'DESC')
          .getMany();

      default:
        return [];
    }
  }

  /**
   * Log an admin action for audit trail.
   */
  private async logAction(
    adminId: string,
    actionType: AdminActionType,
    targetId: string,
    targetType: string,
    reason: string
  ): Promise<void> {
    const action = this.actionRepo.create({
      admin_id: adminId,
      action_type: actionType,
      target_id: targetId,
      target_type: targetType,
      reason,
    });
    await this.actionRepo.save(action);
  }
}

export const adminService = new AdminService();
