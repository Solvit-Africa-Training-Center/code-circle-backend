import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class CreatePeerReviewDto {
  @ApiProperty({
    example: 85,
    description: 'Overall score for the submission',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({
    example: 'Well structured code with good documentation.',
    description: 'Review comments',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    example: {
      codeQuality: 90,
      documentation: 80,
      functionality: 85,
      creativity: 75,
    },
    description: 'Detailed rubric scores',
  })
  @IsOptional()
  rubricScores?: Record<string, number>;

  @ApiPropertyOptional({
    example: ['Good error handling', 'Clean code structure', 'Comprehensive tests'],
    description: 'Identified strengths',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @ApiPropertyOptional({
    example: ['Add more comments', 'Optimize database queries', 'Improve UI/UX'],
    description: 'Suggestions for improvement',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvements?: string[];
}

export class UpdatePeerReviewDto {
  @ApiPropertyOptional({
    example: 90,
    description: 'Updated score',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({
    example: 'Updated comments...',
    description: 'Updated review comments',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    example: {
      codeQuality: 95,
      documentation: 85,
    },
    description: 'Updated rubric scores',
  })
  @IsOptional()
  rubricScores?: Record<string, number>;

  @ApiPropertyOptional({
    example: ['Excellent testing'],
    description: 'Updated strengths',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @ApiPropertyOptional({
    example: ['Consider edge cases'],
    description: 'Updated improvements',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvements?: string[];
}