import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
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

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url!: string | null;

  @Column({ type: 'varchar', length: 10, default: 'user' })
  role!: string;

  @Column({ type: 'boolean', default: false })
  email_verified!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  oauth_provider!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  oauth_id!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verification_token!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verification_token_expires!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  notification_preferences!: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
