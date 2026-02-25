/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterForTestDto } from './dto/register-for-test.dto';
import { RegisterMemberForClubDto } from './dto/register-member-for-club.dto';

import { ApproveCreatorDto } from './dto/approve-creator.dto';
import { RejectCreatorDto } from './dto/reject-creator.dto';
import { ActivateUserDto } from './dto/activate-user.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { GlobalStatus } from './entities/user.entity';
import { Membership } from './entities/membership.entity';
import { MembershipRole, MembershipStatus } from './entities/membership.entity';
import { EmailService } from '../auth/services/email.service';
import { UserRole } from '../auth/entities/user-role.entity';
import { Role } from '../auth/entities/role.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { hash } from 'bcryptjs';
import { TestAttempt } from '../tests/entities/test-attempt.entity';
import { TestPurpose, TestType } from '../tests/enums/test-type.enum';
import { Club } from '../clubs/entities/club.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepo: Repository<TestAttempt>,
    @InjectRepository(Club)
    private readonly clubRepo: Repository<Club>,
    private readonly emailService: EmailService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Sanitize UUID string by removing quotes and trimming whitespace
   */
  private sanitizeUUID(uuid: string): string {
    return uuid.replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Register a user for taking a test (pre-test registration)
   * This creates a user account with profile information before they take the test
   */
  async registerForTest(registerDto: RegisterForTestDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Upload CV to Cloudinary
    const cvUrl = await this.cloudinaryService.uploadFromBase64(
      registerDto.cv,
      'users/cv',
      'raw',
    );

    // Upload degree to Cloudinary if provided
    let degreeUrl: string | undefined;
    if (registerDto.degree) {
      degreeUrl = await this.cloudinaryService.uploadFromBase64(
        registerDto.degree,
        'users/degrees',
        'raw',
      );
    }

    // Create user with PENDING status (will be activated after test pass)
    const user = this.userRepo.create({
      name: registerDto.fullName,
      email: registerDto.email,
      phone: registerDto.phone,
      bio: registerDto.bio,
      cv: cvUrl,
      degree: degreeUrl,
      password: '', // Will be set after test pass
      globalStatus: GlobalStatus.PENDING,
    });

    await this.userRepo.save(user);

    return user;
  }

  async registerForTestWithFiles({
    fullName,
    email,
    phone,
    bio,
    cvFile,
    degreeFile,
  }: {
    fullName: string;
    email: string;
    phone: string;
    bio: string;
    cvFile: Express.Multer.File;
    degreeFile?: Express.Multer.File;
  }): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepo.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Validate phone format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException(
        'Phone number must be in international format',
      );
    }

    // Upload CV to Cloudinary (using codecircle folder as specified)
    const cvUrl = await this.cloudinaryService.uploadMulterFile(
      cvFile,
      'codecircle/users/cv',
      'raw',
    );

    // Upload degree to Cloudinary if provided (using codecircle folder as specified)
    let degreeUrl: string | undefined;
    if (degreeFile) {
      degreeUrl = await this.cloudinaryService.uploadMulterFile(
        degreeFile,
        'codecircle/users/degrees',
        'raw',
      );
    }

    // Create user with PENDING status (will be activated after test pass)
    const user = this.userRepo.create({
      name: fullName,
      email,
      phone,
      bio,
      cv: cvUrl,
      degree: degreeUrl,
      password: '', // Will be set after test pass
      globalStatus: GlobalStatus.PENDING,
    });

    await this.userRepo.save(user);

    return user;
  }

  async getUserMemberships(userId: string) {
    const sanitizedId = this.sanitizeUUID(userId);
    const memberships = await this.membershipRepo.find({
      where: { user: { id: sanitizedId } },
    });
    return memberships.map((m) => ({
      membershipId: m.id,
      clubId: m.clubId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      updatedAt: m.updatedAt,
    }));
  }

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    let password = createUserDto.password;
    if (!password) {
      password = this.generateRandomPassword();
    }
    const passwordHash = await (
      hash as (data: string, salt: number) => Promise<string>
    )(password, 10);

    // Convert firstName/lastName to name
    const name = [createUserDto.firstName, createUserDto.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const user = this.userRepo.create({
      name,
      email: createUserDto.email,
      password: passwordHash,
      globalStatus: GlobalStatus.PENDING,
    });
    await this.userRepo.save(user);

    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Your Account Has Been Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to CodeCircle!</h2>
          <p>Your account has been created by an admin.</p>
          <p><b>Email:</b> ${user.email}</p>
          <p><b>Temporary Password:</b> ${password}</p>
          <p>Please log in and change your password immediately.</p>
        </div>
      `,
    });

    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepo.findAndCount({
      relations: ['userRoles', 'userRoles.role'],
      skip,
      take: limit,
      order: {
        createdAt: order,
      },
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async registerMemberForClub(dto: RegisterMemberForClubDto): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const clubId = this.sanitizeUUID(dto.clubId);

    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException(`Club with ID "${clubId}" not found`);
    }
    if (!club.isActive) {
      throw new BadRequestException('This club is not currently active.');
    }

    const existingUser = await this.userRepo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
    let user: User;

    if (existingUser) {
      const hasNonMemberRole = existingUser.userRoles?.some(
        (ur) => ur.role?.name && ur.role.name !== 'MEMBER',
      );
      if (hasNonMemberRole) {
        throw new ConflictException(
          'This email is already used for another account type.',
        );
      }

      existingUser.name = fullName;
      if (existingUser.globalStatus !== GlobalStatus.ACTIVE) {
        existingUser.globalStatus = GlobalStatus.PENDING;
      }
      user = await this.userRepo.save(existingUser);
    } else {
      const createdUser = this.userRepo.create({
        name: fullName,
        email,
        password: '',
        globalStatus: GlobalStatus.PENDING,
      });
      user = await this.userRepo.save(createdUser);
    }

    const existingMembership = await this.membershipRepo.findOne({
      where: {
        userId: user.id,
        clubId,
      },
    });

    if (existingMembership?.status === MembershipStatus.ACTIVE) {
      throw new ConflictException('You have already joined this club.');
    }
    if (existingMembership?.status === MembershipStatus.PENDING) {
      throw new ConflictException(
        'Your join request for this club is already pending.',
      );
    }
    if (existingMembership?.status === MembershipStatus.REJECTED) {
      existingMembership.status = MembershipStatus.PENDING;
      existingMembership.role = MembershipRole.MEMBER;
      await this.membershipRepo.save(existingMembership);
      return user;
    }

    const membership = this.membershipRepo.create({
      userId: user.id,
      clubId,
      role: MembershipRole.MEMBER,
      status: MembershipStatus.PENDING,
    });
    await this.membershipRepo.save(membership);

    return user;
  }

  async getPendingCreatorApplications(
    page = 1,
    limit = 20,
    statusFilter: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING',
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const skip = (safePage - 1) * safeLimit;
    const normalizedStatus = String(statusFilter).toUpperCase();
    const statusMap: Record<string, GlobalStatus> = {
      PENDING: GlobalStatus.PENDING,
      APPROVED: GlobalStatus.ACTIVE,
      REJECTED: GlobalStatus.REJECTED,
    };
    const targetStatus = statusMap[normalizedStatus] ?? GlobalStatus.PENDING;
    const creatorAttemptUsersSubquery = this.testAttemptRepo
      .createQueryBuilder('attemptFilter')
      .select('attemptFilter.userId')
      .distinct(true)
      .innerJoin('attemptFilter.test', 'testFilter')
      .where('attemptFilter.purpose = :purpose', {
        purpose: TestPurpose.CREATE_CLUB,
      })
      .andWhere('testFilter.type = :testType', {
        testType: TestType.CREATOR_TEST,
      })
      .getQuery();

    const query = this.userRepo
      .createQueryBuilder('user')
      .distinct(true)
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('user.globalStatus = :status', { status: targetStatus })
      .andWhere(
        new Brackets((qb) => {
          qb.where('role.name = :creatorRole', { creatorRole: 'CREATOR' }).orWhere(
            `"user"."id"::text IN (${creatorAttemptUsersSubquery})`,
          );
        }),
      )
      .setParameters({
        purpose: TestPurpose.CREATE_CLUB,
        testType: TestType.CREATOR_TEST,
      })
      .orderBy('user.createdAt', 'DESC');

    const total = await query.getCount();
    const pendingCreators = await query.skip(skip).take(safeLimit).getMany();

    const data = await Promise.all(
      pendingCreators.map(async (user) => {
        const latestAttempt = await this.testAttemptRepo
          .createQueryBuilder('attempt')
          .leftJoinAndSelect('attempt.test', 'test')
          .where('attempt.userId = :userId', { userId: user.id })
          .andWhere('attempt.purpose = :purpose', {
            purpose: TestPurpose.CREATE_CLUB,
          })
          .andWhere('test.type = :testType', {
            testType: TestType.CREATOR_TEST,
          })
          .orderBy('attempt.attemptedAt', 'DESC')
          .getOne();

        return {
          userId: user.id,
          fullName: user.name,
          email: user.email,
          globalStatus: user.globalStatus,
          phone: user.phone,
          bio: user.bio,
          cv: this.cloudinaryService.getSignedAssetUrl(user.cv) ?? user.cv,
          degree:
            this.cloudinaryService.getSignedAssetUrl(user.degree) ?? user.degree,
          registeredAt: user.createdAt,
          application: latestAttempt
            ? {
                attemptId: latestAttempt.id,
                categoryId: latestAttempt.intendedCategoryId,
                clubName: latestAttempt.intendedClubName,
                score: latestAttempt.score,
                passed: latestAttempt.passed,
                attemptedAt: latestAttempt.attemptedAt,
                testId: latestAttempt.testId,
                proctoringVideoUrl:
                  this.cloudinaryService.getSignedAssetUrl(
                    latestAttempt.proctoringVideoUrl,
                  ) ?? latestAttempt.proctoringVideoUrl,
              }
            : null,
        };
      }),
    );

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNextPage: safePage < Math.ceil(total / safeLimit),
        hasPreviousPage: safePage > 1,
      },
    };
  }

  async findOne(id: string) {
    const sanitizedId = this.sanitizeUUID(id);
    const user = await this.userRepo.findOne({
      where: { id: sanitizedId },
      relations: [
        'userRoles',
        'userRoles.role',
        'userPermissions',
        'userPermissions.permission',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${sanitizedId}" not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const sanitizedId = this.sanitizeUUID(id);
    const user = await this.userRepo.findOne({ where: { id: sanitizedId } });

    if (!user) {
      throw new NotFoundException(`User with ID "${sanitizedId}" not found`);
    }

    // Check if email is being updated and if it's already in use
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepo.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Handle password update
    let updateData: Partial<User> = {};
    if (updateUserDto.password) {
      const passwordHash = await (
        hash as (data: string, salt: number) => Promise<string>
      )(updateUserDto.password, 10);
      updateData.password = passwordHash;
    }

    // Handle name update (from firstName/lastName)
    if (updateUserDto.firstName || updateUserDto.lastName) {
      const firstName = updateUserDto.firstName ?? user.name.split(' ')[0];
      const lastName =
        updateUserDto.lastName ?? user.name.split(' ').slice(1).join(' ');
      updateData.name = [firstName, lastName].filter(Boolean).join(' ').trim();
    }

    // Handle email update
    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }

    await this.userRepo.update(sanitizedId, updateData);

    const updatedUser = await this.userRepo.findOne({
      where: { id: sanitizedId },
    });
    return updatedUser;
  }

  async remove(id: string) {
    const sanitizedId = this.sanitizeUUID(id);
    const user = await this.userRepo.findOne({ where: { id: sanitizedId } });

    if (!user) {
      throw new NotFoundException(`User with ID "${sanitizedId}" not found`);
    }

    await this.userRepo.remove(user);
    return { message: `User "${sanitizedId}" deleted successfully` };
  }

  async approveCreator(dto: ApproveCreatorDto & { adminId: string }) {
    const admin: User | null = await this.userRepo.findOne({
      where: { id: dto.adminId },
      relations: ['userRoles', 'userRoles.role'],
    });
    const isAdmin =
      admin && admin.userRoles?.some((ur) => ur.role?.name === 'ADMIN');
    if (!isAdmin) {
      throw new BadRequestException('Only ADMIN can approve creators.');
    }

    const user: User | null = await this.userRepo.findOne({
      where: { id: dto.userId },
      relations: ['userRoles', 'userRoles.role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${dto.userId}" not found`);
    }

    const isCreator = user.userRoles?.some((ur) => ur.role?.name === 'CREATOR');
    if (!isCreator) {
      throw new BadRequestException('User is not a creator');
    }

    if (user.globalStatus === GlobalStatus.ACTIVE) {
      throw new BadRequestException('Creator already approved');
    }
    if (user.globalStatus !== GlobalStatus.PENDING) {
      throw new BadRequestException('Creator application is not pending');
    }

    const latestPassedCreatorAttempt = await this.testAttemptRepo
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.test', 'test')
      .where('attempt.userId = :userId', { userId: user.id })
      .andWhere('attempt.purpose = :purpose', {
        purpose: TestPurpose.CREATE_CLUB,
      })
      .andWhere('attempt.passed = :passed', { passed: true })
      .andWhere('test.type = :testType', { testType: TestType.CREATOR_TEST })
      .orderBy('attempt.attemptedAt', 'DESC')
      .getOne();

    if (!latestPassedCreatorAttempt) {
      throw new BadRequestException(
        'Creator cannot be approved before passing the leader application test',
      );
    }

    const password = this.generateRandomPassword();
    const passwordHash = await (
      hash as (data: string, salt: number) => Promise<string>
    )(password, 10);

    user.password = passwordHash;
    user.globalStatus = GlobalStatus.ACTIVE;

    await this.userRepo.save(user);

    try {
      await this.emailService.sendEmail({
      to: user.email,
      subject: '🎉 Congratulations! Your Creator Account Has Been Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🎉 Congratulations!</h2>
          <p>Dear ${user.name},</p>
          <p>We are pleased to inform you that your CREATOR account has been approved by the admin.</p>
          <p>Your account has been activated and you are now a <strong>CREATOR</strong> on our platform.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #d32f2f;"><strong>Important:</strong> Please log in and change your password immediately.</p>
          <p>Welcome aboard and happy creating!</p>
        </div>
      `,
      });

      return { success: true, message: 'Creator approved and email sent.' };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Creator approved but email failed for ${user.email}: ${err.message}`,
        err.stack,
      );
      return {
        success: true,
        message:
          'Creator approved successfully, but email could not be sent.',
      };
    }
  }
  private generateRandomPassword(length = 10): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async rejectCreator(dto: RejectCreatorDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${dto.userId}" not found`);
    }

    const isCreator = user.userRoles?.some((ur) => ur.role?.name === 'CREATOR');
    if (!isCreator) {
      throw new BadRequestException('User is not a creator');
    }

    if (user.globalStatus === GlobalStatus.REJECTED) {
      throw new BadRequestException('Creator already rejected');
    }
    if (user.globalStatus !== GlobalStatus.PENDING) {
      throw new BadRequestException('Creator application is not pending');
    }

    user.globalStatus = GlobalStatus.REJECTED;
    await this.userRepo.save(user);

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Your Club Creator Account Application',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Application Status Update</h2>
            <p>We regret to inform you that your club creator account application has been rejected.</p>
            <p><b>Reason:</b> ${dto.reason}</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        `,
      });

      return { success: true, message: 'Creator rejected and email sent.' };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Creator rejected but email failed for ${user.email}: ${err.message}`,
        err.stack,
      );
      return {
        success: true,
        message:
          'Creator rejected successfully, but rejection email could not be sent.',
      };
    }
  }

  async activateUser(dto: ActivateUserDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${dto.userId}" not found`);
    }

    const newStatus = dto.isActive ? GlobalStatus.ACTIVE : GlobalStatus.PENDING;

    if (user.globalStatus === newStatus) {
      throw new BadRequestException(
        `User is already ${dto.isActive ? 'active' : 'inactive'}`,
      );
    }

    user.globalStatus = newStatus;
    await this.userRepo.save(user);

    await this.emailService.sendEmail({
      to: user.email,
      subject: `Your Account Has Been ${dto.isActive ? 'Activated' : 'Deactivated'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Status Update</h2>
          <p>Your account has been ${dto.isActive ? 'activated' : 'deactivated'}.</p>
          <p><b>Email:</b> ${user.email}</p>
          ${dto.isActive ? '<p>You can now log in and use all features.</p>' : '<p>Your account access has been temporarily restricted.</p>'}
        </div>
      `,
    });

    return {
      success: true,
      message: `User ${dto.isActive ? 'activated' : 'deactivated'} successfully.`,
    };
  }
}
