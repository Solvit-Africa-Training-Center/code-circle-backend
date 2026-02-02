import {
  Entity,
  ManyToOne,
  CreateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Index('IDX_user_roles_user_role', ['user', 'role'], { unique: true })
export class UserRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Role, (role) => role.userRoles, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ name: 'assigned_by_user_id', nullable: true })
    assignedByUserId: string;

    @CreateDateColumn({ name: 'assigned_at' })
    assignedAt: Date;
}