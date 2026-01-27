/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsEnum,
  IsObject,
} from 'class-validator';

// Helper function for common ApiProperty configurations
export function ApiPropertyOptional(
  options?: Omit<ApiPropertyOptions, 'required'>,
) {
  return ApiProperty({ required: false, ...options } as ApiPropertyOptions);
}

export function ApiPropertyEmail() {
  return ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  });
}

export function ApiPropertyPassword() {
  return ApiProperty({
    example: 'Password123!',
    description:
      'Password (min 8 chars, with uppercase, lowercase, number and special char)',
  });
}

export function ApiPropertyUUID() {
  return ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID identifier',
  });
}

// Common DTO decorators
export const IsStringField =
  (options?: ApiPropertyOptions) => (target: any, propertyKey: string) => {
    IsString()(target, propertyKey);
    ApiProperty({ type: String, ...options })(target, propertyKey);
  };

export const IsEmailField =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_options?: ApiPropertyOptions) => (target: any, propertyKey: string) => {
    IsEmail()(target, propertyKey);
    ApiPropertyEmail()(target, propertyKey);
  };

export const IsNumberField =
  (options?: ApiPropertyOptions) => (target: any, propertyKey: string) => {
    IsNumber()(target, propertyKey);
    ApiProperty({ type: Number, ...options })(target, propertyKey);
  };

export const IsBooleanField =
  (options?: ApiPropertyOptions) => (target: any, propertyKey: string) => {
    IsBoolean()(target, propertyKey);
    ApiProperty({ type: Boolean, ...options })(target, propertyKey);
  };

export const IsOptionalField =
  (options?: ApiPropertyOptions) => (target: any, propertyKey: string) => {
    IsOptional()(target, propertyKey);
    ApiPropertyOptional(options)(target, propertyKey);
  };

export const IsNotEmptyField =
  (options?: ApiPropertyOptions) => (target: any, propertyKey: string) => {
    IsNotEmpty()(target, propertyKey);
    ApiProperty({ ...options, required: true } as ApiPropertyOptions)(
      target,
      propertyKey,
    );
  };

// Pagination DTO
export class PaginationParams {
  @IsOptionalField({ minimum: 1, default: 1, example: 1 })
  @Min(1)
  page?: number = 1;

  @IsOptionalField({ minimum: 1, maximum: 100, default: 10, example: 10 })
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptionalField({ example: 'createdAt' })
  sortBy?: string = 'createdAt';

  @IsOptionalField({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptionalField({ example: 'search term' })
  @IsString()
  search?: string;

  @IsOptionalField()
  @IsObject()
  filters?: Record<string, any>;
}

// Response DTO
export class PaginatedResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [Object] })
  data: T[];

  @ApiProperty({ example: 'Operation successful' })
  message?: string;

  @ApiProperty({
    type: Object,
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  timestamp: string;
}
