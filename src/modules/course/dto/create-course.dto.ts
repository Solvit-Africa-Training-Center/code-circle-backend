import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  MaxLength,
  MinLength,
  Min,
  IsUrl,
} from 'class-validator';
import { CourseLevel, CourseStatus } from '../entities/course.entity';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Advanced NestJS Development',
    description: 'Course title',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Learn advanced NestJS concepts including microservices, GraphQL, and testing',
    description: 'Detailed course description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    example: 'https://example.com/course-thumbnail.jpg',
    description: 'Course thumbnail URL',
  })
  @IsOptional()
  @IsUrl()
  thumbnail?: string;

  @ApiProperty({
    enum: CourseLevel,
    example: CourseLevel.INTERMEDIATE,
    description: 'Course difficulty level',
  })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiPropertyOptional({
    enum: CourseStatus,
    example: CourseStatus.DRAFT,
    description: 'Course status (defaults to DRAFT)',
    default: CourseStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({
    example: 40,
    description: 'Estimated hours to complete the course',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Club ID where this course belongs',
  })
  @IsUUID()
  @IsNotEmpty()
  clubId: string;
}