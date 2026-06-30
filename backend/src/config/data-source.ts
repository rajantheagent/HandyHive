import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';

// Import all entities explicitly
import { User } from '../entities/User';
import { ServiceProvider } from '../entities/ServiceProvider';
import { Address } from '../entities/Address';
import { ServiceCategory } from '../entities/ServiceCategory';
import { ProviderCategory } from '../entities/ProviderCategory';
import { Booking } from '../entities/Booking';
import { TrackingSession } from '../entities/TrackingSession';
import { Rating } from '../entities/Rating';
import { Payment } from '../entities/Payment';
import { Dispute } from '../entities/Dispute';
import { Earning } from '../entities/Earning';
import { Notification } from '../entities/Notification';
import { Admin } from '../entities/Admin';
import { AdminAction } from '../entities/AdminAction';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'handyhive',
  synchronize: process.env.NODE_ENV === 'development',
  logging: false,
  entities: [
    User, ServiceProvider, Address, ServiceCategory,
    ProviderCategory, Booking, TrackingSession, Rating,
    Payment, Dispute, Earning, Notification, Admin, AdminAction
  ],
  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
  subscribers: [],
  ssl: useSSL ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
