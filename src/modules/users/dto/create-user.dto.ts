
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleType } from '../entities/user.entity';

export class CreateUserDto {
	@ApiProperty({ example: 'John', description: 'First name of the user' })
	@IsString()
	firstName: string;

	@ApiProperty({ example: 'Doe', description: 'Last name of the user' })
	@IsString()
	lastName: string;

	@ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
	@IsEmail()
	email: string;

	@ApiProperty({ enum: UserRoleType, example: UserRoleType.MEMBER, description: 'Role of the user' })
	@IsEnum(UserRoleType)
	role: UserRoleType;

	@ApiPropertyOptional({ example: 'password123', description: 'Optional password' })
	@IsOptional()
	@IsString()
	password?: string;
}
