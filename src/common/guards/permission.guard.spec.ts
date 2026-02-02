import { Test, TestingModule } from '@nestjs/testing';
import { PermissionGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { PermissionResolverService } from '@circle-backend/modules/auth/services/permission-resolver.service';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { scopeInterface } from '@circle-backend/modules/auth/enums/scope.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let permissionResolver: jest.Mocked<PermissionResolverService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PermissionResolverService,
          useValue: {
            resolveForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get(Reflector);
    permissionResolver = module.get(PermissionResolverService) as jest.Mocked<PermissionResolverService>;
  });

  const createMockContext = (user?: any, params?: Record<string, string>): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user, params }),
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
    it('should allow access if no permissions are required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ id: 'user-1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access if user has required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user:read']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set(['user:read', 'user:write']));

      const context = createMockContext({ id: 'user-1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionResolver.resolveForUser).toHaveBeenCalledWith('user-1', scopeInterface.GLOBAL);
    });

    it('should allow access if user has all required permissions', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['user:read', 'user:write']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set(['user:read', 'user:write', 'user:delete']));

      const context = createMockContext({ id: 'user-1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access if user is missing one required permission', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['user:read', 'user:delete']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set(['user:read', 'user:write']));

      const context = createMockContext({ id: 'user-1' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should deny access if user has no permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user:read']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set());

      const context = createMockContext({ id: 'user-1' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle multiple missing permissions', async () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['user:read', 'user:write', 'user:delete']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set(['user:read']));

      const context = createMockContext({ id: 'user-1' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should handle wildcard permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user:read']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set(['user:*']));

      const context = createMockContext({ id: 'user-1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle admin wildcard permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user:delete']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set(['*']));

      const context = createMockContext({ id: 'user-1' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException if user is missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user:read']);

      const context = createMockContext(undefined);
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should infer scope from request for club-scoped permissions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['club:manage']);
      permissionResolver.resolveForUser.mockResolvedValue(new Set(['club:manage']));

      const context = createMockContext({ id: 'user-1' }, { clubId: 'club-123' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionResolver.resolveForUser).toHaveBeenCalledWith('user-1', scopeInterface.CLUB);
    });
  });
});