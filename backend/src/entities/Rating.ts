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

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('ratings')
export class Rating {
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

  @Column({ type: 'int' })
  stars!: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  review_text!: string | null;

  @Column({ type: 'enum', enum: ModerationStatus, default: ModerationStatus.PENDING })
  moderation_status!: ModerationStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  provider_response!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  provider_response_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
