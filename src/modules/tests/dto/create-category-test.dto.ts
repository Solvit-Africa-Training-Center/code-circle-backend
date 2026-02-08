import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'AI', description: 'Category name (e.g. AI, Web)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ai', description: 'Slug for URLs (e.g. ai, web)' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Artificial Intelligence', description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/icon.png', description: 'Icon/image URL', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ example: true, description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateTestDto {
  @ApiProperty({ example: 'uuid-of-category', description: 'Category ID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'CREATOR_TEST', enum: ['CREATOR_TEST', 'MEMBER_TEST'], description: 'Test type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'uuid-of-club', description: 'Club ID (optional)', required: false })
  @IsOptional()
  @IsUUID()
  clubId?: string;

  @ApiProperty({ example: 'hard', description: 'Difficulty (optional)', required: false })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiProperty({ example: 60, description: 'Passing score', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiProperty({ example: 'uuid-of-user', description: 'User ID who created', required: false })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiProperty({ example: true, description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
