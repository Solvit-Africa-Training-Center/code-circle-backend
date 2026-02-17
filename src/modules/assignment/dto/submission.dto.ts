import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsUrl,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({
    example: 'Here is my solution to the assignment...',
    description: 'Submission content/explanation',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: ['https://example.com/submission.zip', 'https://example.com/screenshot.png'],
    description: 'Attachment URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    example: 'https://github.com/username/assignment-repo',
    description: 'GitHub repository URL',
  })
  @IsOptional()
  @IsUrl()
  repositoryUrl?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Team ID for group assignments',
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;
}

export class UpdateSubmissionDto {
  @ApiPropertyOptional({
    example: 'Updated submission content...',
    description: 'Updated content',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/updated-file.zip'],
    description: 'Updated attachments',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    example: 'https://github.com/username/updated-repo',
    description: 'Updated repository URL',
  })
  @IsOptional()
  @IsUrl()
  repositoryUrl?: string;
}

export class GradeSubmissionDto {
  @ApiProperty({
    example: 85,
    description: 'Score for the submission',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({
    example: 'Great work! Consider improving error handling.',
    description: 'Feedback for the student',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}