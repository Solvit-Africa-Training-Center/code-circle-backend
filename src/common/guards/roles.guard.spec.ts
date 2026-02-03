import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
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
    it('should allow access if no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({
        id: 'user-1',
        roles: [],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access if user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext({
        id: 'user-1',
        roles: [{ name: 'ADMIN', scope: 'GLOBAL' }],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access if user has one of multiple required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'MANAGER']);

      const context = createMockContext({
        id: 'user-1',
        roles: [{ name: 'MANAGER', scope: 'GLOBAL' }],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access if user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext({
        id: 'user-1',
        roles: [{ name: 'USER', scope: 'GLOBAL' }],
      });

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient role. Required one of: ADMIN', 
      );
    });

    it('should deny access if user has no roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext({
        id: 'user-1',
        roles: [],
      });

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient role. Required one of: ADMIN', 
      );
    });

    it('should handle user with multiple roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['MANAGER']);

      const context = createMockContext({
        id: 'user-1',
        roles: [
          { name: 'USER', scope: 'GLOBAL' },
          { name: 'MANAGER', scope: 'GLOBAL' },
          { name: 'MODERATOR', scope: 'CLUB' },
        ],
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle case-sensitive role names', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      const context = createMockContext({
        id: 'user-1',
        roles: [{ name: 'admin', scope: 'GLOBAL' }],
      });

      expect(() => guard.canActivate(context)).toThrow();
    });
  });
});