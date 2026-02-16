import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { QuizQuestion } from './quiz-question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

export enum QuizType {
  PRACTICE = 'practice',
  GRADED = 'graded',
  FINAL = 'final',
}

export enum QuizStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

@Entity('quizzes')
export class Quiz {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Module 1 Quiz: NestJS Fundamentals' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Test your knowledge of NestJS basics' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ enum: QuizType, example: QuizType.GRADED })
  @Column({ type: 'enum', enum: QuizType })
  type: QuizType;

  @ApiProperty({ enum: QuizStatus, example: QuizStatus.PUBLISHED })
  @Column({ type: 'enum', enum: QuizStatus, default: QuizStatus.DRAFT })
  status: QuizStatus;

  @ApiProperty({ example: 30 })
  @Column({ type: 'integer', default: 30, comment: 'Time limit in minutes' })
  timeLimit: number;

  @ApiProperty({ example: 100 })
  @Column({ type: 'integer', default: 100 })
  maxPoints: number;

  @ApiProperty({ example: 70 })
  @Column({ type: 'integer', default: 70, comment: 'Minimum percentage to pass' })
  passingScore: number;

  @ApiProperty({ example: 3 })
  @Column({ type: 'integer', default: 1 })
  maxAttempts: number;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  shuffleQuestions: boolean;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  shuffleAnswers: boolean;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  showCorrectAnswers: boolean;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false, comment: 'Show results immediately after submission' })
  showResultsImmediately: boolean;

  @ApiProperty({ example: '2024-02-15T00:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  availableFrom: Date;

  @ApiProperty({ example: '2024-02-20T23:59:59.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  availableUntil: Date;

  // Foreign Keys
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', nullable: true })
  moduleId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', nullable: true })
  lessonId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  createdBy: string;

  // Relations
  // @ManyToOne(() => Course)
  // @JoinColumn({ name: 'courseId' })
  // course: Course;

  // @ManyToOne(() => Module)
  // @JoinColumn({ name: 'moduleId' })
  // module: Module;

  // @ManyToOne(() => Lesson)
  // @JoinColumn({ name: 'lessonId' })
  // lesson: Lesson;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, { cascade: true })
  questions: QuizQuestion[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}