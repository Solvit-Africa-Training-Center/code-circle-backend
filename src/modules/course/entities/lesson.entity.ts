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
import { LessonContent } from './lesson-content.entity';
import { Progress } from './progress.entity';

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  CODE_EXERCISE = 'code_exercise',
  EXTERNAL_LINK = 'external_link',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

@Entity('lessons')
export class Lesson {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Setting up NestJS Project' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Learn how to set up a new NestJS project from scratch' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ enum: LessonType, example: LessonType.VIDEO })
  @Column({ type: 'enum', enum: LessonType })
  type: LessonType;

  @ApiProperty({ example: 1 })
  @Column({ type: 'integer' })
  orderIndex: number;

  @ApiProperty({ example: 30 })
  @Column({ type: 'integer', default: 0, comment: 'Duration in minutes' })
  duration: number;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isMandatory: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @OneToMany(() => LessonContent, (content) => content.lesson, { cascade: true })
  contents: LessonContent[];

  @OneToMany(() => Progress, (progress) => progress.lesson)
  progress: Progress[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}