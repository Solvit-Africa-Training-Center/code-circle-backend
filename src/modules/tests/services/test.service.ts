import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TestAttempt } from '../entities/test-attempt.entity';
import { Test, TestType } from '../entities/test.entity';
import { Category } from '../entities/category.entity';
import { User, GlobalStatus } from '../../users/entities/user.entity';
import { EmailService } from '../../../common/services/email.service';
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

    if (test.type === 'CREATOR_TEST') {
      if (passed) {
        await this.emailService.sendUserCreatedEmail({
          to: user.email,
          username: user.name,
          temporaryPassword: '',
          role: 'CREATOR',
        });
        // Send wait for admin approval email
      } else {
        // Send retry email after one day
        await this.emailService.sendUserCreatedEmail({
          to: user.email,
          username: user.name,
          temporaryPassword: '',
          role: 'CREATOR',
        });
      }
    } else if (test.type === 'MEMBER_TEST') {
      if (passed) {
        user.globalStatus = GlobalStatus.ACTIVE;
        await this.userRepo.save(user);
        // Send account activated email
        await this.emailService.sendUserCreatedEmail({
          to: user.email,
          username: user.name,
          temporaryPassword: '',
          role: 'MEMBER',
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
        { slug: createCategoryDto.slug },
      ],
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with ${existingCategory.name === createCategoryDto.name ? 'name' : 'slug'} "${existingCategory.name === createCategoryDto.name ? createCategoryDto.name : createCategoryDto.slug}" already exists`,
      );
    }

    const category = this.categoryRepo.create({
      name: createCategoryDto.name,
      slug: createCategoryDto.slug,
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

    const test = this.testRepo.create({
      category,
      type: createTestDto.type as TestType,
      clubId: createTestDto.clubId,
      difficulty: createTestDto.difficulty,
      passingScore: createTestDto.passingScore ?? 60,
      createdBy: createdByUser,
      isActive: createTestDto.isActive ?? true,
    });

    return await this.testRepo.save(test);
  }

  async getAllTests(): Promise<Test[]> {
    return await this.testRepo.find({
      relations: ['category', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
