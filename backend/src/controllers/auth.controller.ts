import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiError } from '../errors/api-error';
import { validatePassword } from '../middleware/validate.middleware';
import { getTokenPayload } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user account.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, full_name, phone } = req.body;
      const result = await authService.register({ email, password, full_name, phone });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate user with email and password.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const tokens = await authService.login(email, password);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken || typeof refreshToken !== 'string') {
        throw ApiError.badRequest('Refresh token is required');
      }

      const tokens = await authService.refreshToken(refreshToken);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request a password reset email.
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw ApiError.badRequest('Email is required');
      }

      const result = await authService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using a valid reset token.
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || typeof token !== 'string') {
        throw ApiError.badRequest('Reset token is required');
      }

      if (!newPassword) {
        throw ApiError.badRequest('New password is required');
      }

      // Validate new password
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        throw ApiError.badRequest('Password does not meet requirements', {
          field: 'newPassword',
          errors: passwordErrors,
        });
      }

      const result = await authService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Change password directly by verifying current password.
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, currentPassword, newPassword } = req.body;

      if (!email || !currentPassword || !newPassword) {
        throw ApiError.badRequest('Email, current password, and new password are required');
      }

      if (newPassword.length < 8) {
        throw ApiError.badRequest('New password must be at least 8 characters');
      }

      const result = await authService.changePassword(email, currentPassword, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Invalidate user session.
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      await authService.logout(payload.userId);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
