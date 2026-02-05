import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleType } from '../entities/user.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@ApiPropertyOptional({ example: 'John', description: 'First name of the user' })
	firstName?: string;

	@ApiPropertyOptional({ example: 'Doe', description: 'Last name of the user' })
	lastName?: string;

	@ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Email address' })
	email?: string;

	@ApiPropertyOptional({ enum: UserRoleType, example: UserRoleType.MEMBER, description: 'Role of the user' })
	role?: UserRoleType;

	@ApiPropertyOptional({ example: 'password123', description: 'Optional password' })
	password?: string;
}
