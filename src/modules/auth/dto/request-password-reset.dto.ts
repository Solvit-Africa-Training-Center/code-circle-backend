import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send password reset link to',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
