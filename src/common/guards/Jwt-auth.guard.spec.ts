import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockTokenService: any;

  // Mock execution context helper
  const mockExecutionContext = (token?: string, user?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: token ? { authorization: `Bearer ${token}` } : {},
          user,
        }),
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({ getContext: () => null, getData: () => null }),
      switchToWs: () => ({ getClient: () => null, getData: () => null }),
      getType: () => 'http',
    } as unknown as ExecutionContext);

  beforeEach(() => {
    mockTokenService = {
      isBlacklisted: jest.fn().mockResolvedValue(false), // default: token not blacklisted
    };
    guard = new JwtAuthGuard(mockTokenService);
  });

  it('should throw UnauthorizedException if token is blacklisted', async () => {
    mockTokenService.isBlacklisted.mockResolvedValueOnce(true); // simulate revoked token
    const context = mockExecutionContext('some-token', { id: '1' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return true from canActivate if token is not blacklisted', async () => {
    const context = mockExecutionContext('valid-token', { id: '1' });
    const can = await guard.canActivate(context);
    expect(can).toBe(true);
    expect(mockTokenService.isBlacklisted).toHaveBeenCalledWith('valid-token');
  });

  it('handleRequest should throw UnauthorizedException if no user', () => {
    const context = mockExecutionContext('token', null);
    expect(() =>
      guard.handleRequest(null, null, null, context),
    ).toThrow(UnauthorizedException);
  });

  it('handleRequest should return user if exists', () => {
    const user = { id: '1' };
    const context = mockExecutionContext('token', user);
    const result = guard.handleRequest(null, user, null, context);
    expect(result).toBe(user);
  });
});