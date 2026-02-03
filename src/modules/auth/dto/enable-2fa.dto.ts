import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class Enable2FADto {
  @ApiProperty({
    example: '123456',
    description: '6-digit verification code from authenticator app',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: '2FA code must contain only digits' })
  code: string;
}
