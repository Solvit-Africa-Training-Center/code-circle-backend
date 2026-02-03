import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { RoleService } from './role.service';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Permission } from '../entities/permission.entity';
import { AuditService } from './audit.service';
import { scopeInterface } from '../enums/scope.enum';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let permissionRepo: jest.Mocked<Repository<Permission>>;
  let auditService: jest.Mocked<AuditService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockRole: Role = {
    id: 'role-1',
    name: 'ADMIN',
    scope: scopeInterface.GLOBAL,
    description: 'Admin role',
    isActive: true,
  } as any;

  const mockPermission: Permission = {
    id: 'perm-1',
    name: 'users.read',
    isActive: true,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            findBy: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              delete: jest.fn().mockReturnThis(),
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 2 }),
            })),
            getRepository: jest.fn(() => ({
              find: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepo = module.get(getRepositoryToken(Role));
    permissionRepo = module.get(getRepositoryToken(Permission));
    auditService = module.get(AuditService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role with correct scope', async () => {
      const dto = {
        name: 'ADMIN',
        scope: scopeInterface.GLOBAL,
        description: 'Admin role',
      };

      roleRepo.findOne.mockResolvedValue(null);
      roleRepo.create.mockReturnValue(mockRole);
      roleRepo.save.mockResolvedValue(mockRole);

      const result = await service.create(dto as any);

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { name: dto.name, scope: dto.scope },
      });
      expect(roleRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        scope: dto.scope,
        description: dto.description,
        isActive: true,
      });
      expect(roleRepo.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'ROLE_CREATED',
        'system',
        mockRole.id,
        { name: dto.name, scope: dto.scope },
      );
      expect(result).toEqual(mockRole);
    });

    it('should throw ConflictException if role already exists', async () => {
      const dto = {
        name: 'ADMIN',
        scope: scopeInterface.GLOBAL,
      };

      roleRepo.findOne.mockResolvedValue(mockRole);

      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return roles with permissions relations', async () => {
      const roles = [mockRole];
      roleRepo.find.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(roleRepo.find).toHaveBeenCalledWith({
        relations: ['rolePermissions', 'rolePermissions.permission'],
        order: { name: 'ASC' },
      });
      expect(result).toEqual(roles);
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne('role-1');

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('role-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return a role by name', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);

      const result = await service.findByName('ADMIN');

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
      expect(result).toEqual(mockRole);
    });

    it('should return a role by name and scope', async () => {
      roleRepo.findOne.mockResolvedValue(mockRole);

      const result = await service.findByName('ADMIN', scopeInterface.GLOBAL);

      expect(roleRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'ADMIN', scope: scopeInterface.GLOBAL },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.findByName('ADMIN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updates = { description: 'Updated description' };
      
      roleRepo.findOne.mockResolvedValue(mockRole);
      roleRepo.save.mockResolvedValue({ ...mockRole, ...updates });

      const result = await service.update('role-1', updates);

      expect(roleRepo.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'ROLE_UPDATED',
        'system',
        mockRole.id,
        updates,
      );
      expect(result.description).toBe(updates.description);
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updates = { name: 'NEW_ADMIN' };
      
      roleRepo.findOne
        .mockResolvedValueOnce(mockRole) 
        .mockResolvedValueOnce({ ...mockRole, name: 'NEW_ADMIN' }); 

      await expect(service.update('role-1', updates)).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a role', async () => {
      const deactivatedRole = { ...mockRole, isActive: false };
      
      roleRepo.findOne.mockResolvedValue(mockRole);
      roleRepo.save.mockResolvedValue(deactivatedRole);

      const result = await service.deactivate('role-1');

      expect(roleRepo.save).toHaveBeenCalledWith({ ...mockRole, isActive: false });
      expect(auditService.log).toHaveBeenCalledWith(
        'ROLE_DEACTIVATED',
        'system',
        mockRole.id,
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('assignPermissions', () => {
    it('should replace existing permissions with new ones', async () => {
      const roleId = 'role-1';
      const permissionIds = ['perm-1', 'perm-2'];
      const permissions = [
        { id: 'perm-1', name: 'users.read' },
        { id: 'perm-2', name: 'users.write' },
      ];

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockRole),
        findBy: jest.fn().mockResolvedValue(permissions),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        create: jest.fn((entity: any, data: any) => data),
        save: jest.fn().mockResolvedValue([]),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockManager);
      });

      const result = await service.assignPermissions(roleId, permissionIds);

      expect(mockManager.findOne).toHaveBeenCalledWith(Role, { where: { id: roleId } });
      expect(mockManager.findBy).toHaveBeenCalledWith(Permission, {
        id: expect.anything(),
      });
      expect(mockManager.delete).toHaveBeenCalledWith(RolePermission, { roleId });
      expect(mockManager.create).toHaveBeenCalledTimes(2);
      expect(mockManager.save).toHaveBeenCalledWith(RolePermission, expect.any(Array));
      expect(auditService.log).toHaveBeenCalledWith(
        'ROLE_PERMISSIONS_ASSIGNED',
        'system',
        roleId,
        { permissionIds },
      );
      expect(result).toEqual({ success: true, roleId, permissionIds });
    });

    it('should throw NotFoundException if role not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockManager);
      });

      await expect(
        service.assignPermissions('role-1', ['perm-1'])
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if permissions not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockRole),
        findBy: jest.fn().mockResolvedValue([]),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockManager);
      });

      await expect(
        service.assignPermissions('role-1', ['perm-1', 'perm-2'])
      ).rejects.toThrow(NotFoundException);
    });

    it('should clear permissions if empty array provided', async () => {
      const roleId = 'role-1';
      const permissionIds: string[] = [];

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockRole),
        findBy: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockManager);
      });

      const result = await service.assignPermissions(roleId, permissionIds);

      expect(mockManager.delete).toHaveBeenCalledWith(RolePermission, { roleId });
      expect(result).toEqual({ success: true, roleId, permissionIds: [] });
    });
  });

  describe('addPermissions', () => {
    it('should add permissions without removing existing ones', async () => {
      const roleId = 'role-1';
      const existingPerms = [{ roleId, permissionId: 'perm-1' }];
      const newPermissionIds = ['perm-2', 'perm-3'];

      const mockManager = {
        find: jest.fn().mockResolvedValue(existingPerms),
        findBy: jest.fn().mockResolvedValue([
          { id: 'perm-2' },
          { id: 'perm-3' },
        ]),
        create: jest.fn((entity: any, data: any) => data),
        save: jest.fn().mockResolvedValue([]),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockManager);
      });

      const result = await service.addPermissions(roleId, newPermissionIds);

      expect(mockManager.find).toHaveBeenCalledWith(RolePermission, {
        where: { roleId },
      });
      expect(result).toEqual({ success: true, added: newPermissionIds });
    });

    it('should not add duplicate permissions', async () => {
      const roleId = 'role-1';
      const existingPerms = [{ roleId, permissionId: 'perm-1' }];

      const mockManager = {
        find: jest.fn().mockResolvedValue(existingPerms),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockManager);
      });

      const result = await service.addPermissions(roleId, ['perm-1']);

      expect(result).toEqual({ success: true, added: [] });
    });
  });

  describe('removePermissions', () => {
    it('should remove specific permissions', async () => {
      const roleId = 'role-1';
      const permissionIds = ['perm-1', 'perm-2'];

      const result = await service.removePermissions(roleId, permissionIds);

      expect(dataSource.createQueryBuilder).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'ROLE_PERMISSIONS_REMOVED',
        'system',
        roleId,
        { permissionIds, count: 2 },
      );
      expect(result).toEqual({ success: true, removed: permissionIds });
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to a user', async () => {
      const userId = 'user-1';
      const roleIds = ['role-1', 'role-2'];
      const roles = [
        { id: 'role-1', isActive: true },
        { id: 'role-2', isActive: true },
      ];

      const mockManager = {
        findBy: jest.fn().mockResolvedValue(roles),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
        create: jest.fn((entity: any, data: any) => data),
        save: jest.fn().mockResolvedValue([]),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(mockManager);
      });

      const result = await service.assignRoles(userId, roleIds);

      expect(mockManager.delete).toHaveBeenCalledWith(expect.anything(), {
        user: { id: userId },
      });
      expect(result).toEqual({ success: true, userId, roles: roleIds });
    });
  });

  describe('getUsersWithRole', () => {
    it('should return users with a specific role', async () => {
      const roleId = 'role-1';
      const userRoles = [
        { user: { id: 'user-1' }, role: { id: roleId } },
      ];

      const mockRepo = {
        find: jest.fn().mockResolvedValue(userRoles),
      };

      dataSource.getRepository.mockReturnValue(mockRepo as any);

      const result = await service.getUsersWithRole(roleId);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { role: { id: roleId } },
        relations: ['user'],
      });
      expect(result).toEqual(userRoles);
    });
  });
});