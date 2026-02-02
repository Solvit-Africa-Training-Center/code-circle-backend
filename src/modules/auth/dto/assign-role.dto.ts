import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    type: [String],
    description: 'Array of role IDs to assign to the user',
    example: [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one role ID must be provided' })
  @IsUUID('4', { each: true, message: 'Each role ID must be a valid UUID' })
  roleIds: string[];
}