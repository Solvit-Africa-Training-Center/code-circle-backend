import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseStatus } from '../entities/course.entity';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional({
    enum: CourseStatus,
    example: CourseStatus.PUBLISHED,
    description: 'Update course status',
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}