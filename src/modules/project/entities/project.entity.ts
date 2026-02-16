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
import { ProjectTeam } from './project-team.entity';
import { Course } from '@circle-backend/modules/course/entities/course.entity';
import { Module as MyModule } from '@circle-backend/modules/course/entities/module.entity';

export enum ProjectType {
  GROUP = 'group',
  INDIVIDUAL = 'individual',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Build a Social Media Platform' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 'Create a full-stack social media application' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'Detailed project requirements and guidelines...' })
  @Column({ type: 'text' })
  requirements: string;

  @ApiProperty({ enum: ProjectType, example: ProjectType.GROUP })
  @Column({ type: 'enum', enum: ProjectType })
  type: ProjectType;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @ApiProperty({ example: 2 })
  @Column({ type: 'integer', default: 2 })
  minTeamSize: number;

  @ApiProperty({ example: 5 })
  @Column({ type: 'integer', default: 5 })
  maxTeamSize: number;

  @ApiProperty({ example: '2024-03-01T00:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @ApiProperty({ example: '2024-04-30T23:59:59.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @ApiProperty({ example: 200 })
  @Column({ type: 'integer', default: 100 })
  maxPoints: number;

  // Milestones and deliverables
  @ApiProperty({ 
    example: [
      { title: 'Project Proposal', dueDate: '2024-03-15', points: 20 },
      { title: 'Mid-term Demo', dueDate: '2024-04-01', points: 50 },
      { title: 'Final Presentation', dueDate: '2024-04-30', points: 130 }
    ] 
  })
  @Column({ type: 'jsonb', nullable: true })
  milestones: Array<{
    title: string;
    description?: string;
    dueDate: string;
    points: number;
  }>;

  // Technologies or skills required
  @ApiProperty({ example: ['NestJS', 'React', 'PostgreSQL', 'Docker'] })
  @Column({ type: 'jsonb', nullable: true })
  technologies: string[];

  @ApiProperty({ example: ['https://example.com/project-template.zip'] })
  @Column({ type: 'jsonb', nullable: true })
  resources: string[];

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

  @ApiProperty({ example: { evaluationCriteria: 'rubric details' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => MyModule)
  @JoinColumn({ name: 'moduleId' })
  module: MyModule;

  @OneToMany(() => ProjectTeam, (team) => team.project)
  teams: ProjectTeam[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}