import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { AppDataSource } from './config/data-source';
import { trackingService } from './services/tracking.service';
import { ServiceCategory } from './entities/ServiceCategory';

const DEFAULT_CATEGORIES = [
  { name: 'Electrician', description: 'Wiring, repairs, installations & electrical inspections' },
  { name: 'Plumber', description: 'Pipe leaks, blocked drains, geyser repairs & fittings' },
  { name: 'Carpenter', description: 'Furniture, doors, cabinets, shelving & wood restoration' },
  { name: 'Painter', description: 'Interior & exterior painting, waterproofing & finishes' },
  { name: 'Cleaner', description: 'Deep cleaning, move-in/out, carpet & window washing' },
  { name: 'AC & HVAC', description: 'Installation, gas refills, duct cleaning & servicing' },
  { name: 'Locksmith', description: 'Lock changes, key cutting, gate motors & access control' },
  { name: 'Gardening', description: 'Lawn mowing, hedge trimming, irrigation & landscaping' },
];

async function seedCategories(): Promise<void> {
  const repo = AppDataSource.getRepository(ServiceCategory);
  const count = await repo.count();
  if (count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await repo.save(repo.create({ name: cat.name, description: cat.description, is_active: true }));
    }
    console.log(`Seeded ${DEFAULT_CATEGORIES.length} default service categories`);
  }
}

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

    // Seed default categories if empty
    await seedCategories();

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
