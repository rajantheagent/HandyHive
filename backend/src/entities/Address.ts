import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum AddressLabel {
  HOME = 'Home',
  OFFICE = 'Office',
  OTHER = 'Other',
}

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: AddressLabel, default: AddressLabel.HOME })
  label!: AddressLabel;

  @Column({ type: 'text' })
  full_address!: string;

  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location!: object | null;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}
