import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
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
  ): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

    const user = this.userRepo.create({
      email,
      passwordHash,
      firstName,
      lastName,
      emailVerified: false,
      isActive: true,
    });

    await this.userRepo.save(user);

    const memberRole = await this.roleRepo.findOne({
      where: { name: 'MEMBER' },
    });
    if (!memberRole) {
      this.logger.error('Default role MEMBER not found in database');
      throw new Error('Default role MEMBER not found');
    }

    await this.userRoleRepo.save(
      this.userRoleRepo.create({
        user,
        role: memberRole,
      }),
    );

    this.logger.log(`New user registered: ${user.id} (${email})`);

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

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account has been disabled');
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

    if (!user.isActive) {
      throw new ForbiddenException('Account has been disabled');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Email not verified. Please check your inbox.',
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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
    user.passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.userRepo.save(user);

    this.logger.log(`Password updated for user: ${user.id}`);
  }

  async changePassword(
    user: User,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!user.passwordHash) {
      throw new BadRequestException('User has no password set');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.updatePassword(user, newPassword);

    await this.tokenService.revokeAllForUser(user.id);

    this.logger.log(`Password changed for user: ${user.id}`);
  }
}
