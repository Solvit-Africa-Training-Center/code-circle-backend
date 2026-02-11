import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category UUID',
  })
  id: string;

  @ApiProperty({
    example: 'Intelligence Artificielle',
    description: 'Category name',
  })
  name: string;

  @ApiProperty({
    example: 'intelligence-artificielle',
    description: 'URL-friendly slug',
  })
  slug: string;

  @ApiPropertyOptional({
    example: "Tout ce qui concerne l'IA et le machine learning",
    description: 'Category description',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'ai-icon.svg',
    description: 'Icon URL',
  })
  icon?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the category is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: 5,
    description: 'Number of clubs in this category',
  })
  clubsCount?: number;
}
