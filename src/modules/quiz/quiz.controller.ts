import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto, SubmitQuizAnswerDto } from './dto/index';
import { Quiz } from './entities/quiz.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';


// =========== NOT FINISHED/ NOT AVAILABLE NOW ====================
// @ApiTags('quizzes')
@Controller('quizzes')
// @UseGuards(AuthGuard('jwt'))
// @ApiBearerAuth('JWT-auth')
export class QuizController {
  constructor(private readonly quizzesService: QuizService) {}

  // ============= QUIZ ENDPOINTS =============

  @Post()
  // @ApiOperation({ summary: 'Create a new quiz (Course Owner only)' })
  // @ApiResponse({ status: HttpStatus.CREATED, type: Quiz })
  async createQuiz(@Body() createQuizDto: CreateQuizDto, @Request() req: any) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      const quiz = await this.quizzesService.createQuiz(createQuizDto, userId);
      return { message: 'Quiz created successfully', data: quiz };
    } catch (error) {
      throw error;
    }
  }

  @Get(':quizId')
  // @ApiOperation({ summary: 'Get quiz details by ID' })
  // @ApiParam({ name: 'quizId', description: 'Quiz UUID' })
  // @ApiResponse({ status: HttpStatus.OK, type: Quiz })
  async getQuizById(@Param('quizId') quizId: string) {
    try {
      const quiz = await this.quizzesService.getQuizById(quizId);
      return { message: 'Quiz retrieved successfully', ...quiz };
    } catch (error) {
      throw error;
    }
  }

  @Get('course/:courseId')
  // @ApiOperation({ summary: 'Get all quizzes for a course' })
  // @ApiParam({ name: 'courseId', description: 'Course UUID' })
  // @ApiResponse({ status: HttpStatus.OK, type: [Quiz] })
  async getQuizzesByCourse(@Param('courseId') courseId: string) {
    try {
      const quizzes = await this.quizzesService.getCourseQuizzes(courseId);
      return { message: 'Quizzes retrieved successfully', data: quizzes, count: quizzes.length };
    } catch (error) {
      throw error;
    }
  }

  @Put(':quizId')
  // @ApiOperation({ summary: 'Update quiz (Course Owner only)' })
  // @ApiParam({ name: 'quizId', description: 'Quiz UUID' })
  // @ApiResponse({ status: HttpStatus.OK, type: Quiz })
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      const quiz = await this.quizzesService.updateQuiz(quizId, updateQuizDto, userId);
      return { message: 'Quiz updated successfully', ...quiz };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':quizId')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Delete a quiz (Course Owner only)' })
  // @ApiParam({ name: 'quizId', description: 'Quiz UUID' })
  // @ApiResponse({ status: HttpStatus.OK })
  async deleteQuiz(@Param('quizId') quizId: string, @Request() req: any) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      await this.quizzesService.deleteQuiz(quizId, userId);
      return { message: 'Quiz deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  @Post(':quizId/publish')
  // @ApiOperation({ summary: 'Publish a quiz (Course Owner only)' })
  // @ApiParam({ name: 'quizId', description: 'Quiz UUID' })
  // @ApiResponse({ status: HttpStatus.OK, type: Quiz })
  async publishQuiz(@Param('quizId') quizId: string, @Request() req: any) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      const quiz = await this.quizzesService.publishQuiz(quizId, userId);
      return { message: 'Quiz published successfully', ...quiz };
    } catch (error) {
      throw error;
    }
  }

  // ============= ATTEMPT ENDPOINTS =============

  @Post(':quizId/start')
  // @ApiOperation({ summary: 'Start a quiz attempt' })
  // @ApiParam({ name: 'quizId', description: 'Quiz UUID' })
  // @ApiResponse({ status: HttpStatus.CREATED, type: QuizAttempt })
  async startQuizAttempt(@Param('quizId') quizId: string, @Request() req: any) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      const attempt = await this.quizzesService.startQuizAttempt(quizId, userId);
      return { message: 'Quiz attempt started', ...attempt };
    } catch (error) {
      throw error;
    }
  }

  @Post('attempts/:attemptId/submit')
  // @ApiOperation({ summary: 'Submit quiz answers' })
  // @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  // @ApiResponse({ status: HttpStatus.OK, type: QuizAttempt })
  async submitQuizAttempt(
    @Param('attemptId') attemptId: string,
    @Body() submitAnswersDto: SubmitQuizAnswerDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      const attempt = await this.quizzesService.submitQuizAttempt(attemptId, submitAnswersDto, userId);
      return { message: 'Quiz submitted successfully', ...attempt };
    } catch (error) {
      throw error;
    }
  }

  @Get(':quizId/my-attempts')
  // @ApiOperation({ summary: 'Get current user attempts for a quiz' })
  // @ApiParam({ name: 'quizId', description: 'Quiz UUID' })
  // @ApiResponse({ status: HttpStatus.OK, type: [QuizAttempt] })
  async getUserAttempts(@Param('quizId') quizId: string, @Request() req: any) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      const attempts = await this.quizzesService.getUserAttempts(quizId, userId);
      return { message: 'Attempts retrieved successfully', data: attempts, count: attempts.length };
    } catch (error) {
      throw error;
    }
  }

  @Get('attempts/:attemptId')
  // @ApiOperation({ summary: 'Get attempt details' })
  // @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  // @ApiResponse({ status: HttpStatus.OK, type: QuizAttempt })
  async getAttemptById(@Param('attemptId') attemptId: string, @Request() req: any) {
    try {
      const userId = req.user?.id || 'temp-user-id';
      const attempt = await this.quizzesService.getAttemptById(attemptId);
      return { message: 'Attempt retrieved successfully', ...attempt };
    } catch (error) {
      throw error;
    }
  }
}