import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (valid for 15 minutes)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Refresh token (valid for 7 days)',
  })
  refreshToken: string;

  @ApiProperty({
    example: 'Login successful. Previous sessions have been logged out.',
    description: 'Status message',
  })
  message?: string;
}
