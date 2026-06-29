import Stripe from 'stripe';
import crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/Payment';
import { Booking, BookingStatus } from '../entities/Booking';
import { Earning } from '../entities/Earning';
import { Dispute } from '../entities/Dispute';
import { ApiError } from '../errors/api-error';

const PLATFORM_COMMISSION_RATE = 0.15; // 15% default
const ESCROW_TIMEOUT_HOURS = 48;
const MAX_RETRIES = 3;

// Initialize Stripe (use test key in dev)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export interface CreatePaymentDto {
  bookingId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
}

export interface PriceEstimate {
  hourlyRate: number;
  estimatedDurationHours: number;
  serviceFees: number;
  subtotal: number;
  total: number;
}

export class PaymentService {
  private paymentRepo = AppDataSource.getRepository(Payment);
  private bookingRepo = AppDataSource.getRepository(Booking);
  private earningRepo = AppDataSource.getRepository(Earning);
  private disputeRepo = AppDataSource.getRepository(Dispute);

  /**
   * Create a payment intent with Stripe.
   * Uses idempotency keys to prevent double-charging.
   */
  async createPaymentIntent(dto: CreatePaymentDto): Promise<{
    payment: Payment;
    clientSecret: string;
  }> {
    // Validate booking
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw ApiError.notFound('Booking');

    if (booking.user_id !== dto.userId) {
      throw ApiError.forbidden('You can only pay for your own bookings');
    }

    // Check for existing payment
    const existing = await this.paymentRepo.findOne({
      where: { booking_id: dto.bookingId, status: PaymentStatus.PENDING },
    });
    if (existing) {
      throw ApiError.conflict('A payment is already pending for this booking');
    }

    // Calculate commission
    const amount = dto.amount;
    const commission = parseFloat((amount * PLATFORM_COMMISSION_RATE).toFixed(2));
    const providerPayout = parseFloat((amount - commission).toFixed(2));

    // Generate idempotency key
    const idempotencyKey = crypto.createHash('md5')
      .update(`${dto.bookingId}-${dto.userId}-${amount}`)
      .digest('hex');

    let paymentIntent: Stripe.PaymentIntent | null = null;
    let clientSecret = '';

    try {
      // Create Stripe payment intent (tokenized, no raw card storage)
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(amount * 100), // Stripe uses cents
          currency: 'zar',
          capture_method: 'manual', // Hold for escrow
          metadata: {
            bookingId: dto.bookingId,
            userId: dto.userId,
            providerId: booking.provider_id,
          },
        },
        { idempotencyKey }
      );

      clientSecret = paymentIntent.client_secret || '';
    } catch (err: any) {
      // In dev without real Stripe key, create mock
      if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY) {
        console.log('[DEV] Mock payment intent created');
        clientSecret = `pi_mock_${crypto.randomUUID()}_secret_mock`;
      } else {
        throw ApiError.badRequest(`Payment failed: ${err.message}`);
      }
    }

    // Create payment record
    const payment = this.paymentRepo.create({
      booking_id: dto.bookingId,
      user_id: dto.userId,
      provider_id: booking.provider_id,
      amount,
      platform_commission: commission,
      provider_payout: providerPayout,
      status: PaymentStatus.PENDING,
      method: dto.method,
      stripe_payment_intent_id: paymentIntent?.id || `pi_mock_${crypto.randomUUID()}`,
    });

    const savedPayment = await this.paymentRepo.save(payment);

    return { payment: savedPayment, clientSecret };
  }

  /**
   * Confirm payment and hold in escrow.
   * Escrow releases when user confirms completion OR after 48h.
   */
  async confirmPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw ApiError.notFound('Payment');

    if (payment.status !== PaymentStatus.PENDING) {
      throw ApiError.badRequest(`Cannot confirm payment with status "${payment.status}"`);
    }

    // Capture the payment intent (escrow)
    if (payment.stripe_payment_intent_id && !payment.stripe_payment_intent_id.startsWith('pi_mock_')) {
      try {
        await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);
      } catch (err: any) {
        throw ApiError.badRequest(`Payment capture failed: ${err.message}`);
      }
    }

    payment.status = PaymentStatus.HELD;
    payment.paid_at = new Date();
    return this.paymentRepo.save(payment);
  }

  /**
   * Release escrow — transfer payout to provider.
   * Triggered by user confirmation or 48h timeout.
   */
  async releaseEscrow(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw ApiError.notFound('Payment');

    if (payment.status !== PaymentStatus.HELD) {
      throw ApiError.badRequest('Payment is not in escrow');
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.released_at = new Date();
    payment.receipt_url = `https://receipts.handyhive.com/${payment.id}`;

    const updatedPayment = await this.paymentRepo.save(payment);

    // Record earning for provider
    const earning = this.earningRepo.create({
      provider_id: payment.provider_id,
      booking_id: payment.booking_id,
      payment_id: payment.id,
      amount: payment.provider_payout || 0,
      commission_deducted: payment.platform_commission || 0,
      earning_date: new Date().toISOString().split('T')[0],
    });
    await this.earningRepo.save(earning);

    return updatedPayment;
  }

  /**
   * Process refund (full or partial).
   */
  async processRefund(paymentId: string, amount?: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw ApiError.notFound('Payment');

    if (payment.status !== PaymentStatus.HELD && payment.status !== PaymentStatus.COMPLETED) {
      throw ApiError.badRequest('Can only refund held or completed payments');
    }

    const refundAmount = amount || payment.amount;

    // Process Stripe refund
    if (payment.stripe_payment_intent_id && !payment.stripe_payment_intent_id.startsWith('pi_mock_')) {
      try {
        await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: Math.round(Number(refundAmount) * 100),
        });
      } catch (err: any) {
        throw ApiError.badRequest(`Refund failed: ${err.message}`);
      }
    }

    payment.status = PaymentStatus.REFUNDED;
    return this.paymentRepo.save(payment);
  }

  /**
   * Create a payment dispute with admin notification.
   */
  async createDispute(paymentId: string, userId: string, reason: string): Promise<any> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw ApiError.notFound('Payment');

    payment.status = PaymentStatus.DISPUTED;
    await this.paymentRepo.save(payment);

    const dispute = this.disputeRepo.create({
      payment_id: paymentId,
      raised_by: userId,
      reason,
      status: 'open' as any,
    });

    return this.disputeRepo.save(dispute);
  }

  /**
   * Calculate price estimate: hourly_rate × duration + service_fees.
   */
  calculatePriceEstimate(hourlyRate: number, durationMinutes: number, serviceFeeRate: number = 0.05): PriceEstimate {
    const durationHours = durationMinutes / 60;
    const subtotal = hourlyRate * durationHours;
    const serviceFees = parseFloat((subtotal * serviceFeeRate).toFixed(2));
    const total = parseFloat((subtotal + serviceFees).toFixed(2));

    return {
      hourlyRate,
      estimatedDurationHours: durationHours,
      serviceFees,
      subtotal: parseFloat(subtotal.toFixed(2)),
      total,
    };
  }

  /**
   * Get provider earnings breakdown.
   */
  async getProviderEarnings(providerId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    total: number;
    breakdown: { date: string; amount: number }[];
  }> {
    const now = new Date();
    let daysBack: number;

    switch (period) {
      case 'weekly': daysBack = 84; break; // 12 weeks
      case 'monthly': daysBack = 365; break; // 12 months
      default: daysBack = 30; break;
    }

    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

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
   * Check and auto-release escrow after 48h timeout.
   */
  async checkEscrowTimeouts(): Promise<void> {
    const timeoutDate = new Date(Date.now() - ESCROW_TIMEOUT_HOURS * 60 * 60 * 1000);

    const expiredPayments = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PaymentStatus.HELD })
      .andWhere('p.paid_at <= :timeoutDate', { timeoutDate })
      .getMany();

    for (const payment of expiredPayments) {
      await this.releaseEscrow(payment.id);
      console.log(`[Escrow] Auto-released payment ${payment.id} after 48h timeout`);
    }
  }
}

export const paymentService = new PaymentService();
