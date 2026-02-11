import { IsString, IsUUID } from 'class-validator';
import {
  IsNotEmptyField,
  IsOptionalField,
  IsBooleanField,
} from '../../../common/decorators/api-properties';

export class CreateClubDto {
  @IsNotEmptyField({
    example: 'Node.js Study Group',
    description: 'Human-friendly club name',
  })
  @IsString()
  name: string;

  @IsOptionalField({ example: 'Weekly meetup to build stuff together' })
  @IsString()
  description?: string;

  @IsNotEmptyField({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Category id referencing categories table',
  })
  @IsUUID()
  @IsString()
  categoryId: string;

  @IsNotEmptyField({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'User id of the club creator',
  })
  @IsUUID()
  @IsString()
  creatorId: string;

  @IsOptionalField({ example: true })
  @IsBooleanField()
  isActive?: boolean = true;
}
