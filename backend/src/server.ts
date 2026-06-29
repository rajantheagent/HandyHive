import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { AppDataSource } from './config/data-source';
import { trackingService } from './services/tracking.service';

const startServer = async (): Promise<void> => {
  try {
    // Initialize TypeORM connection
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    // Enable PostGIS extension
    try {
      await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
      console.log('PostGIS extension enabled');
    } catch (e: any) {
      console.warn('PostGIS extension note:', e.message);
    }

    // Create HTTP server (needed for Socket.IO)
    const httpServer = createServer(app);

    // Initialize Socket.IO for real-time tracking
    trackingService.initialize(httpServer);
    console.log('Socket.IO tracking service initialized');

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      console.log(`WebSocket available at ws://localhost:${config.port}`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error.message || error);
    if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Cannot resolve database hostname. Check DB_HOST in .env');
      console.error('   Current: ' + (process.env.DB_HOST || 'localhost'));
    }
    process.exit(1);
  }
};

startServer();
