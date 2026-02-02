import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { TwoFactorSecret } from './entities/two-factor-secret';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { JwtModule } from '@nestjs/jwt';
import { LocalAuthService } from './services/local-auth.service';
import { OAuthAuthService } from './services/oauth-auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { EmailService } from './services/email.service';
import { TokenService } from './services/token.service';
import { TwoFactorGuard } from '@circle-backend/common/guards/two-factor.guard';
import { AuthLoggerMiddleware } from './middleware/auth-logger.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { ConfigService } from '@nestjs/config';

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
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalAuthService,
    OAuthAuthService,
    TwoFactorService,
    EmailService,
    TokenService,
    TwoFactorGuard
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthLoggerMiddleware, AuthMiddleware)
      .forRoutes('auth'); 
  }
}
