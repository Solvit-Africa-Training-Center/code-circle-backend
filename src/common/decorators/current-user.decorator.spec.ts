import 'reflect-metadata';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  const createMockExecutionContext = (user?: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext);

  function getDecoratorFactory() {
    class TestController {
      test(@CurrentUser() _user: any) {}
    }

    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'test',
    );

    const key = Object.keys(metadata)[0];
    return metadata[key].factory;
  }

  it('should extract user from request', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      roles: [{ name: 'ADMIN', scope: 'GLOBAL' }],
      permissions: ['user:read', 'user:write'],
    };

    const ctx = createMockExecutionContext(mockUser);
    const factory = getDecoratorFactory();

    const result = factory(undefined, ctx);

    expect(result).toEqual(mockUser);
  });

  it('should throw UnauthorizedException if user is missing', () => {
    const ctx = createMockExecutionContext(undefined);
    const factory = getDecoratorFactory();

    expect(() => factory(undefined, ctx)).toThrow(UnauthorizedException);
    expect(() => factory(undefined, ctx)).toThrow('User not authenticated');
  });

  it('should handle minimal user payload', () => {
    const minimalUser = {
      id: 'user-2',
      email: 'minimal@example.com',
      roles: [],
      permissions: [],
    };

    const ctx = createMockExecutionContext(minimalUser);
    const factory = getDecoratorFactory();

    const result = factory(undefined, ctx);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });
});