import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api-error';

/**
 * Global Express error handler middleware.
 * Catches all errors thrown in route handlers and formats them into
 * a consistent API error response.
 *
 * Must be registered AFTER all route handlers.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // If the error is a known ApiError, use its properties directly
  if (err instanceof ApiError) {
    res.status(err.status).json(err.toJSON());
    return;
  }

  // Log unexpected errors for debugging (avoid exposing internals in production)
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error('[ErrorHandler]', err);
  } else {
    console.error('[ErrorHandler]', err.message);
  }

  // Return a generic 500 for unknown errors
  const genericError = ApiError.internal(
    isProduction ? 'An unexpected error occurred' : err.message
  );
  res.status(genericError.status).json(genericError.toJSON());
}
