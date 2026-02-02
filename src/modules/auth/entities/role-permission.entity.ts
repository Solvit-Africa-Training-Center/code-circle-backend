import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn('uuid', { name: 'role_id' })
  roleId: string;

  @PrimaryColumn('uuid', { name: 'permission_id' })
  permissionId: string;

  @ManyToOne(() => Role, role => role.rolePermissions , { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, permission => permission.rolePermissions,{ onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;
}