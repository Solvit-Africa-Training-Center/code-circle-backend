import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CollaborationTaskStatus } from '../entities/collaboration-task.entity';

export class CreateCollaborationTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsEnum(CollaborationTaskStatus)
  status?: CollaborationTaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

