import { ApiError } from './api-error';

/**
 * Represents a single field validation error.
 */
export interface ValidationFieldError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Formats an array of field-specific validation errors into a structured ApiError.
 *
 * @param errors - Array of field validation errors
 * @returns ApiError with status 400 and field-specific details
 *
 * @example
 * ```ts
 * throw formatValidationErrors([
 *   { field: 'email', message: 'Must be a valid email address', value: 'not-an-email' },
 *   { field: 'password', message: 'Must be at least 8 characters' },
 * ]);
 * ```
 */
export function formatValidationErrors(errors: ValidationFieldError[]): ApiError {
  return ApiError.badRequest('Validation failed', errors);
}
