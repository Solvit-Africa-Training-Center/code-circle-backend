jest.mock('otplib', () => ({
  authenticator: {
    generate: jest.fn().mockReturnValue('123456'),
    verify: jest.fn().mockReturnValue(true),
  },
}));
import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorGuard } from './two-factor.guard';
import { TwoFactorService } from '@circle-backend/modules/auth/services/two-factor.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '@circle-backend/modules/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('TwoFactorGuard', () => {
  let guard: TwoFactorGuard;
  let twoFactorService: jest.Mocked<TwoFactorService>;
  let jwtService: jest.Mocked<JwtService>;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorGuard,
        {
          provide: TwoFactorService,
          useValue: {
            validateToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<TwoFactorGuard>(TwoFactorGuard);
    twoFactorService = module.get(TwoFactorService);
    jwtService = module.get(JwtService);
    userRepo = module.get(getRepositoryToken(User));
  });

  const createMockContext = (user?: any, headers?: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        headers: headers || {},
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as any);

  describe('canActivate', () => {
    it('should allow access if 2FA is not enabled', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockResolvedValue({ id: 'user-1', twoFactorSecrets: [] } as any);

      const context = createMockContext(
        { user: { id: 'user-1' } },
        { authorization: 'Bearer fake-token' } 
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access if 2FA is enabled and verified', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        twoFactorSecrets: [{ enabled: true }],
      } as any);
      twoFactorService.validateToken.mockResolvedValue(true);

      const context = createMockContext(
        {},
        { authorization: 'Bearer token', 'x-2fa-token': '123456' },
      );
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access if 2FA is enabled but not verified', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        twoFactorSecrets: [{ enabled: true }],
      } as any);
      twoFactorService.validateToken.mockResolvedValue(false);

      const context = createMockContext(
        {},
        { authorization: 'Bearer token', 'x-2fa-token': 'wrong-token' },
      );
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access if 2FA is enabled and verification status is undefined', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        twoFactorSecrets: [{ enabled: true }],
      } as any);
      twoFactorService.validateToken.mockResolvedValue(false);

      const context = createMockContext({}, { authorization: 'Bearer token' });
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should throw error if user is not in request', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockResolvedValue(null);

      const context = createMockContext({}, { authorization: 'Bearer token' });
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle service errors gracefully', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockRejectedValue(new Error('Database error'));

      const context = createMockContext({}, { authorization: 'Bearer token' });
      await expect(guard.canActivate(context)).rejects.toThrow('Database error');
    });
  });

  describe('twoFactorVerified flag', () => {
    it('should respect twoFactorVerified: true from JWT', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        twoFactorSecrets: [{ enabled: true }],
      } as any);
      twoFactorService.validateToken.mockResolvedValue(true);

      const context = createMockContext(
        { twoFactorVerified: true },
        { authorization: 'Bearer token', 'x-2fa-token': '123456' },
      );
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access for twoFactorVerified: false even if 2FA enabled', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com' });
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        twoFactorSecrets: [{ enabled: true }],
      } as any);
      twoFactorService.validateToken.mockResolvedValue(false);

      const context = createMockContext(
        { twoFactorVerified: false },
        { authorization: 'Bearer token', 'x-2fa-token': 'wrong-token' },
      );
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });
});