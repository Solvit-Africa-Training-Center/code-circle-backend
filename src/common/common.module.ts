import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './services/cloudinary.service';
import { EmailService } from './services/email.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const smtpPort = Number(config.get<number>('SMTP_PORT', 587));
        const rawSecure = config.get<string>('SMTP_SECURE');
        const smtpSecure =
          typeof rawSecure === 'string'
            ? rawSecure.toLowerCase() === 'true'
            : smtpPort === 465;
        const smtpUser = config.get<string>('SMTP_USER');
        const smtpPass = config.get<string>('SMTP_PASS')?.replace(/\s+/g, '');
        const emailFrom =
          config.get<string>('EMAIL_FROM') || `"CodeCircle" <${smtpUser}>`;

        console.log('SMTP Configuration (CommonModule):');
        console.log('- Host:', config.get('SMTP_HOST'));
        console.log('- Port:', smtpPort);
        console.log('- User:', smtpUser);
        console.log('- Has Password:', !!smtpPass);
        console.log('- Secure:', smtpSecure);
        console.log('- From:', emailFrom);

        return {
          transport: {
            host: config.get<string>('SMTP_HOST'),
            port: smtpPort,
            secure: smtpSecure,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: emailFrom,
          },
        };
      },
    }),
  ],
  providers: [EmailService, CloudinaryService],
  exports: [EmailService, CloudinaryService],
})
export class CommonModule {}
