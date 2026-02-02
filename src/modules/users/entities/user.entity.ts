import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserRole } from '../../auth/entities/user-role.entity';
import { RefreshToken } from '@circle-backend/modules/auth/entities/refresh-token.entity';
import { OAuthAccount } from '@circle-backend/modules/auth/entities/oauth-account.entity';
import { PasswordResetToken } from '@circle-backend/modules/auth/entities/password-reset-token.entity';
import { TwoFactorSecret } from '@circle-backend/modules/auth/entities/two-factor-secret';
import { UserPermission } from '../../auth/entities/user-permission.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'first_name' })
    firstName: string;

    @Column({ name: 'last_name' })
    lastName: string;

    @Index('IDX_users_email')
    @Column({ unique: true })
    email: string;

    @Column({ type: 'text', nullable: false })
    passwordHash: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'email_verified', default: false })
    emailVerified: boolean;

    @Column({ name: 'email_verification_token_hash', type: 'text', nullable: true })
    emailVerificationTokenHash: string | null;

    @Column({
      name: 'email_verification_expires_at',
      type: 'timestamp',
      nullable: true,
    })
    emailVerificationExpiresAt: Date | null;

    @Index('IDX_users_last_login_at')
    @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
    lastLoginAt: Date | null;

    @Column({ name: 'current_device_id', type: 'text', nullable: true })
    currentDeviceId: string | null;

    @Column({ name: 'two_factor_enabled', default: false })
    twoFactorEnabled: boolean;

    @OneToMany(() => UserRole, (ur) => ur.user)
    userRoles: UserRole[];

    @OneToMany(() => UserPermission, (up) => up.user)
    userPermissions: UserPermission[];

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
    refreshTokens: RefreshToken[];  

    @OneToMany(() => OAuthAccount, (oauthAccount) => oauthAccount.user)
    oauthAccounts: OAuthAccount[];

    @OneToMany(() => TwoFactorSecret, (tfs) => tfs.user)
    twoFactorSecrets: TwoFactorSecret[];

    @OneToMany(() => PasswordResetToken, (prt) => prt.user)
    passwordResetTokens: PasswordResetToken[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}