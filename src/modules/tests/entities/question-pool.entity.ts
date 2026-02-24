// src/tests/entities/question-pool.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CODE_ANALYSIS = 'CODE_ANALYSIS',
  OPEN_ENDED = 'OPEN_ENDED',
  CODE_CHALLENGE = 'CODE_CHALLENGE',
}

export enum PoolType {
  CATEGORY = 'CATEGORY',
  CLUB = 'CLUB',
}

@Entity('question_pool')
export class QuestionPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Type de pool
  @Column({
    type: 'enum',
    enum: PoolType,
  })
  poolType: PoolType;

  // ( CREATOR_TEST)
  @Index()
  @Column({ nullable: true })
  categoryId?: string;

  // ( MEMBER_TEST)
  @Index()
  @Column({ nullable: true })
  clubId?: string;

  // Type de question
  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  questionType: QuestionType;

  @Column({ type: 'text' })
  question: string;

  // Pour MULTIPLE_CHOICE et CODE_ANALYSIS
  @Column({ type: 'jsonb', nullable: true })
  options?: string[];

  @Column({ type: 'text', nullable: true })
  correctAnswer?: string;

  // Pour CODE_CHALLENGE
  @Column({ type: 'jsonb', nullable: true })
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  codeTemplate?: string;

  // Pour OPEN_ENDED
  @Column({ type: 'jsonb', nullable: true })
  evaluationCriteria?: {
    keywords?: string[];
    minLength?: number;
    maxLength?: number;
    rubric?: string;
  };

  @Column({ type: 'int', default: 10 })
  points: number;

  // Difficulté de la question
  @Column({
    type: 'enum',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
    default: 'INTERMEDIATE',
  })
  difficulty: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
