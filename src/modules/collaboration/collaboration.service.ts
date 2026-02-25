import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Club } from '../clubs/entities/club.entity';
import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from '../users/entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment, EnrollmentStatus } from '../course/entities/enrollment.entity';
import { Course } from '../course/entities/course.entity';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { TestPurpose, TestType } from '../tests/enums/test-type.enum';
import { CollaborationMessage } from './entities/collaboration-message.entity';
import {
  CollaborationTask,
  CollaborationTaskStatus,
} from './entities/collaboration-task.entity';
import { CollaborationCodeSubmission } from './entities/collaboration-code-submission.entity';
import { CreateCollaborationMessageDto } from './dto/create-collaboration-message.dto';
import { CreateCollaborationTaskDto } from './dto/create-collaboration-task.dto';
import { UpdateCollaborationTaskDto } from './dto/update-collaboration-task.dto';
import { CreateCollaborationCodeSubmissionDto } from './dto/create-collaboration-code-submission.dto';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    @InjectRepository(CollaborationMessage)
    private readonly messageRepository: Repository<CollaborationMessage>,
    @InjectRepository(CollaborationTask)
    private readonly taskRepository: Repository<CollaborationTask>,
    @InjectRepository(CollaborationCodeSubmission)
    private readonly codeSubmissionRepository: Repository<CollaborationCodeSubmission>,
  ) {}

  private async assertClubAccess(clubId: string, userId: string): Promise<Club> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${clubId} not found`);
    }

    if (club.creatorId === userId) {
      return club;
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        clubId,
        userId,
        status: In([MembershipStatus.ACTIVE, MembershipStatus.PENDING]),
      },
    });
    if (membership) {
      return club;
    }

    const clubCourseIds = (
      await this.courseRepository.find({
        where: { clubId },
        select: ['id'],
      })
    ).map((course) => course.id);

    if (clubCourseIds.length > 0) {
      const enrollment = await this.enrollmentRepository.findOne({
        where: {
          userId,
          courseId: In(clubCourseIds),
          status: In([EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED]),
        },
      });
      if (enrollment) {
        return club;
      }
    }

    const passedMemberAttempt = await this.testAttemptRepository
      .createQueryBuilder('attempt')
      .leftJoin('attempt.test', 'test')
      .where('attempt.userId = :userId', { userId })
      .andWhere('attempt.passed = :passed', { passed: true })
      .andWhere('test.type = :memberTestType', { memberTestType: TestType.MEMBER_TEST })
      .andWhere(
        '(attempt.targetClubId = :clubId OR CAST(test.clubId AS text) = :clubId)',
        { clubId: String(clubId) },
      )
      .andWhere(
        '(attempt.purpose = :joinClubPurpose OR attempt.purpose IS NULL)',
        { joinClubPurpose: TestPurpose.JOIN_CLUB },
      )
      .orderBy('attempt.attemptedAt', 'DESC')
      .getOne();

    if (passedMemberAttempt) {
      const membership = this.membershipRepository.create({
        clubId,
        userId,
        role: MembershipRole.MEMBER,
        status: MembershipStatus.ACTIVE,
      });
      await this.membershipRepository.save(membership);
      return club;
    }

    throw new ForbiddenException('You must join this club to access collaboration room');
  }

  async getRoom(clubId: string, userId: string) {
    await this.assertClubAccess(clubId, userId);

    const [messages, tasks, codeSubmissions, members] = await Promise.all([
      this.messageRepository.find({
        where: { clubId },
        relations: ['user'],
        order: { createdAt: 'ASC' },
        take: 200,
      }),
      this.taskRepository.find({
        where: { clubId },
        order: { createdAt: 'DESC' },
        take: 100,
      }),
      this.codeSubmissionRepository.find({
        where: { clubId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: 100,
      }),
      this.membershipRepository.find({
        where: { clubId, status: MembershipStatus.ACTIVE },
        relations: ['user'],
        order: { joinedAt: 'ASC' },
      }),
    ]);

    return {
      messages: messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        user: {
          id: message.user?.id ?? message.userId,
          name: message.user?.name || message.user?.email || 'Member',
          email: message.user?.email ?? '',
        },
      })),
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
      codeSubmissions: codeSubmissions.map((submission) => ({
        id: submission.id,
        language: submission.language,
        note: submission.note,
        createdAt: submission.createdAt,
        user: {
          id: submission.user?.id ?? submission.userId,
          name: submission.user?.name || submission.user?.email || 'Member',
          email: submission.user?.email ?? '',
        },
      })),
      members: members.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        name: member.user?.name || member.user?.email || 'Member',
        email: member.user?.email ?? '',
      })),
    };
  }

  async createMessage(
    clubId: string,
    userId: string,
    dto: CreateCollaborationMessageDto,
  ) {
    await this.assertClubAccess(clubId, userId);

    const clean = dto.content.trim();
    if (!clean) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const entity = this.messageRepository.create({
      clubId,
      userId,
      content: clean,
    });
    const saved = await this.messageRepository.save(entity);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    return {
      id: saved.id,
      content: saved.content,
      createdAt: saved.createdAt,
      user: {
        id: user?.id ?? userId,
        name: user?.name || user?.email || 'Member',
        email: user?.email ?? '',
      },
    };
  }

  async createTask(clubId: string, userId: string, dto: CreateCollaborationTaskDto) {
    await this.assertClubAccess(clubId, userId);

    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException('Task title cannot be empty');
    }

    const entity = this.taskRepository.create({
      clubId,
      createdBy: userId,
      title,
      status: dto.status ?? CollaborationTaskStatus.TODO,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    return this.taskRepository.save(entity);
  }

  async updateTask(taskId: string, userId: string, dto: UpdateCollaborationTaskDto) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    await this.assertClubAccess(task.clubId, userId);

    if (dto.title !== undefined) {
      const clean = dto.title.trim();
      if (!clean) {
        throw new BadRequestException('Task title cannot be empty');
      }
      task.title = clean;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    return this.taskRepository.save(task);
  }

  async createCodeSubmission(
    clubId: string,
    userId: string,
    dto: CreateCollaborationCodeSubmissionDto,
  ) {
    await this.assertClubAccess(clubId, userId);

    const language = dto.language.trim();
    const code = dto.code.trim();
    if (!language || !code) {
      throw new BadRequestException('Language and code are required');
    }

    const entity = this.codeSubmissionRepository.create({
      clubId,
      userId,
      language,
      code: dto.code,
      note: dto.note?.trim() || null,
    });
    const saved = await this.codeSubmissionRepository.save(entity);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    return {
      id: saved.id,
      language: saved.language,
      note: saved.note,
      createdAt: saved.createdAt,
      user: {
        id: user?.id ?? userId,
        name: user?.name || user?.email || 'Member',
        email: user?.email ?? '',
      },
    };
  }
}
