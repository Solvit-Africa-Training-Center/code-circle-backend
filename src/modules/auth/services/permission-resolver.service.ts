import { Injectable, Logger, Scope } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRole } from "../entities/user-role.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { UserPermission } from "../entities/user-permission.entity";
import { scopeInterface } from "../enums/scope.enum";

@Injectable({ scope: Scope.REQUEST })
export class PermissionResolverService {
  private readonly logger = new Logger(PermissionResolverService.name);
  private readonly cache = new Map<string, Set<string>>();


  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private readonly rolePermRepo: Repository<RolePermission>,

    @InjectRepository(UserPermission)
    private readonly userPermRepo: Repository<UserPermission>
  ) {}

  private async getRolePermissionsForUser(
    userId: string,
    scope: scopeInterface,
  ): Promise<Set<string>> {
    const userRoles = await this.userRoleRepo.find({
      where: {
        user: { id: userId },
        role: { scope, isActive: true },
      },
      relations: ['role'],
    });

    if (userRoles.length === 0) {
      return new Set();
    }

    const roleIds = userRoles.map((ur) => ur.role.id);

    const rows = await this.rolePermRepo
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'permission')
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .select('permission.name', 'name')
      .getRawMany<{ name: string }>();

    return new Set(rows.map((r) => r.name));
  }

  private async getDirectUserPermissions(userId: string): Promise<Set<string>> {
    const rows = await this.userPermRepo
      .createQueryBuilder('up')
      .innerJoin('up.permission', 'permission')
      .where('up.userId = :userId', { userId })
      .andWhere('up.isDenied = :isDenied', { isDenied: false })
      .andWhere('(up.expiresAt IS NULL OR up.expiresAt > NOW())')
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .select('permission.name', 'name')
      .getRawMany<{ name: string }>();

    return new Set(rows.map((r) => r.name));
  }

  private async getDeniedUserPermissions(userId: string): Promise<Set<string>> {
    const rows = await this.userPermRepo
      .createQueryBuilder('up')
      .innerJoin('up.permission', 'permission')
      .where('up.userId = :userId', { userId })
      .andWhere('up.isDenied = :isDenied', { isDenied: true })
      .andWhere('(up.expiresAt IS NULL OR up.expiresAt > NOW())')
      .select('permission.name', 'name')
      .getRawMany<{ name: string }>();

    return new Set(rows.map((r) => r.name));
  }

  async resolveForUser(
    userId: string,
    scope: scopeInterface = scopeInterface.GLOBAL,
  ): Promise<Set<string>> {
    const cacheKey = `user:${userId}:${scope}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const rolePermissions = await this.getRolePermissionsForUser(userId, scope);

    const userPermissions = await this.getDirectUserPermissions(userId);

    const deniedPermissions = await this.getDeniedUserPermissions(userId);

    const allPermissions = new Set<string>([
      ...rolePermissions,
      ...userPermissions,
    ]);

    deniedPermissions.forEach((perm) => allPermissions.delete(perm));

    this.cache.set(cacheKey, allPermissions);

    this.logger.debug(
      `Resolved ${allPermissions.size} permissions for user ${userId} in scope ${scope}`,
    );

    return allPermissions;
  }
  
  async resolveForRole(
    roleName: string,
    scope: scopeInterface = scopeInterface.GLOBAL,
  ): Promise<Set<string>> {
    const cacheKey = `role:${roleName}:${scope}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const rows = await this.rolePermRepo
      .createQueryBuilder('rp')
      .innerJoin('rp.role', 'role')
      .innerJoin('rp.permission', 'permission')
      .where('role.name = :roleName', { roleName })
      .andWhere('role.scope = :scope', { scope })
      .andWhere('role.isActive = :isActive', { isActive: true })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .select('permission.name', 'name')
      .getRawMany<{ name: string }>();

    const permissions = new Set(rows.map((r) => r.name));

    this.cache.set(cacheKey, permissions);

    this.logger.debug(
      `Resolved ${permissions.size} permissions for role ${roleName} in scope ${scope}`,
    );

    return permissions;
  }

  async userHasPermission(
    userId: string,
    permissionName: string,
    scope: scopeInterface = scopeInterface.GLOBAL,
  ): Promise<boolean> {
    const permissions = await this.resolveForUser(userId, scope);
    return permissions.has(permissionName);
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Permission cache cleared');
  }
}