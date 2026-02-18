import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDate,
  IsArray,
  MaxLength,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProjectType, ProjectStatus } from '../entities/project.entity';

export class MilestoneDto {
  @ApiProperty({ example: 'Project Proposal' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Submit project proposal document' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  points: number;
}

export class CreateProjectDto {
  @ApiProperty({
    example: 'Build a Social Media Platform',
    description: 'Project title',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Create a full-stack social media application with user authentication, posts, and comments',
    description: 'Project description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'Detailed requirements: 1. User authentication, 2. Post creation, 3. Comments system...',
    description: 'Detailed project requirements',
  })
  @IsString()
  @IsNotEmpty()
  requirements: string;

  @ApiProperty({
    enum: ProjectType,
    example: ProjectType.GROUP,
    description: 'Project type',
  })
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    example: ProjectStatus.DRAFT,
    description: 'Project status (defaults to DRAFT)',
    default: ProjectStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: 2,
    description: 'Minimum team size',
    minimum: 1,
    default: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minTeamSize?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Maximum team size',
    minimum: 1,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTeamSize?: number;

  @ApiPropertyOptional({
    example: '2024-03-01T00:00:00.000Z',
    description: 'Project start date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2024-04-30T23:59:59.000Z',
    description: 'Project end date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    example: 200,
    description: 'Maximum points for the project',
    minimum: 1,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPoints?: number;

  @ApiPropertyOptional({
    type: [MilestoneDto],
    description: 'Project milestones',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @ApiPropertyOptional({
    example: ['NestJS', 'React', 'PostgreSQL', 'Docker'],
    description: 'Required technologies',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({
    example: ['https://example.com/project-template.zip'],
    description: 'Resource URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Course ID this project belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Module ID (optional)',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => {
    if (value === null) return null;      
    if (!value) return undefined;         
    return value;                         
  })
  moduleId?: string | null;

  @ApiPropertyOptional({
    example: { evaluationCriteria: 'Detailed rubric' },
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}