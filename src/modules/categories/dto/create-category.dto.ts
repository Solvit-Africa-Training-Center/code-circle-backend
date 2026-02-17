/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IsNotEmpty, IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Intelligence Artificielle',
    description: 'Category name',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example:
      "Tout ce qui concerne l'IA, le machine learning et le deep learning",
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'ai-icon.svg',
    description: 'Icon URL or filename',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  // Le slug sera généré automatiquement depuis le name
 
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the category is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
