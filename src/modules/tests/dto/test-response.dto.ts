import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestType, TestDifficulty } from '../enums/test-type.enum';

export class TestQuestionResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    example: 'What is the capital of France?',
  })
  question: string;

  @ApiProperty({
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
  })
  options: string[];

  @ApiProperty({
    example: 10,
  })
  points: number;

  @ApiProperty({
    example: 1,
  })
  orderIndex: number;

  // correctAnswer n'est PAS exposé au frontend
}

export class TestResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    enum: TestType,
    example: TestType.CREATOR_TEST,
  })
  type: TestType;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  clubId?: string;

  @ApiPropertyOptional({
    enum: TestDifficulty,
    example: TestDifficulty.INTERMEDIATE,
  })
  difficulty?: TestDifficulty;

  @ApiProperty({
    example: 70,
  })
  passingScore: number;

  @ApiProperty({
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    type: [TestQuestionResponseDto],
  })
  questions: TestQuestionResponseDto[];

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

export class TestAttemptResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  testId: string;

  @ApiProperty({
    example: 85,
  })
  score: number;

  @ApiProperty({
    example: true,
  })
  passed: boolean;

  @ApiProperty({
    example: false,
  })
  correctedByAI: boolean;

  @ApiPropertyOptional({
    example: 'Great job! You demonstrated strong understanding.',
  })
  feedback?: string;

  @ApiProperty({
    example: '2024-01-01T10:00:00.000Z',
  })
  attemptedAt: Date;

  @ApiProperty({
    example: '2024-01-01T10:30:00.000Z',
  })
  completedAt: Date;
}
