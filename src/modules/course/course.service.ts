import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { Module } from './entities/module.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonContent } from './entities/lesson-content.entity';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Progress } from './entities/progress.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Club } from '../clubs/entities/club.entity';
import { Membership, MembershipRole, MembershipStatus } from '../users/entities/membership.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(LessonContent)
    private readonly lessonContentRepository: Repository<LessonContent>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  // ============= COURSE MANAGEMENT =============

  async createCourse(
    createCourseDto: CreateCourseDto,
    userId: string,
  ): Promise<Course> {
    try {

      const club = await this.clubRepository.findOne({
        where: { id: createCourseDto.clubId },
      });

      if (!club) {
        throw new NotFoundException(`Club with ID ${createCourseDto.clubId} not found`);
      }

      const isClubOwner = club.creatorId === userId;
      if (!isClubOwner) {
        const creatorMembership = await this.membershipRepository.findOne({
          where: {
            clubId: createCourseDto.clubId,
            userId,
            role: MembershipRole.CREATOR,
            status: MembershipStatus.ACTIVE,
          },
        });

        if (!creatorMembership) {
          throw new ForbiddenException(
            'Only the club creator can create courses',
          );
        }
      }

      const course = this.courseRepository.create({
        ...createCourseDto,
        createdBy: userId,
      });

      return await this.courseRepository.save(course);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create course');
    }
  }

  async getCourseById(courseId: string, userId?: string): Promise<Course> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['modules', 'modules.lessons', 'modules.lessons.contents'],
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      // Published courses are readable by authenticated users with course read permission.
      if (userId && course.status !== CourseStatus.PUBLISHED) {
        const isCourseCreator = course.createdBy === userId;
        if (!isCourseCreator) {
          const club = await this.clubRepository.findOne({
            where: { id: course.clubId },
          });

          const isClubCreator = club?.creatorId === userId;
          if (!isClubCreator) {
            const membership = await this.membershipRepository.findOne({
              where: {
                clubId: course.clubId,
                userId,
                status: MembershipStatus.ACTIVE,
              },
            });

            if (!membership) {
              throw new ForbiddenException(
                'You must be an active member of the club to access this course',
              );
            }
          }
        }
      }

      return course;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch course');
    }
  }

  async getCoursesByClub(clubId: string): Promise<Course[]> {
    try {
      const clubExist = await this.clubRepository.findOne({
        where: { id: clubId}
      })
      if (!clubExist){
        throw new NotFoundException(`Course with ID ${clubId} not found`);
      }

      return await this.courseRepository.find({
        where: { clubId },
        relations: ['modules'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch club courses');
    }
  }

  async updateCourse(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
  ): Promise<Course> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      // Only course creator (club owner) can update
      if (course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can update this course',
        );
      }

      Object.assign(course, updateCourseDto);
      return await this.courseRepository.save(course);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update course');
    }
  }

  async deleteCourse(courseId: string, userId: string): Promise<void> {
    try {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      if (course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can delete this course',
        );
      }

      await this.courseRepository.remove(course);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete course');
    }
  }

  async publishCourse(courseId: string, userId: string): Promise<Course> {
    try {
      const course = await this.getCourseById(courseId);

      if (course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can publish this course',
        );
      }

      // Validate course has at least one module and one lesson
      if (!course.modules || course.modules.length === 0) {
        throw new BadRequestException(
          'Cannot publish course without modules',
        );
      }

      course.status = CourseStatus.PUBLISHED;
      return await this.courseRepository.save(course);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to publish course');
    }
  }

  // ============= MODULE MANAGEMENT =============

  async createModule(
    courseId: string,
    createModuleDto: CreateModuleDto,
    userId: string,
  ): Promise<Module> {
    try {
      const course = await this.getCourseById(courseId);

      if (course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can add modules',
        );
      }

      const module = this.moduleRepository.create({
        ...createModuleDto,
        courseId,
      });

      return await this.moduleRepository.save(module);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create module');
    }
  }

  async updateModule(
    moduleId: string,
    updateModuleDto: Partial<CreateModuleDto>,
    userId: string,
  ): Promise<Module> {
    try {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
        relations: ['course'],
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      if (module.course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can update modules',
        );
      }

      Object.assign(module, updateModuleDto);
      return await this.moduleRepository.save(module);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update module');
    }
  }

  async deleteModule(moduleId: string, userId: string): Promise<void> {
    try {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
        relations: ['course'],
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      if (module.course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can delete modules',
        );
      }

      await this.moduleRepository.remove(module);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete module');
    }
  }

  // ============= LESSON MANAGEMENT =============

  async createLesson(
    moduleId: string,
    createLessonDto: CreateLessonDto,
    userId: string,
  ): Promise<Lesson> {
    try {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
        relations: ['course'],
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      if (module.course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can add lessons',
        );
      }

      const lesson = this.lessonRepository.create({
        ...createLessonDto,
        moduleId,
      });

      const savedLesson = await this.lessonRepository.save(lesson);

      if (createLessonDto.contents && createLessonDto.contents.length > 0) {
        const contents = createLessonDto.contents.map((contentDto) =>
          this.lessonContentRepository.create({
            ...contentDto,
            lessonId: savedLesson.id,
          }),
        );
        await this.lessonContentRepository.save(contents);
      }

      return savedLesson;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create lesson');
    }
  }

  async updateLesson(
    lessonId: string,
    updateLessonDto: Partial<CreateLessonDto>,
    userId: string,
  ): Promise<Lesson> {
    try {
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: ['module', 'module.course'],
      });

      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
      }

      if (lesson.module.course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can update lessons',
        );
      }

      Object.assign(lesson, updateLessonDto);
      return await this.lessonRepository.save(lesson);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update lesson');
    }
  }

  async deleteLesson(lessonId: string, userId: string): Promise<void> {
    try {
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: ['module', 'module.course'],
      });

      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
      }

      if (lesson.module.course.createdBy !== userId) {
        throw new ForbiddenException(
          'Only the course creator can delete lessons',
        );
      }

      await this.lessonRepository.remove(lesson);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete lesson');
    }
  }

  // ============= ENROLLMENT MANAGEMENT =============

  async enrollInCourse(courseId: string, userId: string): Promise<Enrollment> {
    try {
      const course = await this.getCourseById(courseId);

      if (course.status !== CourseStatus.PUBLISHED) {
        throw new BadRequestException('Cannot enroll in unpublished course');
      }

      // I will un comment after joining club feature is available!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      // const membership = await this.membershipRepository.findOne({
      //   where: {
      //     clubId: course.clubId,
      //     userId,
      //     status: MembershipStatus.ACTIVE,
      //   },
      // });

      // if (!membership) {
      //   throw new ForbiddenException(
      //     'You must be an active member of the club to enroll in this course',
      //   );
      // }

      // Check if already enrolled
      const existingEnrollment = await this.enrollmentRepository.findOne({
        where: { courseId, userId },
      });

      if (existingEnrollment) {
        throw new ConflictException('Already enrolled in this course');
      }

      const enrollment = this.enrollmentRepository.create({
        courseId,
        userId,
        status: EnrollmentStatus.ACTIVE,
      });

      return await this.enrollmentRepository.save(enrollment);
    } catch (error) {
      if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to enroll in course');
    }
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    try {
      return await this.enrollmentRepository.find({
        where: { userId },
        relations: ['course', 'course.modules'],
        order: { enrolledAt: 'DESC' },
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch user enrollments');
    }
  }

  async getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    try {
      return await this.enrollmentRepository.find({
        where: { courseId },
        relations: ['user'],
        order: { enrolledAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch course enrollments');
    }
  }

  // ============= PROGRESS TRACKING =============

  async markLessonComplete(
    lessonId: string,
    userId: string,
  ): Promise<Progress> {
    try {
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: ['module', 'module.course'],
      });

      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
      }

      // Get user's enrollment
      const enrollment = await this.enrollmentRepository.findOne({
        where: { courseId: lesson.module.courseId, userId },
      });

      if (!enrollment) {
        throw new BadRequestException(
          'Must be enrolled in course to track progress',
        );
      }

      // Check if progress already exists
      let progress = await this.progressRepository.findOne({
        where: { enrollmentId: enrollment.id, lessonId },
      });

      if (!progress) {
        progress = this.progressRepository.create({
          enrollmentId: enrollment.id,
          lessonId,
        });
      }

      progress.isCompleted = true;
      progress.completionPercentage = 100;
      progress.completedAt = new Date();
      progress.lastAccessedAt = new Date();

      const savedProgress = await this.progressRepository.save(progress);

      // Update enrollment progress percentage
      await this.updateEnrollmentProgress(enrollment.id);

      return savedProgress;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to mark lesson as complete');
    }
  }

  async getUserProgress(
    courseId: string,
    userId: string,
  ): Promise<Progress[]> {
    try {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { courseId, userId },
      });

      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }

      return await this.progressRepository.find({
        where: { enrollmentId: enrollment.id },
        relations: ['lesson', 'lesson.module'],
        order: { lastAccessedAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user progress');
    }
  }

  private async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    try {
      const enrollment = await this.enrollmentRepository.findOne({
        where: { id: enrollmentId },
        relations: ['course', 'course.modules', 'course.modules.lessons'],
      });

      if (!enrollment) return;

      // Count total lessons
      const totalLessons = enrollment.course.modules.reduce(
        (total, module) => total + (module.lessons?.length || 0),
        0,
      );

      if (totalLessons === 0) return;

      // Count completed lessons
      const completedProgress = await this.progressRepository.count({
        where: { enrollmentId, isCompleted: true },
      });

      const progressPercentage = (completedProgress / totalLessons) * 100;

      enrollment.progressPercentage = Number(progressPercentage.toFixed(2));
      enrollment.lastAccessedAt = new Date();

      // Check if course is completed
      if (progressPercentage === 100) {
        enrollment.status = EnrollmentStatus.COMPLETED;
        enrollment.completedAt = new Date();
      }

      await this.enrollmentRepository.save(enrollment);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update enrollment progress:');
    }
  }
}
