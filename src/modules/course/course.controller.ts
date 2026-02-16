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
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto, UpdateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Course } from './entities/course.entity';
import { Module } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Progress } from './entities/progress.entity';
import { JwtAuthGuard } from '@circle-backend/modules/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@circle-backend/common/decorators/require-permissions.decorator';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CourseController {
  constructor(private readonly coursesService: CourseService) {}

  // ============= COURSE ENDPOINTS =============

  @Post()
  @RequirePermissions('course:create')
  @ApiOperation({ summary: 'Create a new course (Club Owner only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course created successfully',
    type: Course,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only club owners can create courses',
  })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: User
  ) {
    try {
      const course = await this.coursesService.createCourse(
        createCourseDto,
        user.id,
      );
      
      return {
        message: 'Course created successfully',
        ...course,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':courseId')
  @RequirePermissions('course:read')
  @ApiOperation({ summary: 'Get course details by ID' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course details retrieved successfully',
    type: Course,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async getCourseById(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User
  ) {
    try {
      const course = await this.coursesService.getCourseById(courseId, user.id);
      
      return {
        message: 'Course retrieved successfully',
        ...course,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('club/:clubId')
  @ApiOperation({ summary: 'Get all courses for a club' })
  @ApiParam({ name: 'clubId', description: 'Club UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Club courses retrieved successfully',
    type: [Course],
  })
  async getCoursesByClub(@Param('clubId') clubId: string) {
    try {
      const courses = await this.coursesService.getCoursesByClub(clubId);
      
      return {
        message: 'Courses retrieved successfully',
        data: courses,
        count: courses.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(':courseId')
  @RequirePermissions('course:update')
  @ApiOperation({ summary: 'Update course details (Club Owner only)' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course updated successfully',
    type: Course,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only course creator can update',
  })
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: User
  ) {
    try {
      const course = await this.coursesService.updateCourse(
        courseId,
        updateCourseDto,
        user.id,
      );
      
      return {
        message: 'Course updated successfully',
        ...course,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':courseId')
  @RequirePermissions('course:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a course (Club Owner only)' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only course creator can delete',
  })
  async deleteCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User
  ) {
    try {
      await this.coursesService.deleteCourse(courseId, user.id);
      
      return {
        message: 'Course deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post(':courseId/publish')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Publish a course (Club Owner only)' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course published successfully',
    type: Course,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Course cannot be published (missing modules/lessons)',
  })
  async publishCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User
  ) {
    try {
      const course = await this.coursesService.publishCourse(courseId, user.id);
      
      return {
        message: 'Course published successfully',
        ...course,
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= MODULE ENDPOINTS =============

  @Post(':courseId/modules')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Add a module to a course (Club Owner only)' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Module created successfully',
    type: Module,
  })
  async createModule(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
    @CurrentUser() user: User
  ) {
    try {
      const module = await this.coursesService.createModule(
        courseId,
        createModuleDto,
        user.id,
      );
      
      return {
        message: 'Module created successfully',
        ...module,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put('modules/:moduleId')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Update a module (Club Owner only)' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module updated successfully',
    type: Module,
  })
  async updateModule(
    @Param('moduleId') moduleId: string,
    @Body() updateModuleDto: UpdateModuleDto,
    @CurrentUser() user: User
  ) {
    try {
      const module = await this.coursesService.updateModule(
        moduleId,
        updateModuleDto,
        user.id,
      );
      
      return {
        message: 'Module updated successfully',
        ...module,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete('modules/:moduleId')
  @RequirePermissions('course:other')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a module (Club Owner only)' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module deleted successfully',
  })
  async deleteModule(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: User
  ) {
    try {
      await this.coursesService.deleteModule(moduleId, user.id);
      
      return {
        message: 'Module deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= LESSON ENDPOINTS =============

  @Post('modules/:moduleId/lessons')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Add a lesson to a module (Club Owner only)' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lesson created successfully',
    type: Lesson,
  })
  async createLesson(
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: User
  ) {
    try {
      const lesson = await this.coursesService.createLesson(
        moduleId,
        createLessonDto,
        user.id,
      );
      
      return {
        message: 'Lesson created successfully',
        ...lesson,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put('lessons/:lessonId')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Update a lesson (Club Owner only)' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson updated successfully',
    type: Lesson,
  })
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: Partial<CreateLessonDto>,
    @CurrentUser() user: User
  ) {
    try {
      const lesson = await this.coursesService.updateLesson(
        lessonId,
        updateLessonDto,
        user.id,
      );
      
      return {
        message: 'Lesson updated successfully',
        ...lesson,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete('lessons/:lessonId')
  @RequirePermissions('course:other')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lesson (Club Owner only)' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson deleted successfully',
  })
  async deleteLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User
  ) {
    try {
      await this.coursesService.deleteLesson(lessonId, user.id);
      
      return {
        message: 'Lesson deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= ENROLLMENT ENDPOINTS =============

  @Post(':courseId/enroll')
  @RequirePermissions('member')
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Enrolled successfully',
    type: Enrollment,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Already enrolled',
  })
  async enrollInCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User
  ) {
    try {
      const enrollment = await this.coursesService.enrollInCourse(
        courseId,
        user.id,
      );
      
      return {
        message: 'Enrolled in course successfully',
        ...enrollment,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('user/enrollments')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Get current user enrollments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User enrollments retrieved successfully',
    type: [Enrollment],
  })
  async getUserEnrollments(@CurrentUser() user: User) {
    try {
      const enrollments = await this.coursesService.getUserEnrollments(user.id);
      
      return {
        message: 'Enrollments retrieved successfully',
        data: enrollments,
        count: enrollments.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':courseId/enrollments')
  @RequirePermissions('course:other')
  @ApiOperation({
    summary: 'Get all enrollments for a course (Club Owner only)',
  })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course enrollments retrieved successfully',
    type: [Enrollment],
  })
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    try {
      const enrollments =
        await this.coursesService.getCourseEnrollments(courseId);
      
      return {
        message: 'Course enrollments retrieved successfully',
        data: enrollments,
        count: enrollments.length,
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= PROGRESS ENDPOINTS =============

  @Post('lessons/:lessonId/complete')
  @RequirePermissions('member')
  @ApiOperation({ summary: 'Mark a lesson as complete' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lesson marked as complete',
    type: Progress,
  })
  async markLessonComplete(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User
  ) {
    try {
      const progress = await this.coursesService.markLessonComplete(
        lessonId,
        user.id,
      );
      
      return {
        message: 'Lesson marked as complete',
        ...progress,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':courseId/progress')
  @RequirePermissions('course:other', 'member')
  @ApiOperation({ summary: 'Get user progress in a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User progress retrieved successfully',
    type: [Progress],
  })
  async getUserProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User
  ) {
    try {
      const progress = await this.coursesService.getUserProgress(
        courseId,
        user.id,
      );
      
      return {
        message: 'Progress retrieved successfully',
        data: progress,
      };
    } catch (error) {
      throw error;
    }
  }
}