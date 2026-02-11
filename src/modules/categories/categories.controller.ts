import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
  ParseUUIDPipe,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationParams } from '@circle-backend/common/decorators/api-properties';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        description: { type: 'string' },
        icon: { type: 'string' },
        slug: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      icon?: Express.Multer.File[];
    },
  ) {
    const file = files?.file?.[0] || files?.icon?.[0];
    const icon = file ? `/uploads/categories/${file.filename}` : undefined;
    const category = await this.categoriesService.create(
      createCategoryDto,
      icon,
    );
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  async findAll(@Query() paginationParams: PaginationParams) {
    const result = await this.categoriesService.findAll(paginationParams);
    return {
      message: 'Categories retrieved successfully',
      ...result,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active categories (no pagination)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  async findAllActive() {
    const categories = await this.categoriesService.findAllActive();
    return {
      message: 'Active categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category found',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.categoriesService.findOne(id);
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  @ApiParam({
    name: 'slug',
    description: 'Category slug',
    example: 'intelligence-artificielle',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category found',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug);
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        description: { type: 'string' },
        icon: { type: 'string' },
        slug: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category with this name or slug already exists',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      icon?: Express.Multer.File[];
    },
  ) {
    const file = files?.file?.[0] || files?.icon?.[0];
    const icon = file ? `/uploads/categories/${file.filename}` : undefined;
    const category = await this.categoriesService.update(
      id,
      updateCategoryDto,
      icon,
    );
    return {
      message: 'Category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a category (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.categoriesService.remove(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a category (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category permanently deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete category with active clubs',
  })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.categoriesService.hardDelete(id);
  }
}
