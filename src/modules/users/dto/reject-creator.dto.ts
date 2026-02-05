import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectCreatorDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'User ID (UUID) to reject' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Insufficient information', description: 'Reason for rejection' })
  @IsString()
  reason: string;
}