import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestQuestionDto {
  @ApiProperty({
    example: 'What is the capital of France?',
    description: 'Question text',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
    description: 'Answer options',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    example: 'Paris',
    description: 'Correct answer (must match one of the options)',
  })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty({
    example: 10,
    description: 'Points for this question',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    example: 1,
    description: 'Order index for display',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  orderIndex: number;
}
