import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBase64,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterForTestDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format',
  })
  phone: string;

  @ApiProperty({
    example: 'Experienced software developer with 5+ years in web development',
    description: 'User bio',
  })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({
    example: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy...',
    description: 'CV file as base64 string (PDF format). Must include data URI prefix: data:application/pdf;base64,',
    type: String,
    format: 'binary',
  })
  @IsBase64()
  @IsNotEmpty()
  cv: string;

  @ApiPropertyOptional({
    example: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy...',
    description: 'Degree certificate as base64 string (PDF format, optional). Must include data URI prefix: data:application/pdf;base64,',
    type: String,
    format: 'binary',
  })
  @IsOptional()
  @IsBase64()
  degree?: string;
}

