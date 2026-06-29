import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceProvider } from './ServiceProvider';
import { Booking } from './Booking';
import { Payment } from './Payment';

@Entity('earnings')
export class Earning {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  provider_id!: string;

  @ManyToOne(() => ServiceProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider!: ServiceProvider;

  @Column({ type: 'uuid' })
  booking_id!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'uuid' })
  payment_id!: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commission_deducted!: number;

  @Column({ type: 'date' })
  earning_date!: string;

  @CreateDateColumn()
  created_at!: Date;
}
