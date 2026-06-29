import { Request, Response, NextFunction } from 'express';
import { redisService, RATE_LIMIT_TTL } from '../services/redis.service';
import { ApiError } from '../errors/api-error';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_SECONDS = 1800; // 30 minutes

/**
 * Redis-based rate limiting middleware.
 * Allows 5 failed attempts per 15-min window per IP.
 * Blocks IP for 30 minutes when rate limit exceeded.
 */
export function rateLimitMiddleware(endpoint: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const count = await redisService.getRateLimitCount(ip, endpoint);

      if (count >= MAX_ATTEMPTS) {
        throw ApiError.tooManyRequests(BLOCK_DURATION_SECONDS);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Increment the rate limit counter after a failed login attempt.
 * Should be called when login fails.
 */
export async function incrementRateLimit(ip: string, endpoint: string): Promise<number> {
  return redisService.incrementRateLimit(ip, endpoint);
}

/**
 * Check if an IP is currently rate-limited.
 */
export async function isRateLimited(ip: string, endpoint: string): Promise<boolean> {
  const count = await redisService.getRateLimitCount(ip, endpoint);
  return count >= MAX_ATTEMPTS;
}
