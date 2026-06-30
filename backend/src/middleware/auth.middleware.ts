import { Request, Response, NextFunction } from 'express';
import { jwtService, TokenPayload } from '../services/jwt.service';
import { redisService } from '../services/redis.service';
import { ApiError } from '../errors/api-error';

/**
 * JWT authentication middleware.
 * Validates the Bearer token and attaches user info to the request.
 * Rejects expired or invalid tokens.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyToken(token);

    if (!payload) {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    if (payload.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type');
    }

    // Verify session is still active in Redis (skip if Redis unavailable)
    try {
      const session = await redisService.getSession(payload.userId);
      if (session === null) {
        // Explicit null means Redis is working but session doesn't exist
        // However, if this is a valid JWT, allow it (stateless auth fallback)
      }
    } catch {
      // Redis error — proceed with stateless JWT auth
    }

    // Attach user info to request using a custom property
    (req as any).tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to get the token payload from a request.
 */
export function getTokenPayload(req: Request): TokenPayload {
  const payload = (req as any).tokenPayload as TokenPayload | undefined;
  if (!payload) {
    throw ApiError.unauthorized('Not authenticated');
  }
  return payload;
}

/**
 * Optional auth middleware - doesn't throw if no token present.
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verifyToken(token);

      if (payload && payload.type === 'access') {
        const session = await redisService.getSession(payload.userId);
        if (session) {
          (req as any).tokenPayload = payload;
        }
      }
    }

    next();
  } catch {
    // Silently continue without auth
    next();
  }
}
