import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { ServiceProvider } from './ServiceProvider';
import { ServiceCategory } from './ServiceCategory';

export enum BookingStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  EN_ROUTE = 'en_route',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  reference_code!: string;

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

  @Column({ type: 'uuid' })
  category_id!: string;

  @ManyToOne(() => ServiceCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: ServiceCategory;

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location!: object | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.REQUESTED })
  status!: BookingStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at!: Date | null;

  @Column({ type: 'int', nullable: true })
  estimated_duration_minutes!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimated_cost!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  final_cost!: number | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cancellation_fee!: number | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
