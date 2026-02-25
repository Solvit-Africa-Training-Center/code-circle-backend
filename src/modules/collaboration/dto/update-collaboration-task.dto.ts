import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CollaborationTaskStatus } from '../entities/collaboration-task.entity';

export class UpdateCollaborationTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(CollaborationTaskStatus)
  status?: CollaborationTaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

