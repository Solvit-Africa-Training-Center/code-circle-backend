import { ApiProperty } from '@nestjs/swagger';
import { scopeInterface } from '../enums/scope.enum';

class RoleDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'Role name',
  })
  name: string;

  @ApiProperty({
    enum: scopeInterface,
    example: scopeInterface.GLOBAL,
    description: 'Role scope',
  })
  scope: scopeInterface;
}

export class CurrentUserDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    type: [RoleDto],
    description: 'User roles with their scopes',
  })
  roles: RoleDto[];

  @ApiProperty({
    type: [String],
    example: ['user:read', 'user:write', 'role:read'],
    description: 'Resolved permissions from roles and direct assignments',
  })
  permissions: string[];
}
