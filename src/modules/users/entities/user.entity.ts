import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from '../../auth/entities/user-role.entity';
import { AuthToken } from '../../auth/entities/auth-token.entity';
import { OAuthAccount } from '../../auth/entities/oauth-account.entity';
import { TwoFactorSecret } from '../../auth/entities/two-factor-secret';
import { UserPermission } from '../../auth/entities/user-permission.entity';

import { OneToMany } from 'typeorm';

export enum GlobalStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index('IDX_users_email')
  @Column({ unique: true })
  email: string;

  @Column({ type: 'text' })
  password: string;

  @Column({
    type: 'enum',
    enum: GlobalStatus,
    default: GlobalStatus.PENDING,
  })
  globalStatus: GlobalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => AuthToken, (authToken) => authToken.user)
  authTokens: AuthToken[];

  @OneToMany(() => OAuthAccount, (oauthAccount) => oauthAccount.user)
  oauthAccounts: OAuthAccount[];

  @OneToMany(() => TwoFactorSecret, (twoFactorSecret) => twoFactorSecret.user)
  twoFactorSecrets: TwoFactorSecret[];

  @OneToMany(() => UserPermission, (userPermission) => userPermission.user)
  userPermissions: UserPermission[];
  // role is handled by userRoles relation
}
