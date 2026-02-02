import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd',
    description: 'User password',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: '123456',
    description: '6-digit 2FA code (required if 2FA is enabled)',
    minLength: 6,
    maxLength: 6,
  })
  @IsOptional()
  @IsString()
  @Length(6, 8, { message: '2FA code must be 6-8 characters' })
  twoFactorCode?: string;
}