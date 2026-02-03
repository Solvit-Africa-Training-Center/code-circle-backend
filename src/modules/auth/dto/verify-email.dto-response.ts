import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the verification was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Email verified successfully',
    description: 'Status message',
  })
  message?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Verified user ID',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Verified email address',
  })
  email: string;
}
