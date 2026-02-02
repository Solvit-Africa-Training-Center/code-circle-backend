import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsEmail, IsOptional } from 'class-validator';
import { AuthProvider } from '../enums/auth-provider';

export class OAuthLoginDto {
  @ApiProperty({
    enum: AuthProvider,
    example: AuthProvider.GOOGLE,
    description: 'OAuth provider',
  })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({
    example: 'google-user-id-123',
    description: 'Provider-specific user ID',
  })
  @IsString()
  providerId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email from OAuth provider',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name from OAuth provider',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name from OAuth provider',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'ya29.a0AfH6SMBx...',
    description: 'OAuth provider access token',
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({
    example: '1//0gSHrZK3...',
    description: 'OAuth provider refresh token',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}