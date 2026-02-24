// src/tests/question-pool.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  //ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { QuestionPoolService } from './services/questions-pool.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PoolType } from './entities/question-pool.entity';

@ApiTags('Question Pool')
@Controller('question-pool')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionPoolController {
  constructor(private readonly questionPoolService: QuestionPoolService) {}

  @Post('generate')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate 30 questions for a pool (Admin only)',
    description:
      'Generates 30 questions using Gemini AI and stores them in the question pool',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['poolType', 'difficulty'],
      properties: {
        poolType: {
          type: 'string',
          enum: ['CATEGORY', 'CLUB'],
          example: 'CATEGORY',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          description: 'Required if poolType is CATEGORY',
        },
        clubId: {
          type: 'string',
          format: 'uuid',
          description: 'Required if poolType is CLUB',
        },
        difficulty: {
          type: 'string',
          enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
          example: 'INTERMEDIATE',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '30 questions generated and stored successfully',
  })
  async generatePool(
    @Body()
    generateDto: {
      poolType: PoolType;
      categoryId?: string;
      clubId?: string;
      difficulty: string;
    },
  ) {
    const questions =
      await this.questionPoolService.generateQuestionPool(generateDto);

    return {
      message: `${questions.length} questions generated successfully`,
      data: {
        count: questions.length,
        poolType: generateDto.poolType,
        categoryId: generateDto.categoryId,
        clubId: generateDto.clubId,
      },
    };
  }

  @Get()
  @Roles('ADMIN', 'CREATOR')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all questions from a pool' })
  @ApiQuery({ name: 'poolType', enum: PoolType })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'clubId', required: false })
  async getPoolQuestions(
    @Query('poolType') poolType: PoolType,
    @Query('categoryId') categoryId?: string,
    @Query('clubId') clubId?: string,
  ) {
    const questions = await this.questionPoolService.getPoolQuestions(
      poolType,
      categoryId,
      clubId,
    );

    return {
      message: 'Questions retrieved successfully',
      data: {
        count: questions.length,
        questions,
      },
    };
  }

  @Delete()
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a question pool (Admin only)' })
  @ApiQuery({ name: 'poolType', enum: PoolType })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'clubId', required: false })
  async deletePool(
    @Query('poolType') poolType: PoolType,
    @Query('categoryId') categoryId?: string,
    @Query('clubId') clubId?: string,
  ) {
    await this.questionPoolService.deletePool(poolType, categoryId, clubId);

    return {
      message: 'Question pool deleted successfully',
    };
  }
}
