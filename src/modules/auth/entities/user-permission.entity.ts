import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Permission } from "./permission.entity";

@Entity('user_permissions')
@Index('IDX_user_permissions_user_permission', ['userId', 'permissionId'], { unique: true })
export class UserPermission {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('uuid', { name: 'permission_id' })
  permissionId: string;

  @ManyToOne(() => User, (user) => user.userPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @Column({ name: 'is_denied', default: false })
  isDenied: boolean;

  @Index('IDX_user_permissions_expires_at')
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy: string;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;
}