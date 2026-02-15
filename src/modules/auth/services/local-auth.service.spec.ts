import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { LocalAuthService } from './local-auth.service';
import { OAuthAuthService } from './oauth-auth.service';
import { EmailService } from './email.service';
import { TokenService } from './token.service';
import { AuditService } from './audit.service';
import { User } from '../../users/entities/user.entity';


describe('AuthService', () => {
  let service: AuthService;
  let localAuthService: jest.Mocked<LocalAuthService>;
  let oauthAuthService: jest.Mocked<OAuthAuthService>;
  let emailService: jest.Mocked<EmailService>;
  let tokenService: jest.Mocked<TokenService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    emailVerified: true,
    passwordHash: 'hashed',
    userRoles: [],
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: LocalAuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            validateUser: jest.fn(),
            getUserByEmail: jest.fn(),
            updatePassword: jest.fn(),
            changePassword: jest.fn(),
          },
        },
        {
          provide: OAuthAuthService,
          useValue: {
            loginOrRegister: jest.fn(),
            linkAccount: jest.fn(),
            unlinkAccount: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            generateEmailVerificationToken: jest.fn().mockResolvedValue('verify-token'),
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
            validatePasswordResetToken: jest.fn(),
            markPasswordResetTokenUsed: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
            resendVerificationEmail: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            issueAccessToken: jest.fn().mockReturnValue('access-token'),
            issueRefreshToken: jest.fn().mockResolvedValue({ refreshToken: 'refresh-token' }),
            revokeAllForUser: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    localAuthService = module.get(LocalAuthService);
    oauthAuthService = module.get(OAuthAuthService);
    emailService = module.get(EmailService);
    tokenService = module.get(TokenService);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user and send verification email', async () => {
      localAuthService.register.mockResolvedValue(mockUser);

      const result = await service.register(
        'test@example.com',
        'Password123!',
        'Test',
        'User',
      );

      expect(localAuthService.register).toHaveBeenCalledWith(
        'test@example.com',
        'Password123!',
        'Test',
        'User',
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(mockUser, 'verify-token');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      localAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await service.login('test@example.com', 'Password123!');

      expect(localAuthService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'Password123!',
      );
      expect(tokenService.issueAccessToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.issueRefreshToken).toHaveBeenCalledWith(mockUser, { singleDevice: true });
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

  });

  describe('logout', () => {
    it('should logout user', async () => {
      const result = await service.logout('user-1');

      expect(tokenService.revokeAllForUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      localAuthService.getUserByEmail.mockResolvedValue(unverifiedUser);
      emailService.generateEmailVerificationToken.mockResolvedValue('new-token');
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.resendVerificationEmail('test@example.com');

      expect(localAuthService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(emailService.generateEmailVerificationToken).toHaveBeenCalledWith(unverifiedUser);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(unverifiedUser, 'new-token');
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset', async () => {
      localAuthService.getUserByEmail.mockResolvedValue(mockUser);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await service.requestPasswordReset('test@example.com');

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetToken = 'valid-reset-token';

      emailService.validatePasswordResetToken.mockResolvedValue(mockUser);
      localAuthService.updatePassword.mockResolvedValue(undefined);
      emailService.markPasswordResetTokenUsed.mockResolvedValue(undefined);
      tokenService.revokeAllForUser.mockResolvedValue(undefined);

      const result = await service.resetPassword(
        resetToken,
        'NewPassword123!',
      );

      expect(emailService.validatePasswordResetToken)
        .toHaveBeenCalledWith(resetToken);

      expect(localAuthService.updatePassword)
        .toHaveBeenCalledWith(mockUser, 'NewPassword123!');

      expect(emailService.markPasswordResetTokenUsed)
        .toHaveBeenCalledWith(resetToken);

      expect(tokenService.revokeAllForUser)
        .toHaveBeenCalledWith(mockUser.id);

      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      localAuthService.changePassword.mockResolvedValue(undefined);

      await service.changePassword(mockUser, 'OldPassword123!', 'NewPassword123!');

      expect(localAuthService.changePassword).toHaveBeenCalledWith(
        mockUser,
        'OldPassword123!',
        'NewPassword123!',
      );
    });
  });


  describe('oauthLogin', () => {
    it('should login via OAuth', async () => {
      const oauthDto = { provider: 'GOOGLE' as any, providerId: 'google-id', email: 'test@example.com' };
      oauthAuthService.loginOrRegister.mockResolvedValue(mockUser);

      const result = await service.oauthLogin(oauthDto);

      expect(oauthAuthService.loginOrRegister).toHaveBeenCalledWith(oauthDto);
      expect(tokenService.issueAccessToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.issueRefreshToken).toHaveBeenCalledWith(mockUser, { singleDevice: true });
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });
  });

  describe('linkOAuth', () => {
    it('should link OAuth account', async () => {
      const oauthData = { provider: 'GOOGLE' as any, providerId: 'google-id' };
      oauthAuthService.linkAccount.mockResolvedValue({ success: true, message: 'Linked' });

      const result = await service.linkOAuth(mockUser, oauthData);

      expect(oauthAuthService.linkAccount).toHaveBeenCalledWith(mockUser, 'GOOGLE', oauthData);
      expect(result.success).toBe(true);
    });
  });

  describe('unlinkOAuth', () => {
    it('should unlink OAuth account', async () => {
      oauthAuthService.unlinkAccount.mockResolvedValue({ success: true, message: 'Unlinked' });

      const result = await service.unlinkOAuth(mockUser, 'GOOGLE' as any);

      expect(oauthAuthService.unlinkAccount).toHaveBeenCalledWith(mockUser, 'GOOGLE');
      expect(result.success).toBe(true);
    });
  });
});