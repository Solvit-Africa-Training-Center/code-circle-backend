import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { scopeInterface } from '../enums/scope.enum';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // ADMIN, CREATOR, MEMBER

    @Column({
        type: 'enum',
        enum:scopeInterface,
        default: scopeInterface.GLOBAL,
        nullable: false
    })
    scope: scopeInterface;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => RolePermission, rp => rp.role)
    rolePermissions: RolePermission[];

    @OneToMany(() => UserRole, (ur) => ur.role)
    userRoles: UserRole[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}