import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export class SubmitProjectDto {
  @ApiProperty({
    example: 'Our project implements a full-stack social media platform...',
    description: 'Project submission content/description',
  })
  @IsString()
  @IsNotEmpty()
  submissionContent: string;

  @ApiPropertyOptional({
    example: ['https://example.com/presentation.pdf', 'https://example.com/demo-video.mp4'],
    description: 'Submission attachment URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  submissionAttachments?: string[];

  @ApiPropertyOptional({
    example: 'https://github.com/team-alpha/project',
    description: 'Repository URL',
  })
  @IsOptional()
  @IsString()
  repositoryUrl?: string;

  @ApiPropertyOptional({
    example: 'https://team-alpha-demo.netlify.app',
    description: 'Demo URL',
  })
  @IsOptional()
  @IsString()
  demoUrl?: string;
}