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
import { Submission } from './submission.entity';
import { Course } from '@circle-backend/modules/course/entities/course.entity';
import { Module as MyModule } from '@circle-backend/modules/course/entities/module.entity';

export enum AssignmentType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

@Entity('assignments')
export class Assignment {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Build a REST API with NestJS' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Create a complete REST API with authentication' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'Detailed instructions for the assignment...' })
  @Column({ type: 'text' })
  instructions: string;

  @ApiProperty({ enum: AssignmentType, example: AssignmentType.INDIVIDUAL })
  @Column({ type: 'enum', enum: AssignmentType })
  type: AssignmentType;

  @ApiProperty({ enum: AssignmentStatus, example: AssignmentStatus.PUBLISHED })
  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.DRAFT })
  status: AssignmentStatus;

  @ApiProperty({ example: 100 })
  @Column({ type: 'integer', default: 100 })
  maxPoints: number;

  @ApiProperty({ example: 60 })
  @Column({ type: 'integer', nullable: true, comment: 'Minimum score to pass' })
  passingScore: number;

  @ApiProperty({ example: '2024-02-15T23:59:59.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: false })
  allowLateSubmission: boolean;

  @ApiProperty({ example: 10 })
  @Column({ type: 'integer', default: 0, comment: 'Penalty percentage for late submissions' })
  latePenalty: number;

  @ApiProperty({ example: 3 })
  @Column({ type: 'integer', nullable: true, default: null, comment: 'null means unlimited attempts' })
  maxAttempts: number;

  @ApiProperty({ example: 3 })
  @Column({ type: 'integer', nullable: true, comment: 'Max team size for group assignments' })
  maxTeamSize: number;

  // Foreign Keys
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', nullable: true })
  moduleId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  createdBy: string;

  // Attachments/Resources
  @ApiProperty({ example: ['https://example.com/starter-code.zip'] })
  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @ApiProperty({ example: { rubric: 'grading criteria' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => MyModule)
  @JoinColumn({ name: 'moduleId' })
  module: MyModule;

  @OneToMany(() => Submission, (submission) => submission.assignment)
  submissions: Submission[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}