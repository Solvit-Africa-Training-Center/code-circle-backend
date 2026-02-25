import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCollaborationMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

