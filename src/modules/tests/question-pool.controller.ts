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
  BadRequestException,
  ForbiddenException,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/strategies/jwt.strategy';
import { ClubsService } from '../clubs/clubs.service';

@ApiTags('Question Pool')
@Controller('question-pool')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionPoolController {
  constructor(
    private readonly questionPoolService: QuestionPoolService,
    private readonly clubsService: ClubsService,
  ) {}

  @Post('generate')
  @Roles('ADMIN', 'CREATOR', 'CLUB_LEADER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate 30 questions for a pool',
    description:
      'ADMIN generates by category. CREATOR generates by own club.',
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
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const roleNames = (currentUser.roles ?? []).map((role) =>
      role.name.toUpperCase(),
    );
    const isAdmin = roleNames.includes('ADMIN');
    const isCreator =
      roleNames.includes('CREATOR') || roleNames.includes('CLUB_LEADER');

    if (isAdmin) {
      if (generateDto.poolType !== PoolType.CATEGORY) {
        throw new BadRequestException(
          'ADMIN can only generate questions by category',
        );
      }
      if (!generateDto.categoryId) {
        throw new BadRequestException(
          'categoryId is required for CATEGORY pool generation',
        );
      }
      generateDto.clubId = undefined;
    } else if (isCreator) {
      if (generateDto.poolType !== PoolType.CLUB) {
        throw new BadRequestException(
          'CREATOR can only generate questions by club',
        );
      }
      if (!generateDto.clubId) {
        throw new BadRequestException(
          'clubId is required for CLUB pool generation',
        );
      }

      const club = await this.clubsService.findOne(generateDto.clubId);
      if (club.creatorId !== currentUser.userId) {
        throw new ForbiddenException(
          'You can only generate questions for your own club',
        );
      }

      generateDto.categoryId = undefined;
    }

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
