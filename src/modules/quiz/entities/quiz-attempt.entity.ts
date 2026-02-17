import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Quiz } from './quiz.entity';

export enum AttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  EXPIRED = 'expired',
}

@Entity('quiz_attempts')
@Index(['quizId', 'userId'])
export class QuizAttempt {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  quizId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: 1 })
  @Column({ type: 'integer' })
  attemptNumber: number;

  @ApiProperty({ enum: AttemptStatus, example: AttemptStatus.SUBMITTED })
  @Column({ type: 'enum', enum: AttemptStatus, default: AttemptStatus.IN_PROGRESS })
  status: AttemptStatus;

  // User's answers
  @ApiProperty({ 
    example: {
      'question-uuid-1': { answer: 'a', isCorrect: true, points: 10 },
      'question-uuid-2': { answer: 'dependency injection', isCorrect: true, points: 10 }
    } 
  })
  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, {
    answer: string | string[];
    isCorrect?: boolean;
    points?: number;
    feedback?: string;
  }>;

  @ApiProperty({ example: 85 })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @ApiProperty({ example: 85 })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentageScore: number;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', nullable: true })
  passed: boolean;

  @ApiProperty({ example: 1800 })
  @Column({ type: 'integer', default: 0, comment: 'Time spent in seconds' })
  timeSpent: number;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @Column({ type: 'timestamp' })
  startedAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @ApiProperty({ example: 'Great job! You demonstrated strong understanding.' })
  @Column({ type: 'text', nullable: true })
  feedback: string;

  // Auto-graded or manually reviewed
  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isAutoGraded: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', nullable: true })
  gradedBy: string;

  @ApiProperty({ example: '2024-01-15T11:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'userId' })
  // user: User;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}