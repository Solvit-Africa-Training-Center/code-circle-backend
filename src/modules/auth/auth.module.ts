import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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

import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

import { LocalAuthService } from './services/local-auth.service';
import { OAuthAuthService } from './services/oauth-auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { EmailService } from './services/email.service';
import { TokenService } from './services/token.service';

import { TwoFactorGuard } from '@circle-backend/common/guards/two-factor.guard';

import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

import { AuthLoggerMiddleware } from './middleware/auth-logger.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { AuditService } from './services/audit.service';
import { AuditLog } from './entities/audit.entity';

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
      AuditLog
    ]),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: Number(config.get<number>('SMTP_PORT')),
          secure: false,
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: '"CodeCircle" <no-reply@codecircle.com>',
        },
      }),
    }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn =
          configService.get<string>('JWT_EXPIRES_IN') ?? '15m';

        return {
          secret:
            configService.get<string>('JWT_SECRET') ?? 'defaultsecret',
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
    TwoFactorGuard,
    GithubStrategy,
    GoogleStrategy,
    JwtStrategy,
    AuditService
  ],

  exports: [JwtModule, TwoFactorService, TypeOrmModule],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthLoggerMiddleware, AuthMiddleware)
      .forRoutes('auth');
  }
}