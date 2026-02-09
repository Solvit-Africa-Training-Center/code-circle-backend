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
  @ApiResponse({ status: 404, description: 'Category or user not found.' })
  async createTest(@Body() body: CreateTestDto) {
    const test = await this.testService.createTest(body);
    return test;
  }

  @Get()
  @ApiOperation({ summary: 'Get all tests', description: 'List all tests.' })
  @ApiResponse({ status: 200, description: 'List of tests.' })
  async getTests() {
    return await this.testService.getAllTests();
  }

  @Post('attempt')
  @ApiOperation({
    summary: 'Submit a test attempt',
    description:
      'Submit answers and score for a test. Handles pass/fail logic and user status.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
        testId: { type: 'string', description: 'Test ID' },
        score: { type: 'number', description: 'Score achieved' },
        answers: { type: 'object', description: 'Answers (JSON)' },
        feedback: {
          type: 'string',
          description: 'Feedback from AI',
          nullable: true,
        },
        clubId: {
          type: 'string',
          description: 'Club ID (optional)',
          nullable: true,
        },
      },
      required: ['userId', 'testId', 'score', 'answers'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Test attempt submitted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request or validation error.' })
  submitAttempt(
    @Body()
    body: {
      userId: string;
      testId: string;
      score: number;
      answers: any;
      feedback?: string;
      clubId?: string;
    },
  ) {
    return this.testService.submitTestAttempt(
      body.userId,
      body.testId,
      body.score,
      body.answers,
      body.feedback,
      body.clubId,
    );
  }
}
