import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.passwordResetTokens, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index('IDX_password_reset_tokens_token_hash')
  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash: string;

  @Index('IDX_password_reset_tokens_expires_at')
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}