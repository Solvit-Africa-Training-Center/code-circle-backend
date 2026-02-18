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
import { Module } from './module.entity';
import { Enrollment } from './enrollment.entity';

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('courses')
export class Course {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Advanced NestJS Development' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Learn advanced NestJS concepts and best practices' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'https://example.com/course-thumbnail.jpg' })
  @Column({ type: 'varchar', nullable: true })
  thumbnail: string;

  @ApiProperty({ enum: CourseLevel, example: CourseLevel.INTERMEDIATE })
  @Column({ type: 'enum', enum: CourseLevel, default: CourseLevel.BEGINNER })
  level: CourseLevel;

  @ApiProperty({ enum: CourseStatus, example: CourseStatus.PUBLISHED })
  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT })
  status: CourseStatus;

  @ApiProperty({ example: 40 })
  @Column({ type: 'integer', default: 0, comment: 'Estimated hours to complete' })
  duration: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  clubId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', comment: 'Club owner who created the course' })
  createdBy: string;

  // Relations (you'll need to import these from your existing models)
  // @ManyToOne(() => Club, (club) => club.courses)
  // @JoinColumn({ name: 'clubId' })
  // club: Club;

  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'createdBy' })
  // creator: User;

  @OneToMany(() => Module, (module) => module.course, { cascade: true })
  modules: Module[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}