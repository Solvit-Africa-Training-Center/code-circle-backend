import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'CurrentP@ssw0rd',
    description: 'Current password',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    example: 'NewStrongP@ssw0rd',
    description:
      'New password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
  })
  newPassword: string;
}