import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Test } from './test.entity';

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => Test, { nullable: false })
  test: Test;

  @Column({ nullable: true })
  clubId?: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ default: false })
  passed: boolean;

  @Column({ default: false })
  correctedByAI: boolean;

  @Column({ type: 'json', nullable: true })
  answers?: any;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @CreateDateColumn({ name: 'attempted_at' })
  attemptedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
