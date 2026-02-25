/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, GlobalStatus } from '../../users/entities/user.entity';
import { Test } from '../entities/test.entity';
import { TestType } from '../enums/test-type.enum';
import { EmailService } from '../../auth/services/email.service';
import { hash } from 'bcryptjs';
import { Role } from '@circle-backend/modules/auth/entities/role.entity';
import { UserRole } from '@circle-backend/modules/auth/entities/user-role.entity';
import { ConfigService } from '@nestjs/config';
import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from '../../users/entities/membership.entity';

@Injectable()
export class TestResultService {
  private readonly logger = new Logger(TestResultService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role) // ← AJOUTER
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Point d'entrée principal
   * Appelé après chaque soumission de test
   */
  async handleTestResult(
    userId: string,
    test: Test,
    score: number,
    passed: boolean,
  ): Promise<void> {
    console.log('HandleTestResult called', {
      userId,
      score,
      passed,
      testType: test.type,
    });
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      if (passed) {
        await this.handleTestPass(user, test, score);
      } else {
        await this.handleTestFail(user, test, score);
      }
    } catch (error) {
      this.logger.error(
        `Error handling test result for user ${userId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while handling test result',
      );
    }
  }

  /**
   * Générer un mot de passe aléatoire
   */
  private generateRandomPassword(length = 12): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Gérer la réussite du test
   */
  private async handleTestPass(
    user: User,
    test: Test,
    score: number,
  ): Promise<void> {
    try {
      if (test.type === TestType.MEMBER_TEST) {
        await this.handleMemberTestPass(user, test, score);
      } else if (test.type === TestType.CREATOR_TEST) {
        await this.handleCreatorTestPass(user, test, score);
      }
    } catch (error) {
      this.logger.error(
        `Error handling test pass for user ${user.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * MEMBER_TEST réussi :
   * → Activation immédiate + envoi credentials
   */
  private async handleMemberTestPass(
    user: User,
    test: Test,
    score: number,
  ): Promise<void> {
    try {
      // 1. Générer le mot de passe temporaire
      const tempPassword = this.generateRandomPassword();
      const passwordHash = await hash(tempPassword, 10);

      // 2. Activer le compte et sauvegarder le mot de passe
      user.password = passwordHash;
      user.globalStatus = GlobalStatus.ACTIVE;
      await this.userRepository.save(user);

      const memberRole = await this.roleRepository.findOne({
        where: { name: 'MEMBER' },
      });

      if (!memberRole) {
        this.logger.error('MEMBER role not found in database');
        throw new InternalServerErrorException('System configuration error');
      }

      const existingUserRole = await this.userRoleRepository.findOne({
        where: {
          user: { id: user.id },
          role: { id: memberRole.id },
        },
      });

      if (!existingUserRole) {
        const userRole = this.userRoleRepository.create({
          user: { id: user.id },
          role: { id: memberRole.id },
        });
        await this.userRoleRepository.save(userRole);

        this.logger.log(`MEMBER role assigned to user: ${user.id}`);
      }

      // Ensure the member is actually joined in backend for this club.
      if (test.clubId) {
        const existingMembership = await this.membershipRepository.findOne({
          where: {
            userId: user.id,
            clubId: test.clubId,
          },
        });

        if (existingMembership) {
          existingMembership.status = MembershipStatus.ACTIVE;
          existingMembership.role = MembershipRole.MEMBER;
          await this.membershipRepository.save(existingMembership);
        } else {
          const membership = this.membershipRepository.create({
            userId: user.id,
            clubId: test.clubId,
            role: MembershipRole.MEMBER,
            status: MembershipStatus.ACTIVE,
          });
          await this.membershipRepository.save(membership);
        }
      }

      this.logger.log(`MEMBER account activated for user: ${user.id}`);

      // 3. Envoyer l'email avec les credentials
      await this.emailService.sendEmail({
        to: user.email,
        subject: '🎉 Congratulations! You Passed - Your Credentials',
        html: this.buildMemberSuccessEmail(
          user.name,
          user.email,
          tempPassword,
          score,
        ),
      });

      this.logger.log(`Credentials email sent to MEMBER: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error handling member test pass: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * CREATOR_TEST réussi :
   * → Status reste PENDING, en attente admin
   * → Mot de passe généré mais pas encore actif
   */
  private async handleCreatorTestPass(
user: User, test: Test, score: number,
  ): Promise<void> {
    try {
      // 1. Générer le mot de passe temporaire
      const tempPassword = this.generateRandomPassword();
      const passwordHash = await hash(tempPassword, 10);

      // 2. Sauvegarder le mot de passe, status reste PENDING
      user.password = passwordHash;
      await this.userRepository.save(user);

      const createRole = await this.roleRepository.findOne({
        where: { name: 'CREATOR' },
      });

      if (!createRole) {
        this.logger.error(`CREATOR role not found in database`);
        throw new InternalServerErrorException('System configuration error');
      }

      const existingUserRole = await this.userRoleRepository.findOne({
        where: {
           user: { id: user.id },
          role: { id: createRole.id },
        },
      });

      if (!existingUserRole) {
        const userRole = this.userRoleRepository.create({
          user: { id: user.id },
          role: { id: createRole.id },
        });
        await this.userRoleRepository.save(userRole);

        this.logger.log(`CREATOR role assigned to user: ${user.id}`);
      }

      this.logger.log(
        `CREATOR test passed, waiting for admin approval: ${user.id}`,
      );

      // 3. Envoyer l'email avec les credentials (actifs après approbation)
      await this.emailService.sendEmail({
        to: user.email,
        subject: '🎉 Test Passed - Awaiting Admin Approval',
        html: this.buildCreatorSuccessEmail(
          user.name,
          user.email,
          tempPassword,
          score,
        ),
      });

      await this.notifyAdminsForCreatorApplication(user, test, score);

      this.logger.log(`Pending approval email sent to CREATOR: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error handling creator test pass: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async notifyAdminsForCreatorApplication(
    user: User,
    test: Test,
    score: number,
  ): Promise<void> {
    const recipientsValue =
      this.configService.get<string>('ADMIN_APPLICATION_EMAILS') ??
      this.configService.get<string>('ADMIN_EMAIL');

    if (!recipientsValue) {
      this.logger.warn(
        'ADMIN_APPLICATION_EMAILS / ADMIN_EMAIL is not configured; admin notification skipped',
      );
      return;
    }

    const recipients = recipientsValue
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    if (!recipients.length) {
      return;
    }

    const categoryLabel = test.category?.name || test.categoryId || 'Unknown';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Leader Application Pending Approval</h2>
        <p>A creator test application is waiting for review.</p>
        <ul>
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Score:</strong> ${score}%</li>
          <li><strong>Category:</strong> ${categoryLabel}</li>
          <li><strong>User ID:</strong> ${user.id}</li>
        </ul>
      </div>
    `;

    await Promise.all(
      recipients.map((to) =>
        this.emailService.sendEmail({
          to,
          subject: 'Leader Application Pending Review',
          html,
        }),
      ),
    );
  }

  /**
   * Test échoué :
   * → Status REJECTED + email d'échec
   */
  private async handleTestFail(
    user: User,
    test: Test,
    score: number,
  ): Promise<void> {
    try {
      // Mettre à jour le status
      user.globalStatus = GlobalStatus.REJECTED;
      await this.userRepository.save(user);

      this.logger.log(`Test failed for user: ${user.id}, score: ${score}%`);

      // Envoyer l'email d'échec
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Test Results - Not Passed',
        html: this.buildFailEmail(user.name, score, test.passingScore),
      });

      this.logger.log(`Failure email sent to: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Error handling test fail: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ─────────────────────────────────────────
  //            EMAIL TEMPLATES
  // ─────────────────────────────────────────

  private buildMemberSuccessEmail(
    name: string,
    email: string,
    password: string,
    score: number,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
        </div>

        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>

          <p>You have successfully passed the test with a score of
            <strong style="color: #4CAF50;">${score}%</strong>!
          </p>

          <p>Your account has been <strong>activated</strong> and you are now a member of CodeCircle.</p>

          <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">🔐 Your Login Credentials</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong>
              <span style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-size: 16px;">
                ${password}
              </span>
            </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #856404;">
              ⚠️ <strong>Important:</strong> Please log in and change your password immediately.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/login"
               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Login Now
            </a>
          </div>
        </div>

        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} CodeCircle. All rights reserved.
        </p>
      </div>
    `;
  }

  private buildCreatorSuccessEmail(
    name: string,
    email: string,
    password: string,
    score: number,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2196F3; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Test Passed!</h1>
        </div>

        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>

          <p>You have successfully passed the CREATOR test with a score of
            <strong style="color: #2196F3;">${score}%</strong>!
          </p>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              ⏳ <strong>Pending Admin Approval:</strong> Your application is under review.
              You will receive another email once approved.
            </p>
          </div>

          <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">🔐 Your Login Credentials</h3>
            <p style="color: #666; font-size: 14px;">
              These credentials will be active once your account is approved.
            </p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong>
              <span style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-size: 16px;">
                ${password}
              </span>
            </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #856404;">
              ⚠️ <strong>Important:</strong> Once approved, please change your password immediately.
            </p>
          </div>
        </div>

        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} CodeCircle. All rights reserved.
        </p>
      </div>
    `;
  }

  private buildFailEmail(
    name: string,
    score: number,
    passingScore: number,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f44336; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Test Results</h1>
        </div>

        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>

          <p>Unfortunately, you did not achieve the passing score this time.</p>

          <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 18px;">
              Your Score: <strong style="color: #f44336;">${score}%</strong>
            </p>
            <p style="color: #666;">
              Passing Score: <strong>${passingScore}%</strong>
            </p>
          </div>

          <div style="background-color: #e3f2fd; border: 1px solid #2196F3; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #1565c0;">
              💡 <strong>Don't give up!</strong> You can retake the test after <strong>24 hours</strong>.
            </p>
          </div>
        </div>

        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} CodeCircle. All rights reserved.
        </p>
      </div>
    `;
  }
}
