import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

import ms from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuthCallbackController } from './oauth.controller';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { TwoFactorSecret } from './entities/two-factor-secret';
import { UserPermission } from './entities/user-permission.entity';

import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';

import { LocalAuthService } from './services/local-auth.service';
import { OAuthAuthService } from './services/oauth-auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { EmailService } from './services/email.service';
import { TokenService } from './services/token.service';
import { PermissionResolverService } from './services/permission-resolver.service';

import { TwoFactorGuard } from '@circle-backend/common/guards/two-factor.guard';

import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { AuthLoggerMiddleware } from './middleware/auth-logger.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { AuditService } from './services/audit.service';
import { AuditLog } from './entities/audit.entity';
import { RevokedToken } from './entities/revoke-token';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      EmailVerificationToken,
      PasswordResetToken,
      OAuthAccount,
      TwoFactorSecret,
      Role,
      UserRole,
      RolePermission,
      UserPermission,
      UserPermission,
      AuditLog,
      RevokedToken,
    ]),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Debug logging
        console.log('📧 SMTP Configuration:');
        console.log('- Host:', config.get('SMTP_HOST'));
        console.log('- Port:', config.get('SMTP_PORT'));
        console.log('- User:', config.get('SMTP_USER'));
        console.log('- Has Password:', !!config.get('SMTP_PASS'));
        console.log('- Secure:', config.get('SMTP_SECURE'));

        return {
          transport: {
            host: config.get<string>('SMTP_HOST'),
            port: Number(config.get<number>('SMTP_PORT')),
            secure: config.get<boolean>('SMTP_SECURE', true), // ← Utilisez SMTP_SECURE
            auth: {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            },
            // Options pour Gmail
            tls: {
              rejectUnauthorized: false, // Important pour éviter les erreurs de certificat
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

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '15m';

        return {
          secret: configService.get<string>('JWT_SECRET') ?? 'defaultsecret',
          signOptions: {
            expiresIn: expiresIn as unknown as Parameters<typeof ms>[0],
          },
        };
      },
    }),
  ],

  controllers: [AuthController, OAuthCallbackController],

  providers: [
    AuthService,
    LocalAuthService,
    OAuthAuthService,
    TwoFactorService,
    EmailService,
    TokenService,
    PermissionResolverService,
    TwoFactorGuard,
    JwtAuthGuard,
    GithubStrategy,
    GoogleStrategy,
    JwtStrategy,
    AuditService,
  ],

  exports: [
    JwtModule,
    TwoFactorService,
    TypeOrmModule,
    AuthService,
    EmailService,
    PermissionResolverService,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthLoggerMiddleware, AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'auth/verify-email', method: RequestMethod.GET },
        { path: 'auth/resend-verification', method: RequestMethod.POST },
        { path: 'auth/forgot-password', method: RequestMethod.POST },
        { path: 'auth/reset-password', method: RequestMethod.POST },
        { path: 'auth/oauth/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('auth');
  }
}
