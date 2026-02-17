import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Quiz } from './quiz.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  CODE = 'code',
}

@Entity('quiz_questions')
export class QuizQuestion {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  quizId: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE })
  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @ApiProperty({ example: 1 })
  @Column({ type: 'integer' })
  orderIndex: number;

  @ApiProperty({ example: 'What is the main purpose of NestJS decorators?' })
  @Column({ type: 'text' })
  question: string;

  @ApiProperty({ example: 'Consider how decorators enhance class functionality' })
  @Column({ type: 'text', nullable: true })
  explanation: string;

  @ApiProperty({ example: 10 })
  @Column({ type: 'integer', default: 1 })
  points: number;

  // For multiple choice questions
  @ApiProperty({ 
    example: [
      { id: 'a', text: 'To add metadata and enhance class functionality', isCorrect: true },
      { id: 'b', text: 'To make code look pretty', isCorrect: false },
      { id: 'c', text: 'To slow down execution', isCorrect: false },
      { id: 'd', text: 'To confuse developers', isCorrect: false }
    ] 
  })
  @Column({ type: 'jsonb', nullable: true })
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;

  // For short answer or code questions
  @ApiProperty({ example: ['dependency injection', 'DI', 'injecting dependencies'] })
  @Column({ type: 'jsonb', nullable: true })
  correctAnswers: string[];

  @ApiProperty({ example: 'console.log("Hello World");' })
  @Column({ type: 'text', nullable: true })
  starterCode: string;

  @ApiProperty({ example: 'typescript' })
  @Column({ type: 'varchar', nullable: true })
  codeLanguage: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false, comment: 'For short answer: case sensitive matching' })
  caseSensitive: boolean;

  @ApiProperty({ example: { imageUrl: 'https://example.com/diagram.png' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}