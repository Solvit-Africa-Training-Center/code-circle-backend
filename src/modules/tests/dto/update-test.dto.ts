import { PartialType } from '@nestjs/swagger';
import { CreateTestDto } from './create-test.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTestDto extends PartialType(CreateTestDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the test is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
