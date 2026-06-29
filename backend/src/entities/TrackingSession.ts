import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './Booking';

@Entity('tracking_sessions')
export class TrackingSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  booking_id!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  current_location!: object | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  eta_minutes!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_km!: number | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_updated!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
