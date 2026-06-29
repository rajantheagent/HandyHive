import Redis from 'ioredis';
import { config } from './index';

/**
 * Redis client singleton for the application.
 * Gracefully degrades if Redis is unavailable — app will still function
 * but without caching, rate limiting, and session features.
 */
const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy(times: number): number | null {
    if (times > 3) {
      console.warn('Redis: unavailable — running without Redis (caching/rate-limiting disabled)');
      return null; // stop retrying
    }
    const delay = Math.min(times * 500, 3000);
    return delay;
  },
  maxRetriesPerRequest: 1,
  lazyConnect: true, // Don't connect immediately — connect on first use
  enableOfflineQueue: false, // Don't queue commands when disconnected
});

let redisAvailable = false;

redisClient.on('connect', () => {
  console.log('Redis: connection established');
  redisAvailable = true;
});

redisClient.on('ready', () => {
  console.log('Redis: client ready');
  redisAvailable = true;
});

redisClient.on('error', (error: Error) => {
  // Suppress noisy connection errors in dev
  if (!redisAvailable) {
    // Only log once
  }
});

redisClient.on('close', () => {
  redisAvailable = false;
});

// Try to connect but don't block app startup
redisClient.connect().catch(() => {
  console.warn('Redis: not available — app will run without caching/sessions');
});

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export default redisClient;
