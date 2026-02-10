import { IsUUID, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitTestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Test UUID',
  })
  @IsUUID()
  testId: string;

  @ApiProperty({
    example: {
      'question-uuid-1': 'Paris',
      'question-uuid-2': 'Blue',
    },
    description: 'User answers - { questionId: selectedAnswer }',
  })
  @IsObject()
  @IsNotEmpty()
  answers: Record<string, string>;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Club UUID (optional, if joining a club)',
  })
  @IsUUID()
  @IsNotEmpty()
  clubId?: string;
}
