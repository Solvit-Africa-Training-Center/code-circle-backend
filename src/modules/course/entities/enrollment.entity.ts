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
import { Course } from './course.entity';
import { Progress } from './progress.entity';
import { User } from '@circle-backend/modules/users/entities/user.entity';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

@Entity('enrollments')
@Index(['userId', 'courseId'], { unique: true })
export class Enrollment {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.ACTIVE })
  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.ACTIVE })
  status: EnrollmentStatus;

  @ApiProperty({ example: 75.5 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Course, (course) => course.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @OneToMany(() => Progress, (progress) => progress.enrollment)
  progress: Progress[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  enrolledAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}