import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsDate,
  IsArray,
  MaxLength,
  MinLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuizType, QuizStatus } from '../entities/quiz.entity';
import { QuestionType } from '../entities/quiz-question.entity';

export class QuizOptionDto {
  @ApiProperty({ example: 'a' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'To add metadata' })
  @IsString()
  text: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuizQuestionDto {
  @ApiProperty({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 1 })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ example: 'What is NestJS?' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ example: 'NestJS is a framework...' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiPropertyOptional({ type: [QuizOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options?: QuizOptionDto[];

  @ApiPropertyOptional({ example: ['correct answer'] })
  @IsOptional()
  @IsArray()
  correctAnswers?: string[];

  @ApiPropertyOptional({ example: 'console.log();' })
  @IsOptional()
  @IsString()
  starterCode?: string;

  @ApiPropertyOptional({ example: 'typescript' })
  @IsOptional()
  @IsString()
  codeLanguage?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;
}

export class CreateQuizDto {
  @ApiProperty({ example: 'NestJS Quiz', minLength: 3, maxLength: 255 })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Test your knowledge' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: QuizType, example: QuizType.GRADED })
  @IsEnum(QuizType)
  type: QuizType;

  @ApiPropertyOptional({ enum: QuizStatus, default: QuizStatus.DRAFT })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  maxPoints?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  maxAttempts?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shuffleAnswers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  showResultsImmediately?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  availableFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  availableUntil?: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ type: [CreateQuizQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}