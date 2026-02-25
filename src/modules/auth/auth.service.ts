import {
  Injectable,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { LocalAuthService } from './services/local-auth.service';
import { OAuthAuthService } from './services/oauth-auth.service';
import { EmailService } from './services/email.service';
import { TokenService } from './services/token.service';
import { AuthProvider } from './enums/auth-provider';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly localAuth: LocalAuthService,
    private readonly oauthAuth: OAuthAuthService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    role?: string,
  ): Promise<{
    userId: string;
    verificationToken: string;
    email: string;
  }> {
    try {
      const user = await this.localAuth.register(
        email,
        password,
        firstName,
        lastName,
        role,
      );
      const token =
        await this.emailService.generateEmailVerificationToken(user);

      try {
        await this.emailService.sendVerificationEmail(user, token);
      } catch (err) {
        this.logger.error(
          `Failed to send verification email for user ${user.id}`,
          err,
        );
      }

      return {
        userId: user.id,
        verificationToken: token,
        email: user.email,
      };
    } catch (err) {
      this.logger.error(`Registration failed for email ${email}`, err);
      throw err instanceof HttpException
        ? err
        : new BadRequestException('User registration failed');
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      return await this.localAuth.login(email, password);
    } catch (err) {
      this.logger.error(`Login failed for email ${email}`, err);
      throw err instanceof HttpException
        ? err
        : new BadRequestException('Login failed');
    }
  }

  // async verifyEmail(token: string): Promise<{
  //   userId: string;
  //   email: string;
  // }> {
  //   try {
  //     const user =
  //       await this.emailService.validateEmailVerificationToken(token);
  //     this.logger.log(`Email verified for user ${user.id}`);
  //     return {
  //       userId: user.id,
  //       email: user.email,
  //     };
  //   } catch (err) {
  //     this.logger.error('Email verification failed', err);
  //     throw new BadRequestException('Email verification failed');
  //   }
  // }

  async oauthLogin(oauthUser: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const user = await this.oauthAuth.loginOrRegister(oauthUser);
      const accessToken = this.tokenService.issueAccessToken(user);
      const { refreshToken } = await this.tokenService.issueRefreshToken(user, {
        singleDevice: true,
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (err) {
      this.logger.error('OAuth login failed', err);
      throw new BadRequestException('OAuth login failed');
    }
  }

  async refreshTokens(rawToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const { accessToken, refreshToken } =
        await this.tokenService.refresh(rawToken);
      return {
        accessToken,
        refreshToken,
      };
    } catch (err) {
      this.logger.error('Token refresh failed', err);
      throw new BadRequestException('Token refresh failed');
    }
  }


  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const user = await this.localAuth.getUserByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const token =
        await this.emailService.generateEmailVerificationToken(user);
      await this.emailService.sendVerificationEmail(user, token);
    } catch (err) {
      this.logger.error(`Resend verification failed for email ${email}`, err);
      throw err instanceof HttpException
        ? err
        : new BadRequestException('Resend verification failed');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.localAuth.getUserByEmail(email);
      if (user) {
        await this.emailService.sendPasswordResetEmail(email);
        this.logger.log(`Password reset requested for user ${user.id}`);
      } else {
        // Add delay to prevent timing attacks that reveal if email exists
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.logger.warn(
          `Password reset requested for non-existent email: ${email}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Password reset request failed for email ${email}`,
        err,
      );
      throw new BadRequestException('Password reset request failed');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const user = await this.emailService.validatePasswordResetToken(token);
      await this.localAuth.updatePassword(user, newPassword);
      await this.emailService.markPasswordResetTokenUsed(token);
      await this.tokenService.revokeAllForUser(user.id);
      this.logger.log(`Password reset successful for user ${user.id}`);
    } catch (err) {
      this.logger.error('Password reset failed', err);
      throw new BadRequestException('Password reset failed');
    }
  }

  async changePassword(
    user: User,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await this.localAuth.changePassword(user, oldPassword, newPassword);
      this.logger.log(`Password changed for user ${user.id}`);
    } catch (err) {
      this.logger.error(`Change password failed for user ${user.id}`, err);
      throw err instanceof HttpException
        ? err
        : new BadRequestException('Change password failed');
    }
  }

  async logout(userId: string, token?: string): Promise<void> {
    try {
      await this.tokenService.revokeAllForUser(userId);
      if (token) {
        await this.tokenService.blacklistAccessToken(token);
      }
      this.logger.log(`User logged out: ${userId}`);
    } catch (err) {
      this.logger.error(`Logout failed for user ${userId}`, err);
      throw new BadRequestException('Logout failed');
    }
  }


  async validateOAuthLogin(payload: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<User> {
    try {
      const user = await this.oauthAuth.loginOrRegister(payload);
      return user;
    } catch (err) {
      this.logger.error('OAuth validation failed', err);
      throw new BadRequestException('OAuth validation failed');
    }
  }

  async linkOAuth(
    user: User,
    oauthData: { provider: AuthProvider; providerId: string; email?: string },
  ): Promise<{ success: boolean }> {
    try {
      await this.oauthAuth.linkAccount(user, oauthData.provider, oauthData);
      return {
        success: true,
      };
    } catch (err) {
      this.logger.error(`Link OAuth failed for user ${user.id}`, err);
      throw new BadRequestException('Link OAuth failed');
    }
  }

  async unlinkOAuth(
    user: User,
    provider: AuthProvider,
  ): Promise<{ success: boolean }> {
    try {
      await this.oauthAuth.unlinkAccount(user, provider);
      return {
        success: true,
      };
    } catch (err) {
      this.logger.error(`Unlink OAuth failed for user ${user.id}`, err);
      throw new BadRequestException('Unlink OAuth failed');
    }
  }
}
