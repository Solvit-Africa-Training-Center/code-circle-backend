import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TwoFactorSecret } from '../entities/two-factor-secret';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(),
    keyuri: jest.fn(),
    check: jest.fn(),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(),
}));

const { authenticator } = require('otplib');
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let twoFactorSecretRepo: jest.Mocked<Repository<TwoFactorSecret>>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
  } as any;

  const mockSecret: TwoFactorSecret = {
    id: 'secret-1',
    userId: 'user-1',
    secret: 'JBSWY3DPEHPK3PXP',
    enabled: false,
    backupCodes: [],
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: getRepositoryToken(TwoFactorSecret),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                APP_NAME: 'TestApp',
                BACKUP_CODE_COUNT: 8,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    twoFactorSecretRepo = module.get(getRepositoryToken(TwoFactorSecret));
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should generate 2FA secret and QR code', async () => {
      (authenticator.generateSecret as jest.Mock).mockReturnValue('JBSWY3DPEHPK3PXP');
      (authenticator.keyuri as jest.Mock).mockReturnValue(
        'otpauth://totp/TestApp:test@example.com?secret=JBSWY3DPEHPK3PXP'
      );
      (qrcode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,...');

      twoFactorSecretRepo.delete.mockResolvedValue({ affected: 0 } as any);
      twoFactorSecretRepo.create.mockReturnValue(mockSecret as any);
      twoFactorSecretRepo.save.mockResolvedValue(mockSecret as any);

      const result = await service.setup(mockUser);

      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(authenticator.keyuri).toHaveBeenCalledWith(
        mockUser.email,
        'TestApp',
        'JBSWY3DPEHPK3PXP'
      );
      expect(qrcode.toDataURL).toHaveBeenCalled();
      expect(twoFactorSecretRepo.delete).toHaveBeenCalledWith({
        user: { id: mockUser.id },
        enabled: false,
      });
      expect(result).toEqual({
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeDataUrl: 'data:image/png;base64,...',
      });
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation();

      (authenticator.generateSecret as jest.Mock).mockImplementation(() => {
        throw new Error('Generation failed');
      });

      await expect(service.setup(mockUser)).rejects.toThrow(
        InternalServerErrorException
      );

      loggerSpy.mockRestore();
    });
  });

  describe('enable', () => {
    it('should enable 2FA with valid code and return backup codes', async () => {
      const setupSecret = { ...mockSecret, enabled: false };
      twoFactorSecretRepo.findOne.mockResolvedValue(setupSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(true);

      let callCount = 0;
      const codes = ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5', 'CODE6', 'CODE7', 'CODE8'];
      
      (mockCrypto.randomBytes as jest.Mock).mockImplementation(() => ({
        toString: () => codes[callCount++],
      }));

      (mockCrypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-code'),
      });

      twoFactorSecretRepo.update.mockResolvedValue({ affected: 1 } as any);
      twoFactorSecretRepo.save.mockResolvedValue(setupSecret as any);

      const result = await service.enable(mockUser, '123456');

      expect(authenticator.check).toHaveBeenCalledWith('123456', setupSecret.secret);
      expect(setupSecret.enabled).toBe(true);
      expect(result.backupCodes).toHaveLength(8);
      expect(result.message).toContain('enabled');
    });

    it('should throw BadRequestException if no setup found', async () => {
      twoFactorSecretRepo.findOne.mockResolvedValue(null);

      await expect(service.enable(mockUser, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if code is invalid', async () => {
      const setupSecret = { ...mockSecret, enabled: false };
      twoFactorSecretRepo.findOne.mockResolvedValue(setupSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(false);

      await expect(service.enable(mockUser, '000000')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('disable', () => {
    it('should disable 2FA with valid code', async () => {
      const enabledSecret = { ...mockSecret, enabled: true };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(true);
      twoFactorSecretRepo.remove.mockResolvedValue(enabledSecret as any);

      const result = await service.disable(mockUser, '123456');

      expect(twoFactorSecretRepo.remove).toHaveBeenCalledWith(enabledSecret);
      expect(result.message).toContain('disabled');
    });

    it('should disable 2FA with valid backup code', async () => {
      (mockCrypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-backup-code'),
      });

      const enabledSecret = {
        ...mockSecret,
        enabled: true,
        backupCodes: ['hashed-backup-code', 'other-code'],
      };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(false);
      twoFactorSecretRepo.save.mockResolvedValue(enabledSecret as any);
      twoFactorSecretRepo.remove.mockResolvedValue(enabledSecret as any);

      const result = await service.disable(mockUser, 'BACKUPCODE123');

      expect(twoFactorSecretRepo.remove).toHaveBeenCalled();
      expect(result.message).toContain('disabled');
    });

    it('should throw BadRequestException if 2FA not enabled', async () => {
      twoFactorSecretRepo.findOne.mockResolvedValue(null);

      await expect(service.disable(mockUser, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if code is invalid', async () => {
      const enabledSecret = { ...mockSecret, enabled: true, backupCodes: [] };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(false);

      await expect(service.disable(mockUser, '000000')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateToken', () => {
    it('should validate correct TOTP code', async () => {
      const enabledSecret = { ...mockSecret, enabled: true };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(true);

      const result = await service.validateToken(mockUser, '123456');

      expect(result).toBe(true);
    });

    it('should validate correct backup code', async () => {
      (mockCrypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-backup-code'),
      });

      const enabledSecret = {
        ...mockSecret,
        enabled: true,
        backupCodes: ['hashed-backup-code', 'other-code'],
      };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(false);
      twoFactorSecretRepo.save.mockResolvedValue(enabledSecret as any);

      const result = await service.validateToken(mockUser, 'BACKUPCODE123');

      expect(result).toBe(true);
      expect(enabledSecret.backupCodes).toEqual(['other-code']);
      expect(twoFactorSecretRepo.save).toHaveBeenCalled();
    });

    it('should return false for invalid code', async () => {
      const enabledSecret = { ...mockSecret, enabled: true, backupCodes: [] };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(false);

      const result = await service.validateToken(mockUser, '000000');

      expect(result).toBe(false);
    });

    it('should return true if 2FA not enabled', async () => {
      twoFactorSecretRepo.findOne.mockResolvedValue(null);

      const result = await service.validateToken(mockUser, '123456');

      expect(result).toBe(true);
    });

    it('should warn when only 2 backup codes remain', async () => {
      (mockCrypto.createHash as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-code'),
      });

      const enabledSecret = {
        ...mockSecret,
        enabled: true,
        backupCodes: ['hashed-code', 'code2', 'code3'],
      };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(false);
      twoFactorSecretRepo.save.mockResolvedValue(enabledSecret as any);

      const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

      await service.validateToken(mockUser, 'BACKUP123');

      expect(loggerWarnSpy).toHaveBeenCalled();

      loggerWarnSpy.mockRestore();
    });
  });

  describe('isEnabled', () => {
    it('should return true if 2FA is enabled', async () => {
      twoFactorSecretRepo.count.mockResolvedValue(1);

      const result = await service.isEnabled(mockUser);

      expect(twoFactorSecretRepo.count).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, enabled: true },
      });
      expect(result).toBe(true);
    });

    it('should return false if 2FA is not enabled', async () => {
      twoFactorSecretRepo.count.mockResolvedValue(0);

      const result = await service.isEnabled(mockUser);

      expect(result).toBe(false);
    });
  });

  describe('getRemainingBackupCodesCount', () => {
    it('should return count of remaining backup codes', async () => {
      const enabledSecret = {
        ...mockSecret,
        enabled: true,
        backupCodes: ['code1', 'code2', 'code3'],
      };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);

      const result = await service.getRemainingBackupCodesCount(mockUser);

      expect(result).toBe(3);
    });

    it('should return 0 if 2FA not enabled', async () => {
      twoFactorSecretRepo.findOne.mockResolvedValue(null);

      const result = await service.getRemainingBackupCodesCount(mockUser);

      expect(result).toBe(0);
    });
  });

  describe('getActiveSecret', () => {
    it('should return active secret', async () => {
      const enabledSecret = { ...mockSecret, enabled: true };
      twoFactorSecretRepo.findOne.mockResolvedValue(enabledSecret as any);

      const result = await service.getActiveSecret(mockUser);

      expect(result).toEqual(enabledSecret);
      expect(twoFactorSecretRepo.findOne).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, enabled: true },
      });
    });

    it('should return null if no active secret', async () => {
      twoFactorSecretRepo.findOne.mockResolvedValue(null);

      const result = await service.getActiveSecret(mockUser);

      expect(result).toBeNull();
    });
  });
});