import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { scopeInterface } from '../enums/scope.enum';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Name of the role (uppercase, underscores allowed)',
    example: 'CLUB_MANAGER',
  })
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  @MaxLength(50, { message: 'Role name must not exceed 50 characters' })
  @Matches(/^[A-Z_]+$/, {
    message: 'Role name must be uppercase letters and underscores only',
  })
  name: string;

  @ApiProperty({
    enum: scopeInterface,
    description: 'Scope of the role (GLOBAL or CLUB)',
    example: scopeInterface.GLOBAL,
  })
  @IsEnum(scopeInterface, { message: 'Invalid scope' })
  @IsNotEmpty({ message: 'Role scope is required' })
  scope: scopeInterface;

  @ApiPropertyOptional({
    description: 'Description of the role and its permissions',
    example: 'Club manager with full access to club resources',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;
}