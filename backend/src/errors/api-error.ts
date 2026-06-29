/**
 * Custom API error class for consistent error responses across the application.
 * Extends the native Error class with HTTP status codes, machine-readable error codes,
 * and retry metadata.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    retryable: boolean;
    retryAfter?: number;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.retryable = params.retryable;
    this.retryAfter = params.retryAfter;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * 400 Bad Request - validation or malformed request errors
   */
  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message,
      details,
      retryable: false,
    });
  }

  /**
   * 401 Unauthorized - missing or invalid authentication
   */
  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message,
      retryable: false,
    });
  }

  /**
   * 403 Forbidden - authenticated but insufficient permissions
   */
  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError({
      status: 403,
      code: 'FORBIDDEN',
      message,
      retryable: false,
    });
  }

  /**
   * 404 Not Found - resource does not exist
   */
  static notFound(resource = 'Resource'): ApiError {
    return new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      retryable: false,
    });
  }

  /**
   * 409 Conflict - request conflicts with current state
   */
  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError({
      status: 409,
      code: 'CONFLICT',
      message,
      details,
      retryable: false,
    });
  }

  /**
   * 429 Too Many Requests - rate limit exceeded
   */
  static tooManyRequests(retryAfter: number): ApiError {
    return new ApiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      retryable: true,
      retryAfter,
    });
  }

  /**
   * 500 Internal Server Error - unexpected server failure
   */
  static internal(message = 'An unexpected error occurred'): ApiError {
    return new ApiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message,
      retryable: true,
    });
  }

  /**
   * 503 Service Unavailable - temporary service outage
   */
  static serviceUnavailable(message = 'Service temporarily unavailable', retryAfter?: number): ApiError {
    return new ApiError({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message,
      retryable: true,
      retryAfter,
    });
  }

  /**
   * Serialize the error for API response output.
   */
  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
      retryable: this.retryable,
      ...(this.retryAfter !== undefined && { retryAfter: this.retryAfter }),
    };
  }
}
