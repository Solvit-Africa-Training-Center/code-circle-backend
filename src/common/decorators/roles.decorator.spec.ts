import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set roles metadata on method', () => {
    class TestController {
      @Roles('ADMIN', 'MANAGER')
      testMethod() {
        return 'test';
      }
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod);

    expect(roles).toEqual(['ADMIN', 'MANAGER']);
  });

  it('should set single role', () => {
    class TestController {
      @Roles('USER')
      testMethod() {
        return 'test';
      }
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod);

    expect(roles).toEqual(['USER']);
  });

  it('should set multiple roles', () => {
    class TestController {
      @Roles('ADMIN', 'MODERATOR', 'USER')
      testMethod() {
        return 'test';
      }
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod);

    expect(roles).toEqual(['ADMIN', 'MODERATOR', 'USER']);
  });

  it('should work on class level', () => {
    @Roles('SUPER_ADMIN')
    class TestController {
      testMethod() {
        return 'test';
      }
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController);

    expect(roles).toEqual(['SUPER_ADMIN']);
  });

  it('should set empty array if no roles provided', () => {
    class TestController {
      @Roles()
      testMethod() {
        return 'test';
      }
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod);

    expect(roles).toEqual([]);
  });
});