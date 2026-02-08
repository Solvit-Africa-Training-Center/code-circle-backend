import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@ApiPropertyOptional({ example: 'user first name', description: 'First name of the user' })
	firstName?: string;

	@ApiPropertyOptional({ example: 'user last name', description: 'Last name of the user' })
	lastName?: string;

	@ApiPropertyOptional({ example: 'user@example.com', description: 'Email address' })
	email?: string;

	@ApiPropertyOptional({ example: 'password123', description: 'Optional password' })
	password?: string;
}
