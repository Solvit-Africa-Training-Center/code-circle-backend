import { PartialType } from '@nestjs/swagger';
import { CreateClubDto } from './create-club.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the club is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
