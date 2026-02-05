import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_audit_logs_action')
  @Column()
  action: string;

  @Index('IDX_audit_logs_actor_id')
  @Column({ name: 'actor_id' })
  actorId: string;

  @Index('IDX_audit_logs_target_id')
  @Column({ name: 'target_id', nullable: true })
  targetId?: string;

  @Column('jsonb', { nullable: true })
  meta?: Record<string, any>;

  @Index('IDX_audit_logs_created_at')
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
