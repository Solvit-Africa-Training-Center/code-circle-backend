import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example: 'Registration successful. Please check your email to verify your account.',
    description: 'Status message',
  })
  message: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Created user ID',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address',
  })
  email: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Email verification token (for development/testing only)',
  })
  verificationToken: string;
}