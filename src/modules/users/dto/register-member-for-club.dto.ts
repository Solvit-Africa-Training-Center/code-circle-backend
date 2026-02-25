import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RegisterMemberForClubDto {
  @ApiProperty({
    example: 'Jane Doe',
    description: 'Full name of the member applicant',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({
    example: 'jane@example.com',
    description: 'Email of the member applicant',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Target club ID',
  })
  @IsUUID()
  @IsNotEmpty()
  clubId: string;
}
