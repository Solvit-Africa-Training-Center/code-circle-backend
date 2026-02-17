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
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('modules')
export class Module {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Introduction to NestJS' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Learn the fundamentals of NestJS framework' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 1 })
  @Column({ type: 'integer' })
  orderIndex: number;

  @ApiProperty({ example: 5 })
  @Column({ type: 'integer', default: 0, comment: 'Estimated hours for this module' })
  duration: number;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @OneToMany(() => Lesson, (lesson) => lesson.module, { cascade: true })
  lessons: Lesson[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}