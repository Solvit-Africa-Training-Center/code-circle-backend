import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCollaborationCodeSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  language: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

