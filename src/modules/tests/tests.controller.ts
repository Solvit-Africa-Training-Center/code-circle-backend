import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import {
  TestResponseDto,
  TestAttemptResponseDto,
} from './dto/test-response.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
import { TestType } from './enums/test-type.enum';

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new test (Admin/Creator only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Test created successfully',
    type: TestResponseDto,
  })
  async create(@Body() createTestDto: CreateTestDto) {
    const test = await this.testsService.create(createTestDto);
    return {
      message: 'Test created successfully',
      data: test,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tests with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tests retrieved successfully',
  })
  async findAll(@Query() paginationParams: PaginationParams) {
    const result = await this.testsService.findAll(paginationParams);
    return {
      message: 'Tests retrieved successfully',
      ...result,
    };
  }

  @Get('category/:categoryId/:type')
  @ApiOperation({ summary: 'Get test for a specific category and type' })
  @ApiParam({
    name: 'categoryId',
    description: 'Category UUID',
  })
  @ApiParam({
    name: 'type',
    enum: TestType,
    description: 'Test type (CREATOR_TEST or MEMBER_TEST)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test retrieved successfully',
    type: TestResponseDto,
  })
  async findByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('type') type: TestType,
  ) {
    const test = await this.testsService.findByCategory(categoryId, type);
    return {
      message: 'Test retrieved successfully',
      data: test,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a test by ID (for taking the test)' })
  @ApiParam({
    name: 'id',
    description: 'Test UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test found',
    type: TestResponseDto,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const test = await this.testsService.findOneForTaking(id);
    return {
      message: 'Test retrieved successfully',
      data: test,
    };
  }

  @Post('submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a test attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test submitted successfully',
    type: TestAttemptResponseDto,
  })
  async submitTest(
    // TODO: Extraire userId depuis le JWT token
    @Body() submitTestDto: SubmitTestDto,
  ) {
    // Pour l'instant, on utilise un userId fictif
    // Plus tard, on extraira ça du token JWT
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const attempt = await this.testsService.submitTest(userId, submitTestDto);
    return {
      message: attempt.passed
        ? 'Congratulations! You passed the test'
        : 'Unfortunately, you did not pass the test',
      data: attempt,
    };
  }

  @Get('user/:userId/attempts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all attempts for a user' })
  @ApiParam({
    name: 'userId',
    description: 'User UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User attempts retrieved successfully',
  })
  async getUserAttempts(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() paginationParams: PaginationParams,
  ) {
    const result = await this.testsService.getUserAttempts(
      userId,
      paginationParams,
    );
    return {
      message: 'User attempts retrieved successfully',
      ...result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a test (Admin/Creator only)' })
  @ApiParam({
    name: 'id',
    description: 'Test UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test updated successfully',
    type: TestResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTestDto: UpdateTestDto,
  ) {
    const test = await this.testsService.update(id, updateTestDto);
    return {
      message: 'Test updated successfully',
      data: test,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a test (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Test UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test deactivated successfully',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.testsService.remove(id);
  }
}
