import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({
    example: 'Introduction to NestJS',
    description: 'Module title',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Learn the fundamentals of NestJS framework',
    description: 'Module description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'Order index for module sequencing',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  orderIndex: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Estimated hours for this module',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the module is published',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateModuleDto extends PartialType(CreateModuleDto){}