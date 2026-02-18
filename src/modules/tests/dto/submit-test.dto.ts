import {
  IsUUID,
  IsObject,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestPurpose } from '../enums/test-type.enum'; // ← Import depuis ton fichier enum

export class SubmitTestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID (from registration)',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string | undefined;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Test UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  testId: string | undefined;

  @ApiProperty({
    example: {
      'question-uuid-1': 'Paris',
      'question-uuid-2': 'Blue',
    },
    description: 'User answers - { questionId: selectedAnswer }',
  })
  @IsObject()
  @IsNotEmpty()
  answers: Record<string, string> | undefined;

  @ApiProperty({
    enum: TestPurpose,
    example: TestPurpose.CREATE_CLUB,
    description: 'Purpose of the test',
  })
  @IsEnum(TestPurpose)
  @IsNotEmpty()
  purpose: TestPurpose | undefined;

  // Si purpose = CREATE_CLUB
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID (required if purpose is CREATE_CLUB)',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'AI Masters Club',
    description: 'Intended club name (required if purpose is CREATE_CLUB)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  clubName?: string;

  // Si purpose = JOIN_CLUB
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Target club ID (required if purpose is JOIN_CLUB)',
  })
  @IsOptional()
  @IsUUID()
  targetClubId?: string;
}
