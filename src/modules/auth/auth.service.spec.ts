/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LocalAuthService } from './services/local-auth.service';
import { OAuthAuthService } from './services/oauth-auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { TokenService } from './services/token.service';
import { EmailService } from './services/email.service';
import { User } from '../users/entities/user.entity';
import { AuthProvider } from './enums/auth-provider';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: User = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    emailVerified: true,
    passwordHash: 'hashedpassword',
    twoFactorSecrets: [],
    userRoles: [],
    lastLoginAt: null,
  } as any;

  const mockLocalAuthService = {
    register: jest
      .fn()
      .mockImplementation((email, password, ...rest) =>
        Promise.resolve(mockUser),
      ),
    validateUser: jest.fn().mockResolvedValue(mockUser),
    getUserByEmail: jest.fn().mockResolvedValue(mockUser),
    updatePassword: jest.fn().mockResolvedValue(undefined),
  };

  const mockOAuthAuthService = {
    loginOrRegister: jest.fn().mockResolvedValue(mockUser),
    linkAccount: jest.fn().mockResolvedValue({ success: true }),
    unlinkAccount: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockTwoFactorService = {
    enable: jest
      .fn()
      .mockResolvedValue({ message: '2FA enabled successfully' }),
    disable: jest
      .fn()
      .mockResolvedValue({ message: '2FA disabled successfully' }),
    validateToken: jest.fn().mockResolvedValue(true),
  };

  const mockTokenService = {
    issueAccessToken: jest.fn().mockReturnValue('access123'),
    issueRefreshToken: jest
      .fn()
      .mockResolvedValue({ refreshToken: 'refresh123' }),
    revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn().mockResolvedValue({
      accessToken: 'access123',
      refreshToken: 'refresh123',
    }),
  };

  const mockEmailService = {
    generateEmailVerificationToken: jest.fn().mockResolvedValue('token123'),
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    generatePasswordResetToken: jest.fn().mockResolvedValue('reset-token'),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    validateEmailVerificationToken: jest.fn().mockResolvedValue(mockUser),
    validatePasswordResetToken: jest.fn().mockResolvedValue(mockUser),
    markPasswordResetTokenUsed: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: LocalAuthService, useValue: mockLocalAuthService },
        { provide: OAuthAuthService, useValue: mockOAuthAuthService },
        { provide: TwoFactorService, useValue: mockTwoFactorService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and send verification email', async () => {
      const result = await service.register('test@example.com', 'pass123');
      expect(result).toEqual({ user: mockUser, verificationToken: 'token123' });
      expect(mockLocalAuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'pass123',
        expect.anything(),
        expect.anything(),
      );
      expect(
        mockEmailService.generateEmailVerificationToken,
      ).toHaveBeenCalledWith(mockUser);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser,
        'token123',
      );
    });
  });

  describe('login', () => {
    it('should login a user without 2FA', async () => {
      mockUser.twoFactorSecrets = [];

      const result = await service.login('test@example.com', 'pass123');
      expect(result).toEqual({
        accessToken: 'access123',
        refreshToken: 'refresh123',
      });
      expect(mockLocalAuthService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'pass123',
      );
      expect(mockTwoFactorService.validateToken).not.toHaveBeenCalled();
    });

    it('should login a user with 2FA', async () => {
      mockUser.twoFactorSecrets = [
        {
          id: 'secret-1',
          userId: mockUser.id,
          secret: 'JBSWY3DPEHPK3PXP',
          enabled: true,
          backupCodes: [],
          user: mockUser,
        } as any,
      ];

      const result = await service.login(
        'test@example.com',
        'pass123',
        '123456',
      );
      expect(result).toEqual({
        accessToken: 'access123',
        refreshToken: 'refresh123',
      });
      expect(mockTwoFactorService.validateToken).toHaveBeenCalledWith(
        mockUser,
        '123456',
      );
    });

    it('should throw BadRequestException if 2FA code invalid', async () => {
      mockTwoFactorService.validateToken.mockResolvedValueOnce(false);
      mockUser.twoFactorSecrets = [
        {
          id: 'secret-1',
          userId: mockUser.id,
          secret: 'ABC123',
          enabled: true,
          backupCodes: [],
          user: mockUser,
        } as any,
      ];

      await expect(
        service.login('test@example.com', 'pass123', 'wrongcode'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('oauthLogin', () => {
    it('should login/register via OAuth', async () => {
      const oauthUser = {
        provider: AuthProvider.GITHUB,
        providerId: 'id123',
        email: 'test@example.com',
      };
      const result = await service.oauthLogin(oauthUser);
      expect(result).toEqual({
        accessToken: 'access123',
        refreshToken: 'refresh123',
      });
      expect(mockOAuthAuthService.loginOrRegister).toHaveBeenCalledWith(
        oauthUser,
      );
    });
  });

  describe('linkOAuth', () => {
    it('should link an OAuth account', async () => {
      const result = await service.linkOAuth(mockUser, {
        provider: AuthProvider.GITHUB,
        providerId: 'id123',
      });
      expect(result).toEqual({ success: true });
      expect(mockOAuthAuthService.linkAccount).toHaveBeenCalledWith(
        mockUser,
        AuthProvider.GITHUB,
        { provider: AuthProvider.GITHUB, providerId: 'id123' },
      );
    });
  });

  describe('unlinkOAuth', () => {
    it('should unlink an OAuth account', async () => {
      const result = await service.unlinkOAuth(mockUser, AuthProvider.GITHUB);
      expect(result).toEqual({ success: true });
      expect(mockOAuthAuthService.unlinkAccount).toHaveBeenCalledWith(
        mockUser,
        AuthProvider.GITHUB,
      );
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable 2FA', async () => {
      const result = await service.enableTwoFactor(mockUser, '123456');
      expect(result).toEqual({ message: '2FA enabled successfully' });
      expect(mockTwoFactorService.enable).toHaveBeenCalledWith(
        mockUser,
        '123456',
      );
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable 2FA', async () => {
      const result = await service.disableTwoFactor(mockUser, '123456');
      expect(result).toEqual({ message: '2FA disabled successfully' });
      expect(mockTwoFactorService.disable).toHaveBeenCalledWith(
        mockUser,
        '123456',
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset', async () => {
      const result = await service.requestPasswordReset('test@example.com');
      expect(result).toEqual({ message: 'Password reset email sent' });
      expect(mockLocalAuthService.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockEmailService.generatePasswordResetToken).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'reset-token',
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const result = await service.resetPassword('reset-token', 'newpass');
      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(mockLocalAuthService.updatePassword).toHaveBeenCalledWith(
        mockUser,
        'newpass',
      );
      expect(mockEmailService.markPasswordResetTokenUsed).toHaveBeenCalledWith(
        'reset-token',
      );
      expect(mockTokenService.revokeAllForUser).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const result = await service.verifyEmail('token123');
      expect(result).toEqual(mockUser);
      expect(
        mockEmailService.validateEmailVerificationToken,
      ).toHaveBeenCalledWith('token123');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens', async () => {
      const result = await service.refreshTokens('refresh123');
      expect(result).toEqual({
        accessToken: 'access123',
        refreshToken: 'refresh123',
      });
      expect(mockTokenService.refresh).toHaveBeenCalledWith('refresh123');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const result = await service.logout(mockUser.id);
      expect(result).toEqual({ success: true });
      expect(mockTokenService.revokeAllForUser).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
});
