import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'home_services_marketplace',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '24h',
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@handyhive.com',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || 'apikey',
    smtpPassword: process.env.SMTP_PASSWORD || '',
  },
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    facebookClientId: process.env.FACEBOOK_CLIENT_ID || '',
    facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    callbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://localhost:4200/auth/oauth-callback',
  },
};
