import { PartialType } from '@nestjs/swagger';
import { CreateQuizDto } from './create-quiz.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}

export class StartQuizAttemptDto {
  // Empty DTO - just to trigger the start
}

export class SubmitQuizAnswerDto {
  @ApiProperty({
    example: {
      'question-uuid-1': { answer: 'a' },
      'question-uuid-2': { answer: 'dependency injection' },
    },
    description: 'Answers mapped by question ID',
  })
  @IsObject()
  answers: Record<
    string,
    {
      answer: string | string[];
    }
  >;
}

export class GradeQuizDto {
  @ApiPropertyOptional({ example: 'Great job!' })
  @IsOptional()
  feedback?: string;
}