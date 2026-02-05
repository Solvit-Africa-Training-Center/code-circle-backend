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

@Entity('two_factor_secrets')
@Index('IDX_two_factor_secrets_user_enabled', ['user', 'enabled'])
export class TwoFactorSecret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.twoFactorSecrets, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  secret: string;

  @Column({ default: false })
  enabled: boolean;

  @Column({ name: 'backup_codes', type: 'jsonb', nullable: true })
  backupCodes?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
