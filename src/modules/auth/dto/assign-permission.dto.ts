import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of permission IDs to assign to the role',
    example: [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one permission ID must be provided' })
  @IsUUID('4', {
    each: true,
    message: 'Each permission ID must be a valid UUID',
  })
  permissionIds: string[];
}
