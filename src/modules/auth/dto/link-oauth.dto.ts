import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class LinkOAuthDto {
  @ApiProperty({
    example: 'google-user-id-123',
    description: 'Provider-specific user ID',
  })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email associated with OAuth account (optional)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}