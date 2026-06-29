import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

export class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      if (config.nodeEnv === 'development' || !config.email.sendgridApiKey) {
        // In development, use a fake transporter that logs to console
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      } else {
        // Production: use SendGrid SMTP transport
        this.transporter = nodemailer.createTransport({
          host: config.email.smtpHost,
          port: config.email.smtpPort,
          secure: false,
          auth: {
            user: config.email.smtpUser,
            pass: config.email.sendgridApiKey,
          },
        });
      }
    }
    return this.transporter;
  }

  /**
   * Send email verification link to new user.
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.appUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Verify your email - HandyHive',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #000;">Welcome to HandyHive!</h1>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #06C167; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #666; font-size: 14px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 12px;">
            This link expires in 24 hours.
          </p>
        </div>
      `,
    };

    if (config.nodeEnv === 'development') {
      console.log('\n📧 [DEV] Verification email:');
      console.log(`   To: ${email}`);
      console.log(`   URL: ${verificationUrl}\n`);
    }

    await this.getTransporter().sendMail(mailOptions);
  }

  /**
   * Send password reset link to user.
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.appUrl}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Reset your password - HandyHive',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #000;">Password Reset</h1>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #06C167; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            This link is valid for 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    if (config.nodeEnv === 'development') {
      console.log('\n📧 [DEV] Password reset email:');
      console.log(`   To: ${email}`);
      console.log(`   URL: ${resetUrl}\n`);
    }

    await this.getTransporter().sendMail(mailOptions);
  }

  /**
   * Send rate limit block notification to account owner.
   */
  async sendRateLimitNotification(email: string): Promise<void> {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Security Alert - HandyHive',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #000;">Security Alert</h1>
          <p>We detected multiple failed login attempts for your account. Your account has been temporarily locked for 30 minutes.</p>
          <p>If this was you, please wait and try again later. If not, we recommend changing your password immediately.</p>
        </div>
      `,
    };

    if (config.nodeEnv === 'development') {
      console.log('\n📧 [DEV] Rate limit notification:');
      console.log(`   To: ${email}\n`);
    }

    await this.getTransporter().sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
