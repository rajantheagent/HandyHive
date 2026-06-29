import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ServiceProvider } from './ServiceProvider';
import { ServiceCategory } from './ServiceCategory';

@Entity('provider_categories')
@Unique(['provider_id', 'category_id'])
export class ProviderCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
}
