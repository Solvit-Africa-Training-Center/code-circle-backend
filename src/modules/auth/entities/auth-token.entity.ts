import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Token types for authentication and verification purposes
 */
export enum AuthTokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  REFRESH = 'refresh',
  REVOKED = 'revoked', // For JWT tokens that have been revoked (stored in revoked_tokens table)
  TWO_FACTOR_BACKUP = 'two_factor_backup', // For 2FA backup codes
}

/**
 * Consolidated token entity for all authentication-related tokens
 * Replaces: EmailVerificationToken, PasswordResetToken, RefreshToken, RevokedToken
 */
@Entity('auth_tokens')
@Index('IDX_auth_tokens_token_hash', ['tokenHash'], { unique: true })
@Index('IDX_auth_tokens_expires_at', ['expiresAt'])
@Index('IDX_auth_tokens_user_type', ['user', 'type'])
@Index('IDX_auth_tokens_type_used', ['type', 'used'])
@Index('IDX_auth_tokens_type_revoked', ['type', 'isRevoked'])
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.authTokens, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: true, // Can be null for REVOKED JWT tokens
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'enum', enum: AuthTokenType })
  type: AuthTokenType;

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  // For one-time use tokens (email verification, password reset)
  @Column({ default: false })
  used: boolean;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt?: Date;

  // For refresh tokens that can be revoked
  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  // Optional metadata stored as JSON for type-specific data
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Optional fields for refresh tokens (device tracking)
  @Column({ name: 'device_info', type: 'text', nullable: true })
  deviceInfo?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

