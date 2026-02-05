import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { ApproveCreatorDto } from './dto/approve-creator.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { GlobalStatus } from './entities/user.entity';
import { Membership } from './entities/membership.entity';
import { EmailService } from '../auth/services/email.service';
import { hash } from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly emailService: EmailService,
  ) {}

  async getUserMemberships(userId: string) {
    const memberships = await this.membershipRepo.find({
      where: { user: { id: userId } },
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
    const user = this.userRepo.create(createUserDto);
    await this.userRepo.save(user);
    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.userRepo.update(id, updateUserDto);
    return { message: `User #${id} updated successfully` };
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async approveCreator(dto: ApproveCreatorDto & { adminId: string }) {
    const admin: User | null = await this.userRepo.findOne({
      where: { id: dto.adminId },
    });
    // Check if admin has ADMIN role via userRoles
    const isAdmin =
      admin && admin.userRoles?.some((ur) => ur.role?.name === 'ADMIN');
    if (!isAdmin) {
      return { success: false, message: 'Only ADMIN can approve creators.' };
    }
    const user: User | null = await this.userRepo.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    // Check if user is a CREATOR via userRoles
    const isCreator = user.userRoles?.some((ur) => ur.role?.name === 'CREATOR');
    if (!isCreator) {
      return { success: false, message: 'User is not a creator' };
    }
    if (user.globalStatus === GlobalStatus.ACTIVE) {
      return { success: false, message: 'Creator already approved' };
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
      subject: 'Your Club Creator Account Has Been Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations!</h2>
          <p>Your club creator account has been approved by the admin.</p>
          <p><b>Email:</b> ${user.email}</p>
          <p><b>Temporary Password:</b> ${password}</p>
          <p>Please log in and change your password immediately.</p>
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

  rejectCreator(dto: ApproveCreatorDto): {
    message: string;
    dto: ApproveCreatorDto;
  } {
    return { message: 'Creator rejected (stub)', dto };
  }

  activateUser(dto: { userId: string; isActive: boolean }) {
    return { message: 'User activation status updated (stub)', dto };
  }
}
