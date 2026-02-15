import { Controller, Post, Body, Get } from '@nestjs/common';
import { TestService } from '../services/test.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  CreateCategoryDto,
  CreateTestDto,
} from '../dto/create-category-test.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly testService: TestService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a category',
    description: 'Add a new test category.',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'Category already exists.' })
  async createCategory(@Body() body: CreateCategoryDto) {
    const category = await this.testService.createCategory(body);
    return category;
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'List all test categories.',
  })
  @ApiResponse({ status: 200, description: 'List of categories.' })
  async getCategories() {
    return await this.testService.getAllCategories();
  }
}

// Note: Test creation is handled by TestsController in tests.controller.ts
// This controller is kept for backward compatibility but test creation should use /tests endpoint
