import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from '../enums/auth-provider';
import { BadRequestException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  const mockUser: User = { id: '123', email: 'test@google.com' } as any;

  const mockAuthService = {
    validateOAuthLogin: jest.fn().mockResolvedValue(mockUser),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => key + '_VALUE'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return a user', async () => {
    const profile = {
      id: 'google123',
      emails: [{ value: 'test@google.com' }],
      displayName: 'Test User',
      name: { givenName: 'Test', familyName: 'User' },
    };
    const user = await strategy.validate('access', 'refresh', profile);
    expect(user).toEqual(mockUser);
    expect(mockAuthService.validateOAuthLogin).toHaveBeenCalledWith({
      provider: AuthProvider.GOOGLE,
      providerId: 'google123',
      email: 'test@google.com',
      firstName: 'Test',
      lastName: 'User',
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  it('should throw if profile is invalid', async () => {
    await expect(strategy.validate('access', 'refresh', null)).rejects.toThrow(BadRequestException);
    await expect(strategy.validate('access', 'refresh', {})).rejects.toThrow(BadRequestException);
  });

  it('should throw if email is missing', async () => {
    const profile = { id: 'google123', emails: [] };
    await expect(strategy.validate('access', 'refresh', profile)).rejects.toThrow(BadRequestException);
  });
});