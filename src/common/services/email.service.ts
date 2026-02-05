import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendUserCreatedEmail({ to, username, temporaryPassword, role }: { to: string; username: string; temporaryPassword: string; role: string }) {
    // Implement actual email sending logic here (e.g., using nodemailer)
    // For now, just log to console
    console.log(`Sending user creation email to ${to} with temp password: ${temporaryPassword}`);
    // Return true for success
    return true;
  }
}
