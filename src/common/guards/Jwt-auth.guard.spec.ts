import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockExecutionContext = (user?: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
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
    guard = new JwtAuthGuard();
  });

  it('should throw UnauthorizedException if no user', () => {
    const context = mockExecutionContext(null);

    expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
  });

  it('should return user if exists', () => {
    const user = { id: '1' };
    const context = mockExecutionContext(user);

    const result = guard.handleRequest(null, user, null, context);
    expect(result).toBe(user);
  });
});
