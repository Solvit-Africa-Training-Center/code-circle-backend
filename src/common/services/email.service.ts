import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}
  /**
   * Send a generic email using the mailer service.
   * @param options 
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

  /**
   * Send user creation email with credentials
   * @param options 
   */
  async sendUserCreatedEmail({
    to,
    username,
    temporaryPassword,
    role,
  }: {
    to: string;
    username: string;
    temporaryPassword: string;
    role: string;
  }): Promise<void> {
    const roleDisplayName =
      role === 'CREATOR'
        ? 'Creator'
        : role === 'MEMBER'
          ? 'Member'
          : role === 'ADMIN'
            ? 'Administrator'
            : role;

    await this.sendEmail({
      to,
      subject: `🎉 Welcome to CodeCircle - Your ${roleDisplayName} Account`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 Welcome to CodeCircle!</h2>
          <p>Dear ${username},</p>
          <p>Your ${roleDisplayName} account has been created successfully.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${temporaryPassword}</p>
          </div>
          <p style="color: #d32f2f;"><strong>Important:</strong> Please log in and change your password immediately.</p>
          <p>Welcome aboard!</p>
        </div>
      `,
    });
  }
}
