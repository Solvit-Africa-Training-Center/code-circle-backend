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
import { Enrollment } from './enrollment.entity';
import { Lesson } from './lesson.entity';

@Entity('progress')
@Index(['enrollmentId', 'lessonId'], { unique: true })
export class Progress {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  enrollmentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  lessonId: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @ApiProperty({ example: 85 })
  @Column({ type: 'integer', default: 0, comment: 'Percentage of lesson completed (0-100)' })
  completionPercentage: number;

  @ApiProperty({ example: 1200 })
  @Column({ type: 'integer', default: 0, comment: 'Time spent in seconds' })
  timeSpent: number;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  // Additional data like quiz scores, exercise completion
  @ApiProperty({ example: { quizScore: 90, attempts: 2 } })
  @Column({ type: 'jsonb', nullable: true })
  additionalData: Record<string, any>;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @ManyToOne(() => Lesson, (lesson) => lesson.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}