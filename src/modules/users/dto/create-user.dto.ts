
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
	@ApiProperty({ example: 'user name', description: 'First name of the user' })
	@IsString()
	firstName: string;

	@ApiProperty({ example: 'user last name', description: 'Last name of the user' })
	@IsString()
	lastName: string;

	@ApiProperty({ example: 'user@example.com', description: 'Email address' })
	@IsEmail()
	email: string;

	@ApiPropertyOptional({ example: 'password123', description: 'Optional password' })
	@IsOptional()
	@IsString()
	password?: string;
}
