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
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  GradeSubmissionDto,
} from './dto/submission.dto';
import { Assignment } from './entities/assignment.entity';
import { Submission } from '../assignment/entities/submission.entity';
import { JwtAuthGuard } from '@circle-backend/modules/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@circle-backend/common/decorators/require-permissions.decorator';
import { CurrentUser } from '@circle-backend/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('assignments')
@Controller('assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentsService: AssignmentService) {}

  // ============= ASSIGNMENT ENDPOINTS =============

  @Post()
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Create a new assignment (Course Owner only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Assignment created successfully',
    type: Assignment,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createAssignment(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @CurrentUser() user: User
  ) {
    try {
      const assignment = await this.assignmentsService.createAssignment(
        createAssignmentDto,
        user.id,
      );

      return {
        message: 'Assignment created successfully',
        assignment,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':assignmentId')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Get assignment details by ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment details retrieved successfully',
    type: Assignment,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assignment not found',
  })
  async getAssignmentById(@Param('assignmentId') assignmentId: string) {
    try {
      const assignment =
        await this.assignmentsService.getAssignmentById(assignmentId);

      return {
        message: 'Assignment retrieved successfully',
        ...assignment,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('course/:courseId')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Get all assignments for a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course assignments retrieved successfully',
    type: [Assignment],
  })
  async getAssignmentsByCourse(@Param('courseId') courseId: string) {
    try {
      const assignments =
        await this.assignmentsService.getAssignmentsByCourse(courseId);

      return {
        message: 'Assignments retrieved successfully',
        data: assignments,
        count: assignments.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('module/:moduleId')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Get all assignments for a module' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Module assignments retrieved successfully',
    type: [Assignment],
  })
  async getAssignmentsByModule(@Param('moduleId') moduleId: string) {
    try {
      const assignments =
        await this.assignmentsService.getAssignmentsByModule(moduleId);

      return {
        message: 'Assignments retrieved successfully',
        data: assignments,
        count: assignments.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(':assignmentId')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Update assignment (Course Owner only)' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment updated successfully',
    type: Assignment,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assignment not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only assignment creator can update',
  })
  async updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @CurrentUser() user: User
  ) {
    try {
      const assignment = await this.assignmentsService.updateAssignment(
        assignmentId,
        updateAssignmentDto,
        user.id,
      );

      return {
        message: 'Assignment updated successfully',
        ...assignment,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':assignmentId')
  @RequirePermissions('course:other')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an assignment (Course Owner only)' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assignment not found',
  })
  async deleteAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: User
  ) {
    try {
      await this.assignmentsService.deleteAssignment(assignmentId, user.id);

      return {
        message: 'Assignment deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post(':assignmentId/publish')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Publish an assignment (Course Owner only)' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment published successfully',
    type: Assignment,
  })
  async publishAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: User
  ) {
    try {
      const assignment = await this.assignmentsService.publishAssignment(
        assignmentId,
        user.id,
      );

      return {
        message: 'Assignment published successfully',
        ...assignment,
      };
    } catch (error) {
      throw error;
    }
  }

  // ============= SUBMISSION ENDPOINTS =============
  // The flow DRAFT → SUBMITTED → GRADED

  @Post(':assignmentId/submissions')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Create a submission for an assignment' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Submission created successfully',
    type: Submission,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid submission or deadline passed',
  })
  async createSubmission(
    @Param('assignmentId') assignmentId: string,
    @Body() createSubmissionDto: CreateSubmissionDto,
    @CurrentUser() user: User
  ) {
    try {
      const submission = await this.assignmentsService.createSubmission(
        assignmentId,
        createSubmissionDto,
        user.id,
      );

      return {
        message: 'Submission created successfully',
        ...submission,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('submissions/:submissionId/submit')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Submit a draft submission' })
  @ApiParam({ name: 'submissionId', description: 'Submission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission submitted successfully',
    type: Submission,
  })
  async submitAssignment(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: User
  ) {
    try {
      const submission = await this.assignmentsService.submitAssignment(
        submissionId,
        user.id,
      );

      return {
        message: 'Submission submitted successfully',
        ...submission,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put('submissions/:submissionId')
@RequirePermissions('member:member')
  @ApiOperation({ summary: 'Update a draft submission' })
  @ApiParam({ name: 'submissionId', description: 'Submission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission updated successfully',
    type: Submission,
  })
  async updateSubmission(
    @Param('submissionId') submissionId: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @CurrentUser() user: User
  ) {
    try {
      const submission = await this.assignmentsService.updateSubmission(
        submissionId,
        updateSubmissionDto,
        user.id,
      );

      return {
        message: 'Submission updated successfully',
        ...submission,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('submissions/:submissionId')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Get submission details' })
  @ApiParam({ name: 'submissionId', description: 'Submission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission details retrieved successfully',
    type: Submission,
  })
  async getSubmission(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: User
  ) {
    try {
      const submission = await this.assignmentsService.getSubmission(
        submissionId,
        user.id,
      );

      return {
        message: 'Submission retrieved successfully',
        ...submission,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':assignmentId/my-submissions')
  @RequirePermissions('member:member')
  @ApiOperation({ summary: 'Get current user submissions for an assignment' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User submissions retrieved successfully',
    type: [Submission],
  })
  async getUserSubmissions(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: User
  ) {
    try {
      const submissions = await this.assignmentsService.getUserSubmissions(
        assignmentId,
        user.id,
      );

      return {
        message: 'Submissions retrieved successfully',
        data: submissions,
        count: submissions.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':assignmentId/submissions')
  @RequirePermissions('course:other')
  @ApiOperation({
    summary: 'Get all submissions for an assignment (Course Owner only)',
  })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment submissions retrieved successfully',
    type: [Submission],
  })
  async getAssignmentSubmissions(@Param('assignmentId') assignmentId: string) {
    try {
      const submissions =
        await this.assignmentsService.getAssignmentSubmissions(assignmentId);

      return {
        message: 'Submissions retrieved successfully',
        data: submissions,
        count: submissions.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('submissions/:submissionId/grade')
  @RequirePermissions('course:other')
  @ApiOperation({ summary: 'Grade a submission (Course Owner only)' })
  @ApiParam({ name: 'submissionId', description: 'Submission UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission graded successfully',
    type: Submission,
  })
  async gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() gradeSubmissionDto: GradeSubmissionDto,
    @CurrentUser() user: User
  ) {
    try {
      const submission = await this.assignmentsService.gradeSubmission(
        submissionId,
        gradeSubmissionDto,
        user.id,
      );

      return {
        message: 'Submission graded successfully',
        ...submission,
      };
    } catch (error) {
      throw error;
    }
  }
}