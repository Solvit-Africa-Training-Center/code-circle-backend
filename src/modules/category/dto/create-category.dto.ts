import { IsString } from 'class-validator';
import {
  IsNotEmptyField,
  IsOptionalField,
} from '../../../common/decorators/api-properties';

export class CreateCategoryDto {
  @IsNotEmptyField({
    example: 'frontend',
    description: 'Unique category name',
  })
  @IsString()
  name: string;

  @IsOptionalField({
    example: 'Frontend development clubs',
  })
  @IsString()
  description?: string | null;

  @IsOptionalField({
    example: 'https://cdn.example.com/categories/frontend.png',
  })
  @IsString()
  image?: string | null;
}
