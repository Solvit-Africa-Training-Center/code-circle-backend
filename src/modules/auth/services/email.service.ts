/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import { User } from '../../users/entities/user.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

@Injectable()
export class EmailService {
  /**
   * Send a generic email using the mailer service.
   * @param options - { to, subject, html, text }
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail(options);
      this.logger.log(
        `Email sent to ${options.to} with subject: ${options.subject}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
      throw new BadRequestException('Failed to send email');
    }
  }
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  private readonly EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000;
  private readonly PASSWORD_RESET_EXPIRY = 60 * 60 * 1000;
  protected hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly emailTokenRepo: Repository<EmailVerificationToken>,

    @InjectRepository(PasswordResetToken)
    private readonly passwordResetRepo: Repository<PasswordResetToken>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async generateEmailVerificationToken(user: User): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY);

    const emailToken = this.emailTokenRepo.create({
      user,
      tokenHash,
      expiresAt,
      used: false,
    });

    await this.emailTokenRepo.save(emailToken);

    this.logger.log(`Email verification token generated for user ${user.id}`);

    return rawToken;
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Circle-Code!</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
              Verify Email
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        `,
      });

      this.logger.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error.stack,
      );
      throw new BadRequestException('Failed to send verification email');
    }
  }

  async validateEmailVerificationToken(rawToken: string): Promise<User> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.emailTokenRepo.findOne({
      where: { tokenHash, used: false },
      relations: ['user'],
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    token.used = true;
    token.usedAt = new Date();
    await this.emailTokenRepo.save(token);

    const user = token.user;
    // user.emailVerified = true; // Field does not exist, remove or implement if needed
    await this.userRepo.save(user);

    this.logger.log(`Email verified for user ${user.id}`);

    return user;
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    // if (user.emailVerified)
    //   throw new BadRequestException('Email already verified');
    const token = await this.generateEmailVerificationToken(user);
    await this.sendVerificationEmail(user, token);
  }

  async generatePasswordResetToken(user: User): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.PASSWORD_RESET_EXPIRY);

    const resetToken = this.passwordResetRepo.create({
      user,
      tokenHash,
      expiresAt,
      used: false,
    });

    await this.passwordResetRepo.save(resetToken);

    this.logger.log(`Password reset token generated for user ${user.id}`);

    return rawToken;
  }

  async validatePasswordResetToken(rawToken: string): Promise<User> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.passwordResetRepo.findOne({
      where: { tokenHash, used: false },
      relations: ['user'],
    });

    if (!token) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }

    return token.user;
  }

  async markPasswordResetTokenUsed(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    const token = await this.passwordResetRepo.findOne({
      where: { tokenHash },
    });

    if (token) {
      token.used = true;
      token.usedAt = new Date();
      await this.passwordResetRepo.save(token);

      this.logger.log(`Password reset token marked as used`);
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 3600000);
    const resetToken = this.passwordResetRepo.create({
      tokenHash,
      user,
      expiresAt,
      used: false,
    });

    await this.passwordResetRepo.save(resetToken);

    const resetUrl = `${this.frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" 
              style="display: inline-block; padding: 12px 24px; background-color: #dc3545; 
                      color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,

        error.stack,
      );
      throw new BadRequestException('Failed to send password reset email');
    }
  }

  async verifyPasswordResetToken(rawToken: string): Promise<User> {
    return this.validatePasswordResetToken(rawToken);
  }
}
