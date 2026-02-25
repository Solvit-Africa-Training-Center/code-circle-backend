import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import { Submission, SubmissionStatus } from '../assignment/entities/submission.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  GradeSubmissionDto,
} from './dto/submission.dto';
import { Course } from '../course/entities/course.entity';
import { Module as MyModule } from '../course/entities/module.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(MyModule)
    private readonly moduleRepository: Repository<MyModule>,
  ) {}

  // ============= ASSIGNMENT MANAGEMENT =============

  async createAssignment(
    createAssignmentDto: CreateAssignmentDto,
    userId: string,
  ): Promise<Assignment> {
    try {
      const course = await this.courseRepository.findOne({
        where: {
          id: createAssignmentDto.courseId,
          createdBy: userId,
        },
      });

      if (!course) {
        throw new NotFoundException('Course not found or access denied');
      }

      let module: MyModule | null = null;
      if (createAssignmentDto.moduleId) {
        module = await this.moduleRepository.findOne({
          where: {
            id: createAssignmentDto.moduleId,
            course: { id: course.id },
          },
        });

        if (!module) {
          throw new NotFoundException('Module not found for this course');
        }
      }
      
      const assignment = this.assignmentRepository.create({
        ...createAssignmentDto,
        course,
        module: module ?? undefined,
        createdBy: userId,
      });

      return this.assignmentRepository.save(assignment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create assignment');
    }
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    try {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: assignmentId },
        relations: ['submissions'],
      });

      if (!assignment) {
        throw new NotFoundException(
          `Assignment with ID ${assignmentId} not found`,
        );
      }

      return assignment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch assignment');
    }
  }

  async getAssignmentsByCourse(courseId: string, userId: string): Promise<Assignment[]> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      const isOwner = course.createdBy === userId;
      if (!isOwner) {
        if (course.status !== 'published') {
          throw new ForbiddenException('Course is not published');
        }
      }

      return await this.assignmentRepository.find({
        where: { courseId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch course assignments');
    }
  }

  async getAssignmentsByModule(moduleId: string): Promise<Assignment[]> {
    try {
      return await this.assignmentRepository.find({
        where: { moduleId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch module assignments');
    }
  }

  async updateAssignment(
    assignmentId: string,
    updateAssignmentDto: UpdateAssignmentDto,
    userId: string,
  ): Promise<Assignment> {
    try {
      const assignment = await this.getAssignmentById(assignmentId);

      if (assignment.createdBy !== userId) {
        throw new ForbiddenException(
          'Only assignment creator can update this assignment',
        );
      }

      if (updateAssignmentDto.courseId) {
        const course = await this.courseRepository.findOne({
          where: {
            id: updateAssignmentDto.courseId,
            createdBy: userId,
          },
        });

        if (!course) {
          throw new NotFoundException('Course not found or access denied');
        }

        assignment.courseId = course.id;
      }

      if (updateAssignmentDto.moduleId !== undefined) {
        if (updateAssignmentDto.moduleId === null) {
          assignment.moduleId = null as unknown as string;
        } else {
          const module = await this.moduleRepository.findOne({
            where: {
              id: updateAssignmentDto.moduleId,
              course: { id: assignment.courseId },
            },
          });

          if (!module) {
            throw new NotFoundException('Module not found for this course');
          }

          assignment.moduleId = module.id;
        }
      }

      Object.assign(assignment, {
        ...updateAssignmentDto,
        courseId: assignment.courseId,
        moduleId: assignment.moduleId,
      });
      return await this.assignmentRepository.save(assignment);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update assignment');
    }
  }

  async deleteAssignment(assignmentId: string, userId: string): Promise<void> {
    try {
      const assignment = await this.getAssignmentById(assignmentId);

      if (assignment.createdBy !== userId) {
        throw new ForbiddenException(
          'Only assignment creator can delete this assignment',
        );
      }

      await this.assignmentRepository.remove(assignment);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete assignment');
    }
  }

  async publishAssignment(
    assignmentId: string,
    userId: string,
  ): Promise<Assignment> {
    try {
      const assignment = await this.getAssignmentById(assignmentId);

      if (assignment.createdBy !== userId) {
        throw new ForbiddenException(
          'Only assignment creator can publish this assignment',
        );
      }

      assignment.status = AssignmentStatus.PUBLISHED;
      return await this.assignmentRepository.save(assignment);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to publish assignment');
    }
  }

  // ============= SUBMISSION MANAGEMENT =============

  async createSubmission(
    assignmentId: string,
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<Submission> {
    try {
      const assignment = await this.getAssignmentById(assignmentId);

      if (assignment.status !== AssignmentStatus.PUBLISHED) {
        throw new BadRequestException(
          'Cannot submit to unpublished assignment',
        );
      }

      if (assignment.createdBy === userId) {
        throw new ForbiddenException('Only members can create submit');
      }

      const now = new Date();
      const isLate = !!(
        assignment.dueDate && now > assignment.dueDate
      );

      if (isLate && !assignment.allowLateSubmission) {
        throw new BadRequestException('Assignment deadline has passed');
      }

      const existingSubmissions = await this.submissionRepository.count({
        where: { assignmentId, userId },
      });

      if (
        assignment.maxAttempts !== null &&
        existingSubmissions >= assignment.maxAttempts
      ) {
        throw new BadRequestException(
          `Maximum number of attempts (${assignment.maxAttempts}) reached`,
        );
      }

      const submission = this.submissionRepository.create({
        ...createSubmissionDto,
        assignmentId,
        userId,
        attemptNumber: existingSubmissions + 1,
        isLate,
        status: SubmissionStatus.DRAFT,
      });

      return await this.submissionRepository.save(submission);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create submission',
      );
    }
  }

  async submitAssignment(
    submissionId: string,
    userId: string,
  ): Promise<Submission> {
    try {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['assignment'],
      });

      if (!submission) {
        throw new NotFoundException(
          `Submission with ID ${submissionId} not found`,
        );
      }

      if (submission.userId !== userId) {
        throw new ForbiddenException('Can only submit your own submissions');
      }

      if (submission.status === SubmissionStatus.SUBMITTED) {
        throw new BadRequestException('Submission already submitted');
      }

      submission.status = SubmissionStatus.SUBMITTED;
      submission.submittedAt = new Date();

      return await this.submissionRepository.save(submission);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to submit assignment');
    }
  }

  async updateSubmission(
    submissionId: string,
    updateSubmissionDto: UpdateSubmissionDto,
    userId: string,
  ): Promise<Submission> {
    try {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new NotFoundException(
          `Submission with ID ${submissionId} not found`,
        );
      }

      if (submission.userId !== userId) {
        throw new ForbiddenException('Can only update your own submissions');
      }

      if (submission.status !== SubmissionStatus.DRAFT) {
        throw new BadRequestException(
          'Can only update draft submissions',
        );
      }

      Object.assign(submission, updateSubmissionDto);
      return await this.submissionRepository.save(submission);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update submission');
    }
  }

  async getSubmission(submissionId: string, userId: string): Promise<Submission> {
    try {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['assignment'],
      });

      if (!submission) {
        throw new NotFoundException(
          `Submission with ID ${submissionId} not found`,
        );
      }

      // Check if user has access (owner or assignment creator)
      if (
        submission.userId !== userId &&
        submission.assignment.createdBy !== userId
      ) {
        throw new ForbiddenException('No access to this submission');
      }

      return submission;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch submission');
    }
  }

  async getUserSubmissions(
    assignmentId: string,
    userId: string,
  ): Promise<Submission[]> {
    try {
      return await this.submissionRepository.find({
        where: { assignmentId, userId },
        order: { attemptNumber: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch user submissions');
    }
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
    try {
      return await this.submissionRepository.find({
        where: { assignmentId },
        order: { submittedAt: 'DESC' },
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch assignment submissions');
    }
  }

  async gradeSubmission(
    submissionId: string,
    gradeSubmissionDto: GradeSubmissionDto,
    userId: string,
  ): Promise<Submission> {
    try {
      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['assignment'],
      });

      if (!submission) {
        throw new NotFoundException(
          `Submission with ID ${submissionId} not found`,
        );
      }

      // Only assignment creator can grade
      if (submission.assignment.createdBy !== userId) {
        throw new ForbiddenException('Only assignment creator can grade');
      }

      submission.score = gradeSubmissionDto.score;
      submission.feedback = gradeSubmissionDto.feedback;
      submission.status = SubmissionStatus.GRADED;
      submission.gradedAt = new Date();
      submission.gradedBy = userId;

      return await this.submissionRepository.save(submission);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to grade submission');
    }
  }
}
