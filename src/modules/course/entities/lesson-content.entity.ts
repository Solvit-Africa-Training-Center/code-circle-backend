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
import { Lesson } from './lesson.entity';

export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  CODE_EXERCISE = 'code_exercise',
  EXTERNAL_LINK = 'external_link',
  FILE = 'file',
}

@Entity('lesson_contents')
export class LessonContent {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: ContentType, example: ContentType.VIDEO })
  @Column({ type: 'enum', enum: ContentType })
  type: ContentType;

  @ApiProperty({ example: 1 })
  @Column({ type: 'integer' })
  orderIndex: number;

  @ApiProperty({ example: 'https://example.com/videos/lesson1.mp4' })
  @Column({ type: 'varchar', nullable: true })
  url: string;

  @ApiProperty({ example: 'This is the lesson content...' })
  @Column({ type: 'text', nullable: true })
  content: string;

  @ApiProperty({ example: 'NestJS Official Documentation' })
  @Column({ type: 'varchar', nullable: true })
  linkTitle: string;

  @ApiProperty({ example: 'https://docs.nestjs.com' })
  @Column({ type: 'varchar', nullable: true })
  linkUrl: string;

  @ApiProperty({ example: 'Create a NestJS controller' })
  @Column({ type: 'text', nullable: true })
  exerciseInstructions: string;

  @ApiProperty({ example: 'typescript' })
  @Column({ type: 'varchar', nullable: true })
  codeLanguage: string;

  @ApiProperty({ example: 'console.log("Hello World");' })
  @Column({ type: 'text', nullable: true })
  starterCode: string;

  @ApiProperty({ example: 'console.log("Hello World");' })
  @Column({ type: 'text', nullable: true })
  solutionCode: string;

  @ApiProperty({ example: { duration: 300, resolution: '1080p' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}