import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class Disable2FADto {
  @ApiProperty({
    example: '123456',
    description:
      '6-digit verification code from authenticator app or backup code',
    minLength: 6,
  })
  @IsString()
  @Length(6, 16, {
    message: 'Code must be 6-16 characters (6 for TOTP, 8-16 for backup code)',
  })
  code: string;
}
