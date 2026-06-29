import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payment } from './Payment';
import { User } from './User';
import { Admin } from './Admin';

export enum DisputeStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

export enum DisputeResolution {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  DISMISSED = 'dismissed',
}

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  payment_id!: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ type: 'uuid' })
  raised_by!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raised_by' })
  raised_by_user!: User;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status!: DisputeStatus;

  @Column({ type: 'enum', enum: DisputeResolution, nullable: true })
  resolution!: DisputeResolution | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refund_amount!: number | null;

  @Column({ type: 'uuid', nullable: true })
  resolved_by!: string | null;

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolved_by_admin!: Admin | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
