import { JwtStrategy, JwtPayload, CurrentUserPayload } from '../strategies/jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepo: Partial<Repository<User>>;
  let configService: Partial<ConfigService>;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('secret'),
    };
    strategy = new JwtStrategy(configService as any, userRepo as any);
  });

  it('should return user payload for active user', async () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      isActive: true,
      userRoles: [{ role: { name: 'ADMIN', scope: 'GLOBAL' } } as any],
    } as any;

    (userRepo.findOne as jest.Mock).mockResolvedValue(user);

    const payload: JwtPayload = { sub: '1' };
    const result: CurrentUserPayload = await strategy.validate(payload);

    expect(result.id).toBe('1');
    expect(result.email).toBe('test@example.com');
    expect(result.roles[0].name).toBe('ADMIN');
  });

  it('should throw UnauthorizedException if user not found', async () => {
    (userRepo.findOne as jest.Mock).mockResolvedValue(null);
    const payload: JwtPayload = { sub: '1' };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user inactive', async () => {
    const user: User = { id: '1', email: 'test@example.com', isActive: false, userRoles: [] } as any;
    (userRepo.findOne as jest.Mock).mockResolvedValue(user);

    await expect(strategy.validate({ sub: '1' })).rejects.toThrow(UnauthorizedException);
  });
});