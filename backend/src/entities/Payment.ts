import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './Booking';
import { User } from './User';
import { ServiceProvider } from './ServiceProvider';

export enum PaymentStatus {
  PENDING = 'pending',
  HELD = 'held',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  UPI = 'upi',
  DIGITAL_WALLET = 'digital_wallet',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  booking_id!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  provider_id!: string;

  @ManyToOne(() => ServiceProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider!: ServiceProvider;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  platform_commission!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  provider_payout!: number | null;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_payment_intent_id!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receipt_url!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  released_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
