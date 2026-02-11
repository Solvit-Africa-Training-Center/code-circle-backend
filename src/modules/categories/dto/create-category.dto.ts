/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional category icon upload',
  })
  @IsOptional()
  file?: unknown;

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
  @Transform(({ obj }) => {
    if (!obj.slug && obj.name) {
      return obj.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les espaces et caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ''); // Enlever les tirets au début et à la fin
    }
    return obj.slug;
  })
  @ApiPropertyOptional({
    example: 'intelligence-artificielle',
    description: 'URL-friendly slug (auto-generated from name if not provided)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;
}
