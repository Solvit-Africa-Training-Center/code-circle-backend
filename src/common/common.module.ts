import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { CloudinaryService } from './services/cloudinary.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Debug logging
        console.log('📧 SMTP Configuration (CommonModule):');
        console.log('- Host:', config.get('SMTP_HOST'));
        console.log('- Port:', config.get('SMTP_PORT'));
        console.log('- User:', config.get('SMTP_USER'));
        console.log('- Has Password:', !!config.get('SMTP_PASS'));
        console.log('- Secure:', config.get('SMTP_SECURE'));

        return {
          transport: {
            host: config.get<string>('SMTP_HOST'),
            port: Number(config.get<number>('SMTP_PORT')),
            secure: config.get<boolean>('SMTP_SECURE', true),
            auth: {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            },
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: config.get<string>(
              'EMAIL_FROM',
              '"CodeCircle" <stephanemugisho24@gmail.com>',
            ),
          },
        };
      },
    }),
  ],
  providers: [EmailService, CloudinaryService],
  exports: [EmailService, CloudinaryService],
})
export class CommonModule {}

