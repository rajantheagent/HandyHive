import redisClient, { isRedisAvailable } from '../config/redis';

// ─── TTL Constants (in seconds) ───────────────────────────────────────────────

/** User session TTL: 24 hours */
export const SESSION_TTL = 86400;

/** Provider location cache TTL: 60 seconds */
export const LOCATION_TTL = 60;

/** Rate limiting window TTL: 15 minutes */
export const RATE_LIMIT_TTL = 900;

/** Booking request timeout TTL: 120 seconds */
export const BOOKING_TIMEOUT_TTL = 120;

/** Search results cache TTL: 30 seconds */
export const SEARCH_CACHE_TTL = 30;

// ─── Key Pattern Helpers ──────────────────────────────────────────────────────

export const RedisKeys = {
  session: (userId: string) => `session:${userId}`,
  providerLocation: (providerId: string) => `provider:location:${providerId}`,
  rateLimit: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
  bookingTimeout: (bookingId: string) => `booking:timeout:${bookingId}`,
  searchCache: (hash: string) => `search:cache:${hash}`,
  notificationsUnread: (userId: string) => `notifications:unread:${userId}`,
};

// ─── Redis Service ────────────────────────────────────────────────────────────

export class RedisService {
  // ── Session Management ──────────────────────────────────────────────────────

  /**
   * Store a user session token.
   */
  async setSession(userId: string, sessionData: string): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.set(RedisKeys.session(userId), sessionData, 'EX', SESSION_TTL);
  }

  /**
   * Retrieve a user session token.
   */
  async getSession(userId: string): Promise<string | null> {
    if (!isRedisAvailable()) return 'no-redis-fallback';
    return redisClient.get(RedisKeys.session(userId));
  }

  /**
   * Delete a user session (logout).
   */
  async deleteSession(userId: string): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.del(RedisKeys.session(userId));
  }

  // ── Caching ─────────────────────────────────────────────────────────────────

  /**
   * Set a cached value with a specified TTL.
   */
  async setCache(key: string, value: string, ttl: number): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.set(key, value, 'EX', ttl);
  }

  /**
   * Get a cached value.
   */
  async getCache(key: string): Promise<string | null> {
    if (!isRedisAvailable()) return null;
    return redisClient.get(key);
  }

  /**
   * Invalidate (delete) a cached value.
   */
  async invalidateCache(key: string): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.del(key);
  }

  // ── Rate Limiting ───────────────────────────────────────────────────────────

  /**
   * Increment the rate limit counter for an IP/endpoint using a sliding window.
   * Returns the current count after increment.
   */
  async incrementRateLimit(ip: string, endpoint: string): Promise<number> {
    if (!isRedisAvailable()) return 0;
    const key = RedisKeys.rateLimit(ip, endpoint);
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_TTL * 1000;

    // Use a sorted set for sliding window rate limiting
    const pipeline = redisClient.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now.toString(), `${now}`);
    pipeline.zcard(key);
    pipeline.expire(key, RATE_LIMIT_TTL);

    const results = await pipeline.exec();
    if (!results) {
      return 0;
    }

    // zcard result is at index 2
    const zcardResult = results[2];
    if (zcardResult && zcardResult[1] !== null && zcardResult[1] !== undefined) {
      return zcardResult[1] as number;
    }
    return 0;
  }

  /**
   * Get the current rate limit count for an IP/endpoint.
   */
  async getRateLimitCount(ip: string, endpoint: string): Promise<number> {
    if (!isRedisAvailable()) return 0;
    const key = RedisKeys.rateLimit(ip, endpoint);
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_TTL * 1000;

    // Remove expired entries and count remaining
    await redisClient.zremrangebyscore(key, 0, windowStart);
    return redisClient.zcard(key);
  }

  // ── Location Caching ────────────────────────────────────────────────────────

  /**
   * Store a provider's current location.
   */
  async setProviderLocation(
    providerId: string,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    if (!isRedisAvailable()) return;
    const key = RedisKeys.providerLocation(providerId);
    await redisClient.hset(key, {
      lat: latitude.toString(),
      lng: longitude.toString(),
      timestamp: Date.now().toString(),
    });
    await redisClient.expire(key, LOCATION_TTL);
  }

  /**
   * Get a provider's cached location.
   */
  async getProviderLocation(
    providerId: string,
  ): Promise<{ lat: number; lng: number; timestamp: number } | null> {
    if (!isRedisAvailable()) return null;
    const key = RedisKeys.providerLocation(providerId);
    const data = await redisClient.hgetall(key);

    if (!data || !data.lat || !data.lng) {
      return null;
    }

    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      timestamp: parseInt(data.timestamp, 10),
    };
  }

  // ── Booking Timeout ─────────────────────────────────────────────────────────

  /**
   * Set a booking timeout (2-minute request expiry).
   */
  async setBookingTimeout(bookingId: string, data: string): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.set(
      RedisKeys.bookingTimeout(bookingId),
      data,
      'EX',
      BOOKING_TIMEOUT_TTL,
    );
  }

  /**
   * Get the booking timeout data (null if expired).
   */
  async getBookingTimeout(bookingId: string): Promise<string | null> {
    if (!isRedisAvailable()) return 'no-redis-fallback';
    return redisClient.get(RedisKeys.bookingTimeout(bookingId));
  }

  /**
   * Delete a booking timeout (e.g., when provider responds).
   */
  async deleteBookingTimeout(bookingId: string): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.del(RedisKeys.bookingTimeout(bookingId));
  }

  // ── Search Cache ────────────────────────────────────────────────────────────

  /**
   * Cache search results.
   */
  async setSearchCache(hash: string, results: string): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.set(RedisKeys.searchCache(hash), results, 'EX', SEARCH_CACHE_TTL);
  }

  /**
   * Get cached search results.
   */
  async getSearchCache(hash: string): Promise<string | null> {
    if (!isRedisAvailable()) return null;
    return redisClient.get(RedisKeys.searchCache(hash));
  }

  // ── Notifications ───────────────────────────────────────────────────────────

  /**
   * Increment the unread notification counter for a user.
   */
  async incrementUnreadNotifications(userId: string): Promise<number> {
    if (!isRedisAvailable()) return 0;
    return redisClient.incr(RedisKeys.notificationsUnread(userId));
  }

  /**
   * Get the unread notification count for a user.
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!isRedisAvailable()) return 0;
    const count = await redisClient.get(RedisKeys.notificationsUnread(userId));
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Reset the unread notification counter (e.g., when user views notifications).
   */
  async resetUnreadNotifications(userId: string): Promise<void> {
    if (!isRedisAvailable()) return;
    await redisClient.del(RedisKeys.notificationsUnread(userId));
  }
}

export const redisService = new RedisService();
