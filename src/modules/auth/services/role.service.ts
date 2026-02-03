import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { Repository, In, DataSource } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { AuditService } from './audit.service';
import { Permission } from '../entities/permission.entity';
import { scopeInterface } from '../enums/scope.enum';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    private readonly auditService: AuditService,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateRoleDto, createdBy = 'system'): Promise<Role> {
    const exists = await this.roleRepo.findOne({
      where: { name: dto.name, scope: dto.scope },
    });

    if (exists) {
      throw new ConflictException(
        `Role "${dto.name}" already exists in scope "${dto.scope}"`,
      );
    }

    const role = this.roleRepo.create({
      name: dto.name,
      scope: dto.scope,
      description: dto.description,
      isActive: true,
    });

    const savedRole = await this.roleRepo.save(role);

    await this.auditService.log('ROLE_CREATED', createdBy, savedRole.id, {
      name: dto.name,
      scope: dto.scope,
    });

    this.logger.log(`Role created: ${savedRole.name} (${savedRole.id})`);

    return savedRole;
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: string, scope?: scopeInterface): Promise<Role> {
    const where = scope ? { name, scope } : { name };

    const role = await this.roleRepo.findOne({
      where,
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role "${name}" not found`);
    }

    return role;
  }

  async update(
    id: string,
    updates: Partial<CreateRoleDto>,
    updatedBy = 'system',
  ): Promise<Role> {
    const role = await this.findOne(id);

    if (updates.name && updates.name !== role.name) {
      const exists = await this.roleRepo.findOne({
        where: { name: updates.name, scope: role.scope },
      });

      if (exists) {
        throw new ConflictException(
          `Role "${updates.name}" already exists in scope "${role.scope}"`,
        );
      }
    }

    Object.assign(role, updates);
    const updated = await this.roleRepo.save(role);

    await this.auditService.log('ROLE_UPDATED', updatedBy, role.id, updates);

    this.logger.log(`Role updated: ${role.id}`);

    return updated;
  }

  async deactivate(id: string, deactivatedBy = 'system'): Promise<Role> {
    const role = await this.findOne(id);

    role.isActive = false;
    const updated = await this.roleRepo.save(role);

    await this.auditService.log('ROLE_DEACTIVATED', deactivatedBy, role.id);

    this.logger.log(`Role deactivated: ${role.id}`);

    return updated;
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    assignedBy = 'system',
  ): Promise<{ success: boolean; roleId: string; permissionIds: string[] }> {
    return this.dataSource.transaction(async (manager) => {
      const role = await manager.findOne(Role, { where: { id: roleId } });
      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }

      const permissions = await manager.findBy(Permission, {
        id: In(permissionIds),
      });

      if (permissions.length !== permissionIds.length) {
        const found = permissions.map((p) => p.id);
        const missing = permissionIds.filter((id) => !found.includes(id));
        throw new NotFoundException(
          `Permissions not found: ${missing.join(', ')}`,
        );
      }

      await manager.delete(RolePermission, { roleId });

      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) =>
          manager.create(RolePermission, { roleId, permissionId }),
        );

        await manager.save(RolePermission, rolePermissions);
      }

      await this.auditService.log(
        'ROLE_PERMISSIONS_ASSIGNED',
        assignedBy,
        roleId,
        {
          permissionIds,
        },
      );

      this.logger.log(
        `Assigned ${permissionIds.length} permissions to role ${roleId}`,
      );

      return { success: true, roleId, permissionIds };
    });
  }

  async addPermissions(
    roleId: string,
    permissionIds: string[],
    assignedBy = 'system',
  ): Promise<{ success: boolean; added: string[] }> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.find(RolePermission, {
        where: { roleId },
      });

      const existingIds = existing.map((rp) => rp.permissionId);

      const toAdd = permissionIds.filter((id) => !existingIds.includes(id));

      if (toAdd.length === 0) {
        return { success: true, added: [] };
      }

      const permissions = await manager.findBy(Permission, { id: In(toAdd) });
      if (permissions.length !== toAdd.length) {
        const found = permissions.map((p) => p.id);
        const missing = toAdd.filter((id) => !found.includes(id));
        throw new NotFoundException(
          `Permissions not found: ${missing.join(', ')}`,
        );
      }

      const rolePermissions = toAdd.map((permissionId) =>
        manager.create(RolePermission, { roleId, permissionId }),
      );

      await manager.save(RolePermission, rolePermissions);

      await this.auditService.log(
        'ROLE_PERMISSIONS_ADDED',
        assignedBy,
        roleId,
        {
          permissionIds: toAdd,
        },
      );

      this.logger.log(`Added ${toAdd.length} permissions to role ${roleId}`);

      return { success: true, added: toAdd };
    });
  }

  async removePermissions(
    roleId: string,
    permissionIds: string[],
    removedBy = 'system',
  ): Promise<{ success: boolean; removed: string[] }> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(RolePermission)
      .where('roleId = :roleId', { roleId })
      .andWhere('permissionId IN (:...permissionIds)', { permissionIds })
      .execute();

    await this.auditService.log('ROLE_PERMISSIONS_REMOVED', removedBy, roleId, {
      permissionIds,
      count: result.affected,
    });

    this.logger.log(
      `Removed ${result.affected} permissions from role ${roleId}`,
    );

    return { success: true, removed: permissionIds };
  }

  async assignRoles(
    userId: string,
    roleIds: string[],
    assignedBy = 'system',
  ): Promise<{ success: boolean; userId: string; roles: string[] }> {
    return this.dataSource.transaction(async (manager) => {
      const roles = await manager.findBy(Role, {
        id: In(roleIds),
        isActive: true,
      });

      if (roles.length !== roleIds.length) {
        const found = roles.map((r) => r.id);
        const missing = roleIds.filter((id) => !found.includes(id));
        throw new NotFoundException(
          `Roles not found or inactive: ${missing.join(', ')}`,
        );
      }

      await manager.delete(UserRole, { user: { id: userId } });

      if (roleIds.length > 0) {
        const userRoles = roles.map((role) =>
          manager.create(UserRole, {
            user: { id: userId },
            role,
            assignedByUserId: assignedBy,
          }),
        );

        await manager.save(UserRole, userRoles);
      }

      await this.auditService.log('USER_ROLES_ASSIGNED', assignedBy, userId, {
        roleIds,
      });

      this.logger.log(`Assigned ${roleIds.length} roles to user ${userId}`);

      return { success: true, userId, roles: roleIds };
    });
  }

  async getUsersWithRole(roleId: string): Promise<UserRole[]> {
    return this.dataSource.getRepository(UserRole).find({
      where: { role: { id: roleId } },
      relations: ['user'],
    });
  }
}
