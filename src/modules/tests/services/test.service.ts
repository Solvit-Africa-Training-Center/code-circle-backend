import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TestAttempt } from '../entities/test-attempt.entity';
import { Test } from '../entities/test.entity';
import { TestType, TestDifficulty, TestPurpose } from '../enums/test-type.enum';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import {
  CreateCategoryDto,
  CreateTestDto,
} from '../dto/create-category-test.dto';
import { TestResultService } from './test-result.service';

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
    private readonly testResultService: TestResultService,
  ) {}

  async submitTestAttempt(
    userId: string,
    testId: string,
    score: number,
    answers: Record<string, string>,
    feedback?: string,
    targetClubId?: string,
    purpose?: TestPurpose,
    intendedCategoryId?: string,
    intendedClubName?: string,
  ) {
    console.log('🔵 submitTestAttempt called', { userId, testId, score });
    const test = await this.testRepo.findOne({ where: { id: testId } });
    if (!test) throw new BadRequestException('Test not found');
    console.log('🔵 Test found:', test.id, 'passingScore:', test.passingScore);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    console.log(' User found: ', user.id, 'status:', user.globalStatus);

    const passed = score >= (test.passingScore || 60);
    console.log(
      'Score:',
      score,
      'passingScore:',
      test.passingScore,
      'passed: ',
      passed,
    );

    const attempt = this.attemptRepo.create({
      userId: userId, // ← string au lieu de variable
      testId: test.id, // ← testId au lieu de test (objet)
      purpose: purpose, // ← Ajouté
      intendedCategoryId: intendedCategoryId, // ← Ajouté
      intendedClubName: intendedClubName, // ← Ajouté
      targetClubId: targetClubId, // ← Renommé de clubId
      answers: answers,
      score: score,
      passed: passed,
      correctedByAI: true,
      feedback: feedback,
      completedAt: new Date(),
      // attemptedAt est auto-généré par @CreateDateColumn()
    });

    await this.attemptRepo.save(attempt);
    console.log('🔵 Attempt saved:', attempt.id);

    console.log('Calling testResultService.handleTestResult...');
    await this.testResultService.handleTestResult(userId, test, score, passed);
    console.log('testResultService.handleTestResult done');
    return attempt;
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    // Check if category with same name or slug already exists
    const existingCategory = await this.categoryRepo.findOne({
      where: [{ name: createCategoryDto.name }],
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with ${existingCategory.name === createCategoryDto.name ? 'name' : 'slug'} "${existingCategory.name === createCategoryDto.name ? createCategoryDto.name : createCategoryDto.name}" already exists`,
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
      throw new NotFoundException(
        `Category with ID ${createTestDto.categoryId} not found`,
      );
    }

    // Validate user exists if createdBy is provided
    let createdByUser: User | undefined;
    if (createTestDto.createdBy) {
      const foundUser = await this.userRepo.findOne({
        where: { id: createTestDto.createdBy },
      });

      if (!foundUser) {
        throw new NotFoundException(
          `User with ID ${createTestDto.createdBy} not found`,
        );
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
