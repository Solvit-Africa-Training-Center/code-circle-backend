import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterForTestFormDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CV file (PDF format)',
  })
  cv: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Degree certificate file (PDF format, optional)',
  })
  degree?: Express.Multer.File;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  fullName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number in international format',
  })
  phone: string;

  @ApiProperty({
    example: 'Experienced software developer with 5+ years in web development',
    description: 'User bio',
  })
  bio: string;
}
