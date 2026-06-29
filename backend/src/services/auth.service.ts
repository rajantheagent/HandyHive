import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { ApiError } from '../errors/api-error';
import { emailService } from './email.service';
import { jwtService, AuthTokens } from './jwt.service';
import { redisService } from './redis.service';

const BCRYPT_ROUNDS = 10;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 15;

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
   * - Validates no duplicate email exists
   * - Hashes password with bcrypt (unique salt per account)
   * - Creates user with email_verified = false
   * - Generates single-use verification token
   * - Sends verification email
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

    // Hash password with bcrypt (unique salt generated automatically)
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Generate single-use verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: dto.full_name.trim(),
      phone: dto.phone || null,
      email_verified: false,
      verification_token: verificationToken,
      verification_token_expires: tokenExpiry,
      role: 'user',
    });

    const savedUser = await this.userRepository.save(user);

    // Send verification email (async, don't block response)
    emailService.sendVerificationEmail(savedUser.email, verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    return {
      userId: savedUser.id,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Verify user email using a single-use token.
   * Token is deleted after successful verification.
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { verification_token: token },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }

    // Check token expiry
    if (user.verification_token_expires && user.verification_token_expires < new Date()) {
      throw ApiError.badRequest('Verification token has expired. Please request a new one.');
    }

    // Mark email as verified and remove token (single-use)
    user.email_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully.' };
  }

  /**
   * Login with email and password.
   * Returns generic error message on failure (no field disclosure).
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    // Generic error - don't reveal which field is wrong
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

    // Store session in Redis
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

    // Verify user still exists and session is active
    const session = await redisService.getSession(payload.userId);
    if (!session) {
      throw ApiError.unauthorized('Session expired. Please login again.');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Generate new tokens
    return jwtService.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Login or register via OAuth (Google/Facebook).
   */
  async loginOAuth(provider: 'google' | 'facebook', profile: {
    id: string;
    email: string;
    displayName: string;
  }): Promise<AuthTokens> {
    let user = await this.userRepository.findOne({
      where: { email: profile.email.toLowerCase().trim() },
    });

    if (!user) {
      // Create new user from OAuth profile
      user = this.userRepository.create({
        email: profile.email.toLowerCase().trim(),
        password_hash: '', // OAuth users don't have a password
        full_name: profile.displayName,
        email_verified: true, // OAuth emails are pre-verified
        oauth_provider: provider,
        oauth_id: profile.id,
        role: 'user',
      });
      user = await this.userRepository.save(user);
    } else if (!user.oauth_provider) {
      // Link OAuth to existing account
      user.oauth_provider = provider;
      user.oauth_id = profile.id;
      user.email_verified = true;
      await this.userRepository.save(user);
    }

    const tokens = jwtService.generateTokens(user.id, user.email, user.role);

    await redisService.setSession(user.id, JSON.stringify({
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
    }));

    return tokens;
  }

  /**
   * Request a password reset. Sends email with single-use link valid 15 minutes.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success message (don't reveal if email exists)
    const successMessage = { message: 'If an account with that email exists, a password reset link has been sent.' };

    if (!user) {
      return successMessage;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES);

    user.verification_token = resetToken;
    user.verification_token_expires = tokenExpiry;
    await this.userRepository.save(user);

    // Send reset email
    emailService.sendPasswordResetEmail(user.email, resetToken).catch((err) => {
      console.error('Failed to send password reset email:', err);
    });

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
      throw ApiError.badRequest('Reset token has expired. Please request a new one.');
    }

    // Hash new password and clear token
    user.password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.verification_token = null;
    user.verification_token_expires = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully.' };
  }

  /**
   * Logout - invalidate session.
   */
  async logout(userId: string): Promise<void> {
    await redisService.deleteSession(userId);
  }
}


export const authService = new AuthService();
