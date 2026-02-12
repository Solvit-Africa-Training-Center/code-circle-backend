import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveCreatorDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'User ID (UUID) to approve' })
  @IsUUID()
  userId: string;
}