import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum RecipientType {
  USER = 'user',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

export enum NotificationType {
  BOOKING_STATUS = 'booking_status',
  PAYMENT = 'payment',
  RATING = 'rating',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  recipient_id!: string;

  @Column({ type: 'enum', enum: RecipientType })
  recipient_type!: RecipientType;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  booking_ref!: string | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'enum', enum: NotificationChannel, default: NotificationChannel.IN_APP })
  channel!: NotificationChannel;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  delivered_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  read_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;
}
