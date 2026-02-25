import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class ClubResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Club UUID',
  })
  id: string;

  @ApiProperty({
    example: 'AI Masters Club',
    description: 'Club name',
  })
  name: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category UUID',
  })
  categoryId: string;

  @ApiPropertyOptional({
    type: CategoryResponseDto,
    description: 'Category details',
  })
  category?: CategoryResponseDto;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Creator User UUID',
  })
  creatorId: string;

  @ApiPropertyOptional({
    example: 'A club dedicated to mastering AI and machine learning',
    description: 'Club description',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://images.example.com/clubs/ai-masters.jpg',
    description: 'Club cover image URL',
  })
  imageUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the club is active',
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
    example: 25,
    description: 'Number of members in this club',
  })
  membersCount?: number;

  @ApiPropertyOptional({
    example: 7,
    description: 'Number of projects in this club',
  })
  projectsCount?: number;
}
