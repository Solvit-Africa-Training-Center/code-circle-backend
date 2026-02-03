import { Test, TestingModule } from '@nestjs/testing';
import { GithubStrategy } from './github.strategy';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from '../enums/auth-provider';
import { BadRequestException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

describe('GithubStrategy', () => {
  let strategy: GithubStrategy;
  const mockUser: User = { id: '123', email: 'test@github.com' } as any;

  const mockAuthService = {
    validateOAuthLogin: jest.fn().mockResolvedValue(mockUser),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => key + '_VALUE'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<GithubStrategy>(GithubStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return a user', async () => {
    const profile = {
      id: 'github123',
      emails: [{ value: 'test@github.com', primary: true }],
      displayName: 'Test User',
      username: 'testuser',
    };
    const user = await strategy.validate('access', 'refresh', profile);
    expect(user).toEqual(mockUser);
    expect(mockAuthService.validateOAuthLogin).toHaveBeenCalledWith({
      provider: AuthProvider.GITHUB,
      providerId: 'github123',
      email: 'test@github.com',
      firstName: 'Test User',
      lastName: '',
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  it('should throw if profile is invalid', async () => {
    await expect(strategy.validate('access', 'refresh', null)).rejects.toThrow(BadRequestException);
    await expect(strategy.validate('access', 'refresh', {})).rejects.toThrow(BadRequestException);
  });

  it('should throw if email is missing', async () => {
    const profile = { id: 'github123', emails: [] };
    await expect(strategy.validate('access', 'refresh', profile)).rejects.toThrow(BadRequestException);
  });
});