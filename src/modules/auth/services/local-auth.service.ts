import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, GlobalStatus } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { EmailService } from './email.service';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly emailService: EmailService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    role?: string,
  ): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHashed = await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      email,
      password: passwordHashed,
      name: [firstName, lastName].filter(Boolean).join(' '),
      globalStatus: GlobalStatus.ACTIVE,
    });

    await this.userRepo.save(user);

    let assignedRoleName = 'MEMBER';
    if (role && typeof role === 'string' && role.toUpperCase() === 'ADMIN') {
      assignedRoleName = 'ADMIN';
    }
    const assignedRole = await this.roleRepo.findOne({
      where: { name: assignedRoleName },
    });
    if (!assignedRole) {
      this.logger.error(`Role ${assignedRoleName} not found in database`);
      throw new Error(`Role ${assignedRoleName} not found`);
    }

    await this.userRoleRepo.save(
      this.userRoleRepo.create({
        user,
        role: assignedRole,
      }),
    );

    this.logger.log(`New user registered: ${user.id} (${email}) with role ${assignedRoleName}`);

    return user;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['twoFactorSecrets'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.globalStatus !== 'active') {
      throw new ForbiddenException('Account is not active');
    }

    return user;
  }

  async login(
    email: string,
    password: string,
    twoFactorCode?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role', 'twoFactorSecrets'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.globalStatus !== 'active') {
      throw new ForbiddenException('Account is not active');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const has2FA = user.twoFactorSecrets?.some((t) => t.enabled);
    if (has2FA) {
      if (!twoFactorCode) {
        throw new UnauthorizedException('2FA code required');
      }

      const is2FAValid = await this.twoFactorService.validateToken(
        user,
        twoFactorCode,
      );
      if (!is2FAValid) {
        this.logger.warn(`Invalid 2FA code for user: ${email}`);
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    this.logger.log(`Successful login for user: ${user.id} (${email})`);

    return this.tokenService.issueRefreshToken(user, { singleDevice: true });
  }

  async logout(userId: string): Promise<{ success: boolean; message: string }> {
    await this.tokenService.revokeAllForUser(userId);

    this.logger.log(`User logged out: ${userId}`);

    return { success: true, message: 'Logged out successfully' };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePassword(user: User, newPassword: string): Promise<void> {
    user.password = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.userRepo.save(user);

    this.logger.log(`Password updated for user: ${user.id}`);
  }

  async changePassword(
    user: User,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!user.password) {
      throw new BadRequestException('User has no password set');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.updatePassword(user, newPassword);

    await this.tokenService.revokeAllForUser(user.id);

    this.logger.log(`Password changed for user: ${user.id}`);
  }
}
