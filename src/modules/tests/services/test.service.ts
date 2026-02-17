import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TestAttempt } from '../entities/test-attempt.entity';
import { Test } from '../entities/test.entity';
import { TestType, TestDifficulty } from '../enums/test-type.enum';
import { Category } from '../../categories/entities/category.entity';
import { User, GlobalStatus } from '../../users/entities/user.entity';
import { EmailService } from '../../auth/services/email.service';
import { CreateCategoryDto, CreateTestDto } from '../dto/create-category-test.dto';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(TestAttempt)
    private readonly attemptRepo: Repository<TestAttempt>,
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async submitTestAttempt(
    userId: string,
    testId: string,
    score: number,
    answers: any,
    feedback?: string,
    clubId?: string,
  ) {
    const test = await this.testRepo.findOne({ where: { id: testId } });
    if (!test) throw new BadRequestException('Test not found');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const passed = score >= (test.passingScore || 60);
    const attempt = this.attemptRepo.create({
      user,
      test,
      score,
      passed,
      answers,
      feedback,
      clubId,
      attemptedAt: new Date(),
      completedAt: new Date(),
      correctedByAI: true,
    });
    await this.attemptRepo.save(attempt);

    // Note: Email notifications are now handled by TestsService.submitTest
    // This method is kept for backward compatibility but email logic has been moved
    if (test.type === 'CREATOR_TEST') {
      if (passed) {
        await this.emailService.sendEmail({
          to: user.email,
          subject: 'Test Passed - Awaiting Admin Approval',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>🎉 Congratulations!</h2>
              <p>Dear ${user.name},</p>
              <p>You have successfully passed the CREATOR test.</p>
              <p>Your application is now pending admin approval. You will receive an email with your login credentials once an admin approves your account.</p>
            </div>
          `,
        });
      } else {
        await this.emailService.sendEmail({
          to: user.email,
          subject: 'Test Results - Not Passed',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Test Results</h2>
              <p>Dear ${user.name},</p>
              <p>Unfortunately, you did not pass the test. Your score was ${score}%.</p>
              <p>You can retake the test after 24 hours.</p>
            </div>
          `,
        });
      }
    } else if (test.type === 'MEMBER_TEST') {
      if (passed) {
        user.globalStatus = GlobalStatus.ACTIVE;
        await this.userRepo.save(user);
        await this.emailService.sendEmail({
          to: user.email,
          subject: 'Test Passed - Account Activated',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>🎉 Congratulations!</h2>
              <p>Dear ${user.name},</p>
              <p>You have successfully passed the MEMBER test.</p>
              <p>Your account has been activated.</p>
            </div>
          `,
        });
      }
    }
    return attempt;
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if category with same name or slug already exists
    const existingCategory = await this.categoryRepo.findOne({
      where: [
        { name: createCategoryDto.name },
      ],
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with ${existingCategory.name === createCategoryDto.name ? 'name' : 'slug'} "${existingCategory.name === createCategoryDto.name }" already exists`,
      );
    }

    const category = this.categoryRepo.create({
      name: createCategoryDto.name,
      description: createCategoryDto.description,
      icon: createCategoryDto.icon,
      isActive: createCategoryDto.isActive ?? true,
    });

    return await this.categoryRepo.save(category);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createTest(createTestDto: CreateTestDto): Promise<Test> {
    // Validate category exists
    const category = await this.categoryRepo.findOne({
      where: { id: createTestDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createTestDto.categoryId} not found`);
    }

    // Validate user exists if createdBy is provided
    let createdByUser: User | undefined;
    if (createTestDto.createdBy) {
      const foundUser = await this.userRepo.findOne({
        where: { id: createTestDto.createdBy },
      });

      if (!foundUser) {
        throw new NotFoundException(`User with ID ${createTestDto.createdBy} not found`);
      }
      
      createdByUser = foundUser;
    }

    // Validate test type
    if (!Object.values(TestType).includes(createTestDto.type as TestType)) {
      throw new BadRequestException(
        `Invalid test type. Must be one of: ${Object.values(TestType).join(', ')}`,
      );
    }

    const test: Test = this.testRepo.create({
      category,
      categoryId: category.id,
      type: createTestDto.type as TestType,
      clubId: createTestDto.clubId,
      difficulty: createTestDto.difficulty as TestDifficulty | undefined,
      passingScore: createTestDto.passingScore ?? 60,
      createdBy: createdByUser?.id,
      creator: createdByUser,
      isActive: createTestDto.isActive ?? true,
    });

    const savedTest = await this.testRepo.save(test);
    return savedTest;
  }

  async getAllTests(): Promise<Test[]> {
    return await this.testRepo.find({
      relations: ['category', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
