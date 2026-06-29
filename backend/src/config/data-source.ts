import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../entities/**/*.{ts,js}'],
  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
  subscribers: [],
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  extra: {
    // PostGIS spatial support
    postGIS: true,
    ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);
