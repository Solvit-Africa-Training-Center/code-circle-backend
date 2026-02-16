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
import { Project } from './project.entity';

export enum TeamStatus {
  FORMING = 'forming',
  ACTIVE = 'active',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  DISBANDED = 'disbanded',
}

export enum MemberRole {
  LEADER = 'leader',
  MEMBER = 'member',
}

@Entity('project_teams')
export class ProjectTeam {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Team Alpha' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ example: 'We are passionate developers building amazing things!' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid' })
  projectId: string;

  @ApiProperty({ enum: TeamStatus, example: TeamStatus.ACTIVE })
  @Column({ type: 'enum', enum: TeamStatus, default: TeamStatus.FORMING })
  status: TeamStatus;

  // Team members with roles
  @ApiProperty({ 
    example: [
      { userId: 'uuid-1', role: 'leader', joinedAt: '2024-01-15T10:00:00.000Z' },
      { userId: 'uuid-2', role: 'member', joinedAt: '2024-01-15T11:00:00.000Z' }
    ] 
  })
  @Column({ type: 'jsonb' })
  members: Array<{
    userId: string;
    role: MemberRole;
    joinedAt: Date;
  }>;

  @ApiProperty({ example: 'https://github.com/team-alpha/project' })
  @Column({ type: 'varchar', nullable: true })
  repositoryUrl: string;

  @ApiProperty({ example: 'https://team-alpha-demo.netlify.app' })
  @Column({ type: 'varchar', nullable: true })
  demoUrl: string;

  // Project submission
  @ApiProperty({ example: 'Our project implements a full-stack social media platform...' })
  @Column({ type: 'text', nullable: true })
  submissionContent: string;

  @ApiProperty({ example: ['https://example.com/presentation.pdf', 'https://example.com/demo-video.mp4'] })
  @Column({ type: 'jsonb', nullable: true })
  submissionAttachments: string[] | null;

  @ApiProperty({ example: '2024-04-30T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  // Grading
  @ApiProperty({ example: 185 })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @ApiProperty({ example: 'Excellent implementation with great UI/UX!' })
  @Column({ type: 'text', nullable: true })
  feedback?: string | null;

  @ApiProperty({ example: '2024-05-05T10:00:00.000Z' })
  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Column({ type: 'uuid', nullable: true })
  gradedBy: string;

  // Milestone tracking
  @ApiProperty({ 
    example: {
      'milestone-1': { completed: true, score: 18, completedAt: '2024-03-15' },
      'milestone-2': { completed: true, score: 45, completedAt: '2024-04-01' }
    } 
  })
  @Column({ type: 'jsonb', nullable: true })
  milestoneProgress: Record<string, {
    completed: boolean;
    score?: number;
    completedAt?: Date;
    feedback?: string;
  }>;

  // Relations
  @ManyToOne(() => Project, (project) => project.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}