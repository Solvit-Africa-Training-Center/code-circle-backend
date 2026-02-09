import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthToken } from '../entities/auth-token.entity';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'raw-token' }),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed-token'),
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let authTokenRepo: jest.Mocked<Repository<AuthToken>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let configService: jest.Mocked<ConfigService>;
  let mailerService: jest.Mocked<MailerService>;

  let mockUser: User;
  let mockVerificationToken: AuthToken;

  beforeEach(async () => {
    mockUser = { id: 'user-1', email: 'test@example.com', isActive: true } as any;
    mockVerificationToken = {
      id: 'token-1',
      user: mockUser,
      type: 'email_verification' as any,
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 86400000),
      used: false,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getRepositoryToken(AuthToken),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn().mockImplementation(async (token) => Object.assign(mockVerificationToken, token)),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn().mockImplementation(async (user) => Object.assign(mockUser, user)),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'http://localhost:3000') },
        },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(EmailService);
    authTokenRepo = module.get(getRepositoryToken(AuthToken));
    userRepo = module.get(getRepositoryToken(User));
    configService = module.get(ConfigService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email after generating token', async () => {
      authTokenRepo.create.mockReturnValue(mockVerificationToken as any);
      authTokenRepo.save.mockResolvedValue(mockVerificationToken as any);

      const token = await service.generateEmailVerificationToken(mockUser);
      expect(token).toBe('raw-token');

      await expect(service.sendVerificationEmail(mockUser, token)).resolves.toBeUndefined();
      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('validateEmailVerificationToken', () => {
    it('should validate token and mark token as used', async () => {
      authTokenRepo.findOne.mockResolvedValue({ ...mockVerificationToken, user: mockUser } as any);

      const result = await service.validateEmailVerificationToken('raw-token');

      expect(mockVerificationToken.used).toBe(true);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if token invalid', async () => {
      authTokenRepo.findOne.mockResolvedValue(null);
      await expect(service.validateEmailVerificationToken('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should generate new token and send email', async () => {
      const newToken = 'new-token';
      userRepo.findOne.mockResolvedValue(mockUser);
      authTokenRepo.create.mockReturnValue(mockVerificationToken as any);
      authTokenRepo.save.mockResolvedValue(mockVerificationToken as any);

      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => newToken });

      await expect(service.resendVerificationEmail(mockUser.email)).resolves.toBeUndefined();
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(mailerService.sendMail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.resendVerificationEmail('unknown@example.com')).rejects.toThrow(NotFoundException);
    });

    // Note: Email verification status check removed - User entity doesn't have emailVerified field
    // If you need this functionality, add emailVerified field to User entity first
  });

  describe('sendPasswordResetEmail', () => {
    it('should generate reset token and send email', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const mockResetToken = {
        id: 'reset-1',
        type: 'password_reset' as any,
        tokenHash: 'hashed-reset-token',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        user: mockUser,
      };

      authTokenRepo.create.mockReturnValue(mockResetToken as any);
      authTokenRepo.save.mockResolvedValue(mockResetToken as any);

      await expect(service.sendPasswordResetEmail(mockUser.email)).resolves.toBeUndefined();

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(authTokenRepo.create).toHaveBeenCalled();
      expect(authTokenRepo.save).toHaveBeenCalled();
      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should validate reset token and return user', async () => {
      const mockResetToken = {
        id: 'reset-1',
        type: 'password_reset' as any,
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
        user: mockUser,
      };

      authTokenRepo.findOne.mockResolvedValue(mockResetToken as any);

      const result = await service.validatePasswordResetToken('reset-token');
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if token expired', async () => {
      const expiredToken = {
        id: 'reset-1',
        type: 'password_reset' as any,
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() - 1000),
        used: false,
        user: mockUser,
      };

      authTokenRepo.findOne.mockResolvedValue(expiredToken as any);

      await expect(service.validatePasswordResetToken('token')).rejects.toThrow(BadRequestException);
    });
  });
});
