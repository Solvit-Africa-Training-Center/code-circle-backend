import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class GradeProjectDto {
  @ApiProperty({
    example: 185,
    description: 'Score for the project submission',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({
    example: 'Excellent implementation with great UI/UX! Consider adding more test coverage.',
    description: 'Feedback for the team',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}