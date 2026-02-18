import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsArray,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
  Max,
  IsDate,
} from 'class-validator';
import { AssignmentType, AssignmentStatus } from '../entities/assignment.entity';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @ApiProperty({
    example: 'Build a REST API with NestJS',
    description: 'Assignment title',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Create a complete REST API with authentication and CRUD operations',
    description: 'Assignment description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'Detailed instructions for completing the assignment...',
    description: 'Step-by-step instructions',
  })
  @IsString()
  @IsNotEmpty()
  instructions: string;

  @ApiProperty({
    enum: AssignmentType,
    example: AssignmentType.INDIVIDUAL,
    description: 'Type of assignment',
  })
  @IsEnum(AssignmentType)
  type: AssignmentType;

  @ApiPropertyOptional({
    enum: AssignmentStatus,
    example: AssignmentStatus.DRAFT,
    description: 'Assignment status',
    default: AssignmentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum points for this assignment',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPoints?: number;

  @ApiPropertyOptional({
    example: 60,
    description: 'Minimum score required to pass',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;

  @ApiPropertyOptional({
    example: '2024-02-15T23:59:59.000Z',
    description: 'Assignment due date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    example: true,
    description: 'Allow submissions after due date',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean;

  @ApiPropertyOptional({
    example: 10,
    description: 'Percentage penalty for late submissions',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  latePenalty?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Maximum number of submission attempts',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Require peer review for this assignment',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requirePeerReview?: boolean;

  @ApiPropertyOptional({
    example: 2,
    description: 'Minimum number of peer reviews required',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPeerReviews?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Maximum team size for group assignments',
    minimum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  maxTeamSize?: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Course ID this assignment belongs to',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Module ID this assignment belongs to (optional)',
  })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/starter-code.zip'],
    description: 'Attachment URLs (resources, starter code, etc.)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    example: { rubric: 'grading criteria details' },
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}