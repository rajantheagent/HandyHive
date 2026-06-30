import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { ApiError } from '../errors/api-error';
import { jwtService, AuthTokens } from './jwt.service';
import { redisService } from './redis.service';

const BCRYPT_ROUNDS = 10;

export interface RegisterUserDto {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user account.
   */
  async register(dto: RegisterUserDto): Promise<{ userId: string; message: string }> {
    // Check for duplicate email
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists', {
        field: 'email',
      });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create user — mark as verified immediately (no email verification needed)
    const user = this.userRepository.create({
      email: dto.email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: dto.full_name.trim(),
      phone: dto.phone || null,
      email_verified: true,
      role: 'user',
    });

    const savedUser = await this.userRepository.save(user);

    return {
      userId: savedUser.id,
      message: 'Registration successful! You can now sign in.',
    };
  }

  /**
   * Login with email and password.
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    const genericError = ApiError.unauthorized('Invalid email or password');

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw genericError;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw genericError;
    }

    // Generate tokens
    const tokens = jwtService.generateTokens(user.id, user.email, user.role);

    // Store session in Redis (graceful if Redis unavailable)
    await redisService.setSession(user.id, JSON.stringify({
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
    }));

    return tokens;
  }

  /**
   * Refresh an access token using a valid refresh token.
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = jwtService.verifyToken(refreshToken);

    if (!payload || payload.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    return jwtService.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Request a password reset.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const successMessage = { message: 'If an account with that email exists, a password reset link has been sent.' };

    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return successMessage;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 15);

    user.verification_token = resetToken;
    user.verification_token_expires = tokenExpiry;
    await this.userRepository.save(user);

    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);

    return successMessage;
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { verification_token: token },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    if (user.verification_token_expires && user.verification_token_expires < new Date()) {
      throw ApiError.badRequest('Reset token has expired.');
    }

    user.password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.verification_token = null;
    user.verification_token_expires = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully.' };
  }

  /**
   * Change password directly (verify current password, set new one).
   */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or current password');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid email or current password');
    }

    user.password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully!' };
  }

  /**
   * Logout.
   */
  async logout(userId: string): Promise<void> {
    await redisService.deleteSession(userId);
  }
}

export const authService = new AuthService();
