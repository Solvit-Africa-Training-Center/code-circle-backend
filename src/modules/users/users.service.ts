import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterForTestDto } from './dto/register-for-test.dto';

import { ApproveCreatorDto } from './dto/approve-creator.dto';
import { RejectCreatorDto } from './dto/reject-creator.dto';
import { ActivateUserDto } from './dto/activate-user.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { GlobalStatus } from './entities/user.entity';
import { Membership } from './entities/membership.entity';
import { EmailService } from '../auth/services/email.service';
import { UserRole } from '../auth/entities/user-role.entity';
import { Role } from '../auth/entities/role.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { hash } from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
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

  async findAll(page: number = 1, limit: number = 10, order: 'ASC' | 'DESC' = 'DESC') {
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

  async findOne(id: string) {
    const sanitizedId = this.sanitizeUUID(id);
    const user = await this.userRepo.findOne({
      where: { id: sanitizedId },
      relations: ['userRoles', 'userRoles.role', 'userPermissions', 'userPermissions.permission'],
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
      const lastName = updateUserDto.lastName ?? user.name.split(' ').slice(1).join(' ');
      updateData.name = [firstName, lastName].filter(Boolean).join(' ').trim();
    }

    // Handle email update
    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }

    await this.userRepo.update(sanitizedId, updateData);
    
    const updatedUser = await this.userRepo.findOne({ where: { id: sanitizedId } });
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

    const password = this.generateRandomPassword();
    const passwordHash = await (
      hash as (data: string, salt: number) => Promise<string>
    )(password, 10);

    user.password = passwordHash;
    user.globalStatus = GlobalStatus.ACTIVE;

    await this.userRepo.save(user);

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

    user.globalStatus = GlobalStatus.REJECTED;
    await this.userRepo.save(user);

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
