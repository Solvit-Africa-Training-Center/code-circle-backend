/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillType } from '../entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: 'UI/UX Design' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'User interface and user experience design',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'design-icon.svg' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    enum: SkillType,
    example: SkillType.DESIGN,
    description: 'Type of skill - affects question generation',
  })
  @IsEnum(SkillType)
  @IsOptional()
  skillType?: SkillType;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
