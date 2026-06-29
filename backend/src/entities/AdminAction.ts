import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from './Admin';

export enum AdminActionType {
  APPROVE_PROVIDER = 'approve_provider',
  SUSPEND_PROVIDER = 'suspend_provider',
  DEACTIVATE_PROVIDER = 'deactivate_provider',
  RESOLVE_DISPUTE = 'resolve_dispute',
  MODERATE_REVIEW = 'moderate_review',
  MANAGE_CATEGORY = 'manage_category',
  SYSTEM_CONFIG = 'system_config',
}

@Entity('admin_actions')
export class AdminAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  admin_id!: string;

  @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin!: Admin;

  @Column({ type: 'enum', enum: AdminActionType })
  action_type!: AdminActionType;

  @Column({ type: 'uuid', nullable: true })
  target_id!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  target_type!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at!: Date;
}
