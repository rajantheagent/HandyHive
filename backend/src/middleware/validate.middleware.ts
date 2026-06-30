import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/api-error';
import { ValidationFieldError } from '../errors/validation-error';

/**
 * Password validation rules:
 * - 8-128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character from !@#$%^&*()-_+=
 */
export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return errors;
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    errors.push('Password must be at most 128 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 digit');
  }
  if (!/[!@#$%^&*()\-_+=]/.test(password)) {
    errors.push('Password must contain at least 1 special character (!@#$%^&*()-_+=)');
  }

  return errors;
}

/**
 * Validate email format.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian mobile number format.
 * Accepts: +91XXXXXXXXXX (10 digits after +91) or 10 digit number starting with 6-9
 */
export function validatePhone(phone: string): boolean {
  // +91 followed by 10 digits starting with 6-9
  const withCountryCode = /^\+91[6-9]\d{9}$/;
  // Just 10 digits starting with 6-9
  const withoutCode = /^[6-9]\d{9}$/;
  return withCountryCode.test(phone) || withoutCode.test(phone);
}

/**
 * Middleware to validate user registration input.
 */
export function validateRegisterInput(req: Request, _res: Response, next: NextFunction): void {
  const { email, password, full_name, phone } = req.body;
  const errors: ValidationFieldError[] = [];

  // Validate email
  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: 'Must be a valid email address', value: email });
  }

  // Validate password
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.push({ field: 'password', message: passwordErrors.join('. ') });
    }
  }

  // Validate full name (2-100 chars)
  if (!full_name) {
    errors.push({ field: 'full_name', message: 'Full name is required' });
  } else if (full_name.trim().length < 2) {
    errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters', value: full_name });
  } else if (full_name.trim().length > 100) {
    errors.push({ field: 'full_name', message: 'Full name must be at most 100 characters', value: full_name });
  }

  // Validate phone (optional, Indian mobile number)
  if (phone && !validatePhone(phone)) {
    errors.push({ field: 'phone', message: 'Enter valid Indian mobile number (e.g., +919876543210 or 9876543210)', value: phone });
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }

  next();
}

/**
 * Middleware to validate login input.
 */
export function validateLoginInput(req: Request, _res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  const errors: ValidationFieldError[] = [];

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }

  next();
}
