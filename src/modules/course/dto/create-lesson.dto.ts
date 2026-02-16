import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LessonType } from '../entities/lesson.entity';
import { ContentType } from '../entities/lesson-content.entity';

export class LessonContentDto {
  @ApiProperty({
    enum: ContentType,
    example: ContentType.VIDEO,
    description: 'Type of content',
  })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({
    example: 1,
    description: 'Order index for content sequencing',
  })
  @IsNumber()
  orderIndex: number;

  @ApiPropertyOptional({
    example: 'https://example.com/videos/lesson1.mp4',
    description: 'URL for video or file content',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    example: 'This is the lesson content in markdown or HTML format...',
    description: 'Text content or code exercise',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example: 'NestJS Official Documentation',
    description: 'Title for external links',
  })
  @IsOptional()
  @IsString()
  linkTitle?: string;

  @ApiPropertyOptional({
    example: 'https://docs.nestjs.com',
    description: 'External link URL',
  })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({
    example: 'Create a NestJS controller that handles GET and POST requests',
    description: 'Instructions for code exercises',
  })
  @IsOptional()
  @IsString()
  exerciseInstructions?: string;

  @ApiPropertyOptional({
    example: 'typescript',
    description: 'Programming language for code exercises',
  })
  @IsOptional()
  @IsString()
  codeLanguage?: string;

  @ApiPropertyOptional({
    example: 'import { Controller } from "@nestjs/common";',
    description: 'Starter code for exercises',
  })
  @IsOptional()
  @IsString()
  starterCode?: string;

  @ApiPropertyOptional({
    example: 'import { Controller, Get } from "@nestjs/common";...',
    description: 'Solution code for exercises',
  })
  @IsOptional()
  @IsString()
  solutionCode?: string;

  @ApiPropertyOptional({
    example: { duration: 300, resolution: '1080p' },
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateLessonDto {
  @ApiProperty({
    example: 'Setting up NestJS Project',
    description: 'Lesson title',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Learn how to set up a new NestJS project from scratch',
    description: 'Lesson description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: LessonType,
    example: LessonType.VIDEO,
    description: 'Type of lesson',
  })
  @IsEnum(LessonType)
  type: LessonType;

  @ApiProperty({
    example: 1,
    description: 'Order index for lesson sequencing',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  orderIndex: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Duration in minutes',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the lesson is published',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether completing this lesson is mandatory',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({
    type: [LessonContentDto],
    description: 'Lesson content items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonContentDto)
  contents?: LessonContentDto[];
}