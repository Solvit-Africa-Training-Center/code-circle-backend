import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { LocalAuthService } from './services/local-auth.service';
import { OAuthAuthService } from './services/oauth-auth.service';
import { TwoFactorService } from './services/two-factor.service';
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
    private readonly twoFactor: TwoFactorService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  async register(
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
    ): Promise<{ user: User; verificationToken: string }> {
      const user = await this.localAuth.register(email, password, firstName, lastName);
  
      const token = await this.emailService.generateEmailVerificationToken(user);
      await this.emailService.sendVerificationEmail(user, token);
  
      this.logger.log(`User registered: ${user.id} (${email})`);
  
      return { user, verificationToken: token };
    }
  
  async login(
    email: string,
    password: string,
    twoFactorCode?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.localAuth.validateUser(email, password);

    const has2FA = user.twoFactorSecrets?.some((t) => t.enabled);

    if (has2FA) {
      if (!twoFactorCode) {
        throw new BadRequestException('2FA code required');
      }

      const is2FAValid = await this.twoFactor.validateToken(user, twoFactorCode);
      if (!is2FAValid) {
        this.logger.warn(`Invalid 2FA code for user ${user.id}`);
        throw new BadRequestException('Invalid 2FA code');
      }
    }

    const accessToken = this.tokenService.issueAccessToken(user);
    const { refreshToken } = await this.tokenService.issueRefreshToken(user, {
      singleDevice: true,
    });

    this.logger.log(`User logged in: ${user.id} (${email})`);

    return { accessToken, refreshToken };
  }

  async validateOAuthLogin(oauthUser: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
  }) {
    return this.oauthAuth.loginOrRegister(oauthUser);
  }
  async oauthLogin(oauthUser: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.oauthAuth.loginOrRegister(oauthUser);

    const accessToken = this.tokenService.issueAccessToken(user);
    const { refreshToken } = await this.tokenService.issueRefreshToken(user, {
      singleDevice: true,
    });

    this.logger.log(
      `OAuth login: ${user.id} via ${oauthUser.provider}`,
    );

    return { accessToken, refreshToken };
  }
  

  async linkOAuth(
    user: User,
    oauthData: { provider: AuthProvider; providerId: string; email?: string },
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.oauthAuth.linkAccount(
      user,
      oauthData.provider,
      oauthData,
    );

    this.logger.log(
      `OAuth account linked: ${oauthData.provider} to user ${user.id}`,
    );

    return result;
  }

  async unlinkOAuth(
    user: User,
    provider: AuthProvider,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.oauthAuth.unlinkAccount(user, provider);

    this.logger.log(
      `OAuth account unlinked: ${provider} from user ${user.id}`,
    );

    return result;
  }

  async setup2FA(user: User): Promise<{
    secret: string;
    qrCodeDataUrl: string;
  }> {
    return this.twoFactor.setup(user);
  }

  async enableTwoFactor(
    user: User,
    code: string,
  ): Promise<{ message: string; backupCodes?: string[] }> {
    const result = await this.twoFactor.enable(user, code);

    this.logger.log(`2FA enabled for user ${user.id}`);

    return result;
  }

  async disableTwoFactor(
    user: User,
    code: string,
  ): Promise<{ message: string }> {
    const result = await this.twoFactor.disable(user, code);

    this.logger.log(`2FA disabled for user ${user.id}`);

    return result;
  }
  async verifyEmail(token: string): Promise<User> {
    const user = await this.emailService.validateEmailVerificationToken(token);

    this.logger.log(`Email verified for user ${user.id}`);

    return user;
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.localAuth.getUserByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const token = await this.emailService.generateEmailVerificationToken(user);
    await this.emailService.sendVerificationEmail(user, token);

    this.logger.log(`Verification email resent for user ${user.id}`);

    return { message: 'Verification email sent' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.localAuth.getUserByEmail(email);

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    await this.emailService.sendPasswordResetEmail(email);

    this.logger.log(`Password reset requested for user ${user.id}`);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.emailService.validatePasswordResetToken(token);

    await this.localAuth.updatePassword(user, newPassword);
    await this.emailService.markPasswordResetTokenUsed(token);

    await this.tokenService.revokeAllForUser(user.id);

    this.logger.log(`Password reset completed for user ${user.id}`);

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    user: User,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    await this.localAuth.changePassword(user, oldPassword, newPassword);

    this.logger.log(`Password changed for user ${user.id}`);

    return { message: 'Password changed successfully' };
  }
  async refreshTokens(
    rawToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.tokenService.refresh(rawToken);
  }

  async logout(userId: string, token?: string): Promise<void> {
    await this.tokenService.revokeAllForUser(userId); 
    if (token) {
      this.logger.log(`User logged out: ${userId}`);
      await this.tokenService.blacklistAccessToken(token); 
    }
  }

  async logoutDevice(rawToken: string): Promise<{ success: boolean }> {
    await this.tokenService.revokeToken(rawToken);

    this.logger.log(`Device logged out`);

    return { success: true };
  }

}