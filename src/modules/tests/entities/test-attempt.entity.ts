// src/tests/entities/test-attempt.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Test } from './test.entity';
import { TestPurpose } from '../enums/test-type.enum';

@Entity('test_attempts')
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Référence au User (sans relation TypeORM)
  @Column()
  userId: string;

  @ManyToOne(() => Test, { eager: true })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column()
  testId: string;

  // Pour savoir pourquoi le user passe le test
  @Column({
    type: 'enum',
    enum: TestPurpose,
    nullable: true,
  })
  purpose?: TestPurpose;

  // Si CREATE_CLUB
  @Column({ nullable: true })
  intendedCategoryId: string;

  @Column({ nullable: true })
  intendedClubName: string;

  // Si JOIN_CLUB
  @Column({ nullable: true })
  targetClubId: string;

  @Column({ type: 'jsonb' })
  answers: Record<string, string>;

  @Column({ type: 'int' })
  score: number;

  @Column()
  passed: boolean;

  @Column({ default: false })
  correctedByAI: boolean;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @CreateDateColumn()
  attemptedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}
