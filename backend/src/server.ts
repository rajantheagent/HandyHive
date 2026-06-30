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
  try {
    const repo = AppDataSource.getRepository(ServiceCategory);
    const count = await repo.count();
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await repo.save(repo.create({ name: cat.name, description: cat.description, is_active: true }));
      }
      console.log(`Seeded ${DEFAULT_CATEGORIES.length} default service categories`);
    }
  } catch (e: any) {
    console.warn('Could not seed categories:', e.message);
  }
}

const startServer = async (): Promise<void> => {
  // Create HTTP server first — start listening regardless of DB
  const httpServer = createServer(app);

  // Initialize Socket.IO
  trackingService.initialize(httpServer);

  // Start listening
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  // Connect to database (non-blocking — server runs even if DB is down)
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    try {
      await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
      console.log('✅ PostGIS extension enabled');
    } catch (e: any) {
      console.warn('⚠️  PostGIS:', e.message);
    }

    await seedCategories();
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   The server is running but API calls requiring DB will fail.');
    console.error('   Please start PostgreSQL and restart the server.');
  }
};

startServer();
