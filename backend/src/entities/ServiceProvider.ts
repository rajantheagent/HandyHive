import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProviderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

export enum ProviderAvailability {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Entity('service_providers')
export class ServiceProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'varchar', length: 100 })
  full_name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'int', default: 0 })
  experience_years!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate!: number | null;

  @Column({ type: 'int', default: 10 })
  service_radius_km!: number;

  @Column({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.PENDING })
  status!: ProviderStatus;

  @Column({ type: 'enum', enum: ProviderAvailability, default: ProviderAvailability.OFFLINE })
  availability!: ProviderAvailability;

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location!: object | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  id_document_url!: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating!: number;

  @Column({ type: 'int', default: 0 })
  total_bookings!: number;

  @Column({ type: 'int', default: 0 })
  total_ratings!: number;

  @Column({ type: 'jsonb', nullable: true })
  notification_preferences!: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
