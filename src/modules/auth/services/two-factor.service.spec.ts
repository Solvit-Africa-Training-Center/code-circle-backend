import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TwoFactorSecret } from '../entities/two-factor-secret';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { authenticator } from '@otplib/preset-default';

jest.mock('@otplib/preset-default', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'MOCKSECRET'),
    keyuri: jest.fn((userEmail, appName, secret) => `otpauth://totp/${appName}?secret=${secret}`),
    check: jest.fn(() => true),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('mock-qr-code')),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('12345678')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'hashed-code'),
  })),
}));

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let twoFactorRepo: jest.Mocked<Repository<TwoFactorSecret>>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
  } as any;

  const mockSecret: TwoFactorSecret = {
    id: 'secret-1',
    userId: 'user-1',
    secret: 'MOCKSECRET',
    enabled: false,
    backupCodes: [],
    user: mockUser,
  } as any;

  const mockTwoFactorRepo: Partial<jest.Mocked<Repository<TwoFactorSecret>>> = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: getRepositoryToken(TwoFactorSecret),
          useValue: mockTwoFactorRepo,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => ({ APP_NAME: 'TestApp', BACKUP_CODE_COUNT: 8 }[key])),
          },
        },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    twoFactorRepo = module.get(getRepositoryToken(TwoFactorSecret)) as jest.Mocked<Repository<TwoFactorSecret>>;
    configService = module.get(ConfigService);

    twoFactorRepo.delete.mockResolvedValue({ raw: [], affected: 1 } as DeleteResult);
    twoFactorRepo.update.mockResolvedValue({} as any);
    twoFactorRepo.count.mockResolvedValue(0);
    twoFactorRepo.remove.mockResolvedValue(mockSecret as any);
    twoFactorRepo.save.mockResolvedValue(mockSecret as any);
    twoFactorRepo.create.mockReturnValue(mockSecret as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should generate 2FA secret and QR code', async () => {
      twoFactorRepo.findOne.mockResolvedValue(null);

      const result = await service.setup(mockUser);

      expect(authenticator.generateSecret).toHaveBeenCalled();
      expect(authenticator.keyuri).toHaveBeenCalledWith(mockUser.email, 'TestApp', 'MOCKSECRET');
      expect(QRCode.toDataURL).toHaveBeenCalledWith(`otpauth://totp/TestApp?secret=MOCKSECRET`);
      expect(result).toEqual({ secret: 'MOCKSECRET', qrCodeDataUrl: 'mock-qr-code' });
    });

    it('should replace existing setup if already exists', async () => {
      const existingSecret = { ...mockSecret, enabled: false };
      twoFactorRepo.findOne.mockResolvedValue(existingSecret as any);

      const result = await service.setup(mockUser);

      expect(twoFactorRepo.delete).toHaveBeenCalledWith({ user: { id: mockUser.id }, enabled: false });
      expect(result.secret).toBe('MOCKSECRET');
    });
  });

  describe('enable', () => {
    it('should enable 2FA with valid code and return backup codes', async () => {
      const setupSecret = { ...mockSecret, enabled: false };
      twoFactorRepo.findOne.mockResolvedValue(setupSecret as any);

      const result = await service.enable(mockUser, '123456');

      expect(setupSecret.enabled).toBe(true);
      expect(result.backupCodes).toHaveLength(8);
      expect(result.message).toContain('enabled');
      expect(authenticator.check).toHaveBeenCalledWith('123456', setupSecret.secret);
    });

    it('should throw BadRequestException if no setup found', async () => {
      twoFactorRepo.findOne.mockResolvedValue(null);
      await expect(service.enable(mockUser, '123456')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if code is invalid', async () => {
      const setupSecret = { ...mockSecret, enabled: false };
      twoFactorRepo.findOne.mockResolvedValue(setupSecret as any);
      (authenticator.check as jest.Mock).mockReturnValue(false);

      await expect(service.enable(mockUser, '000000')).rejects.toThrow(BadRequestException);
    });
  });

  describe('disable', () => {
    it('should disable 2FA with valid code', async () => {
      const enabledSecret = { ...mockSecret, enabled: true };
      twoFactorRepo.findOne.mockResolvedValue(enabledSecret as any);

      const result = await service.disable(mockUser, '123456');

      expect(twoFactorRepo.remove).toHaveBeenCalledWith(enabledSecret);
      expect(result.message).toContain('disabled');
    });

    it('should throw BadRequestException if 2FA not enabled', async () => {
      twoFactorRepo.findOne.mockResolvedValue(null);
      await expect(service.disable(mockUser, '123456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('isEnabled', () => {
    it('should return true if 2FA is enabled', async () => {
      twoFactorRepo.count.mockResolvedValue(1);
      const result = await service.isEnabled(mockUser);
      expect(result).toBe(true);
    });

    it('should return false if 2FA is not enabled', async () => {
      twoFactorRepo.count.mockResolvedValue(0);
      const result = await service.isEnabled(mockUser);
      expect(result).toBe(false);
    });
  });

  describe('getRemainingBackupCodesCount', () => {
    it('should return count of remaining backup codes', async () => {
      const enabledSecret = { ...mockSecret, enabled: true, backupCodes: ['1', '2'] };
      twoFactorRepo.findOne.mockResolvedValue(enabledSecret as any);
      const result = await service.getRemainingBackupCodesCount(mockUser);
      expect(result).toBe(2);
    });
  });
});
