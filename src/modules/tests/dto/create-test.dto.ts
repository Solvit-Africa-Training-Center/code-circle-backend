import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestType, TestDifficulty } from '../enums/test-type.enum';
import { CreateTestQuestionDto } from './create-test-question.dto';

export class CreateTestDto {
  @ApiProperty({
    enum: TestType,
    example: TestType.CREATOR_TEST,
    description: 'Type of test',
  })
  @IsEnum(TestType)
  type: TestType;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category UUID',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Club UUID (required for MEMBER_TEST)',
  })
  @IsOptional()
  @IsUUID()
  clubId?: string;

  @ApiPropertyOptional({
    enum: TestDifficulty,
    example: TestDifficulty.INTERMEDIATE,
    description: 'Difficulty level',
  })
  @IsOptional()
  @IsEnum(TestDifficulty)
  difficulty?: TestDifficulty;

  @ApiProperty({
    example: 70,
    description: 'Minimum score to pass (percentage)',
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore: number;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID who created the test (null if AI-generated)',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiProperty({
    type: [CreateTestQuestionDto],
    description: 'List of questions for the test',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTestQuestionDto)
  questions: CreateTestQuestionDto[];
}
