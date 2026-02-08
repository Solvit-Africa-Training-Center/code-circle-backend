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
  createCategory(@Body() body: CreateCategoryDto) {
    return { success: true, ...body };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'List all test categories.',
  })
  @ApiResponse({ status: 200, description: 'List of categories.' })
  getCategories() {
    return [];
  }
}

@ApiTags('Tests')
@Controller('tests')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a test', description: 'Add a new test.' })
  @ApiBody({ type: CreateTestDto })
  @ApiResponse({ status: 201, description: 'Test created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  createTest(@Body() body: CreateTestDto) {
    return { success: true, ...body };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tests', description: 'List all tests.' })
  @ApiResponse({ status: 200, description: 'List of tests.' })
  getTests() {
    return [];
  }
}
