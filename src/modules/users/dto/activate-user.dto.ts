import { IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateUserDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    description: 'User ID (UUID) to activate/deactivate',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: true,
    description: 'Set true to activate, false to deactivate',
  })
  @IsBoolean()
  isActive: boolean;
}
