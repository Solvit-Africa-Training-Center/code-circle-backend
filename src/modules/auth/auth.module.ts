import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';

import ms from 'ms';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuthCallbackController } from './oauth.controller';

import { User } from '../users/entities/user.entity';
import { AuthToken } from './entities/auth-token.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { UserPermission } from './entities/user-permission.entity';

import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { RolePermission } from './entities/role-permission.entity';

import { LocalAuthService } from './services/local-auth.service';
import { OAuthAuthService } from './services/oauth-auth.service';
import { EmailService } from './services/email.service';
import { TokenService } from './services/token.service';
import { PermissionResolverService } from './services/permission-resolver.service';


import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { AuthLoggerMiddleware } from './middleware/auth-logger.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { AuditService } from './services/audit.service';
import { AuditLog } from './entities/audit.entity';

@Module({
  imports: [
    CommonModule, // Import CommonModule to access MailerService (MailerModule is configured there)
    TypeOrmModule.forFeature([
      User,
      AuthToken, // Consolidated token entity
      OAuthAccount,
      Role,
      UserRole,
      RolePermission,
      UserPermission,
      AuditLog,
    ]),
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
    EmailService,
    TokenService,
    PermissionResolverService,
    JwtAuthGuard,
    GithubStrategy,
    GoogleStrategy,
    JwtStrategy,
    AuditService,
  ],

  exports: [
    JwtModule,
    TypeOrmModule,
    AuthService,
    EmailService,
    PermissionResolverService,
    TokenService,
    JwtAuthGuard,
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
