import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Assignment } from './assignment.entity';

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  GRADED = 'graded',
  RETURNED = 'returned',
}

@Entity('submissions')
@Index(['assignmentId', 'userId'])
export class Submission {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  assignmentId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', nullable: true, comment: 'For group assignments' })
  teamId: string;

  @ApiProperty({ example: 'Here is my solution to the assignment...' })
  @Column({ type: 'text', nullable: true })
  content: string;

  @ApiProperty({ example: ['https://example.com/submission.zip', 'https://github.com/user/repo'] })
  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @ApiProperty({ example: 'https://github.com/user/assignment-repo' })
  @Column({ type: 'varchar', nullable: true })
  repositoryUrl: string;

  @ApiProperty({ enum: SubmissionStatus, example: SubmissionStatus.SUBMITTED })
  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.DRAFT })
  status: SubmissionStatus;

  @ApiProperty({ example: 85 })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @ApiProperty({ example: 'Good work! Consider improving error handling.' })
  @Column({ type: 'text', nullable: true })
  feedback?: string | null;

  @ApiProperty({ example: 1 })
  @Column({ type: 'integer', default: 1 })
  attemptNumber: number;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isLate: boolean;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @ApiProperty({ example: '2024-01-20T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', nullable: true })
  gradedBy: string;

  @ManyToOne(() => Assignment, (assignment) => assignment.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

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