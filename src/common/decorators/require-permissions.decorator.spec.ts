import { Reflector } from '@nestjs/core';
import { RequirePermissions, PERMISSIONS_KEY } from './require-permissions.decorator';
import { PERMISSIONS } from '@circle-backend/modules/auth/constants/permissions';

describe('RequirePermissions Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set multiple permissions on method', () => {
    class TestController {
      @RequirePermissions(PERMISSIONS.USER_READ, PERMISSIONS.USER_CREATE)
      testMethod() {}
    }

    const permissions = reflector.get<string[]>(
      PERMISSIONS_KEY,
      TestController.prototype.testMethod,
    );

    expect(permissions).toEqual([PERMISSIONS.USER_READ, PERMISSIONS.USER_CREATE]);
  });

  it('should set single permission', () => {
    class TestController {
      @RequirePermissions(PERMISSIONS.USER_READ)
      testMethod() {}
    }

    const permissions = reflector.get<string[]>(
      PERMISSIONS_KEY,
      TestController.prototype.testMethod,
    );

    expect(permissions).toEqual([PERMISSIONS.USER_READ]);
  });

  it('should work on class level', () => {
    @RequirePermissions(PERMISSIONS.SYSTEM_ADMIN)
    class TestController {
      testMethod() {}
    }

    const permissions = reflector.get<string[]>(
      PERMISSIONS_KEY,
      TestController,
    );

    expect(permissions).toEqual([PERMISSIONS.SYSTEM_ADMIN]);
  });

  it('should set empty array if no permissions provided', () => {
    class TestController {
      @RequirePermissions()
      testMethod() {}
    }

    const permissions = reflector.get<string[]>(
      PERMISSIONS_KEY,
      TestController.prototype.testMethod,
    );

    expect(permissions).toEqual([]);
  });
});