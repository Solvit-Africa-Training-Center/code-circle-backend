/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Test } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
import { TestType, TestPurpose, TestDifficulty } from './enums/test-type.enum';
import { User, GlobalStatus } from '../users/entities/user.entity';
import { hash } from 'bcryptjs';
import { CategoriesService } from '../categories/categories.service';
import { ClubsService } from '../clubs/clubs.service';
import { TestResultService } from './services/test-result.service';
import { QuestionPoolService } from './services/questions-pool.service';
import { PoolType } from './entities/question-pool.entity';

@Injectable()
export class TestsService {
  private readonly logger = new Logger(TestsService.name);

  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(TestQuestion)
    private readonly testQuestionRepository: Repository<TestQuestion>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    private readonly categoriesService: CategoriesService,
    private readonly clubsService: ClubsService,
    private readonly testResultService: TestResultService,
    private readonly questionPoolService: QuestionPoolService,
  ) {}

  /**
   * Create a new test
   */
  async create(createTestDto: CreateTestDto): Promise<Test> {
    try {
      // Validation: MEMBER_TEST must have a clubId
      if (
        createTestDto.type === TestType.MEMBER_TEST &&
        !createTestDto.clubId
      ) {
        throw new BadRequestException(
          'clubId is required for MEMBER_TEST type',
        );
      }

      // Validation: CREATOR_TEST ne doit pas avoir de clubId
      if (
        createTestDto.type === TestType.CREATOR_TEST &&
        createTestDto.clubId
      ) {
        throw new BadRequestException(
          'clubId should not be provided for CREATOR_TEST type',
        );
      }

      // Vérifier que toutes les correctAnswer sont dans les options
      for (const questionDto of createTestDto.questions) {
        if (!questionDto.options.includes(questionDto.correctAnswer)) {
          throw new BadRequestException(
            `Correct answer "${questionDto.correctAnswer}" must be one of the options for question: "${questionDto.question}"`,
          );
        }
      }

      // Créer le test
      const test = this.testRepository.create({
        type: createTestDto.type,
        categoryId: createTestDto.categoryId,
        clubId: createTestDto.clubId,
        difficulty: createTestDto.difficulty,
        passingScore: createTestDto.passingScore,
        createdBy: createTestDto.createdBy,
      });

      const savedTest = await this.testRepository.save(test);

      // Créer les questions
      const questions = createTestDto.questions.map((questionDto) =>
        this.testQuestionRepository.create({
          testId: savedTest.id,
          question: questionDto.question,
          options: questionDto.options,
          correctAnswer: questionDto.correctAnswer,
          points: questionDto.points,
          orderIndex: questionDto.orderIndex,
        }),
      );

      await this.testQuestionRepository.save(questions);

      this.logger.log(
        `Test created: ${savedTest.id} with ${questions.length} questions`,
      );

      // Recharger le test avec les questions
      return await this.findOne(savedTest.id);
    } catch (error) {
      this.logger.error(`Error creating test: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while creating the test',
      );
    }
  }

  /**
   * Récupérer tous les tests avec pagination
   */
  async findAll(paginationParams: PaginationParams) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        search,
        filters,
      } = paginationParams;

      const queryBuilder = this.testRepository
        .createQueryBuilder('test')
        .leftJoinAndSelect('test.category', 'category')
        .leftJoinAndSelect('test.questions', 'questions');

      // Filtres
      if (filters?.type) {
        queryBuilder.andWhere('test.type = :type', { type: filters.type });
      }

      if (filters?.categoryId) {
        queryBuilder.andWhere('test.categoryId = :categoryId', {
          categoryId: filters.categoryId,
        });
      }

      if (filters?.clubId) {
        queryBuilder.andWhere('test.clubId = :clubId', {
          clubId: filters.clubId,
        });
      }

      if (filters?.isActive !== undefined) {
        queryBuilder.andWhere('test.isActive = :isActive', {
          isActive: filters.isActive,
        });
      }

      if (search) {
        queryBuilder.andWhere('category.name ILIKE :search', {
          search: `%${search}%`,
        });
      }

      const total = await queryBuilder.getCount();

      const tests = await queryBuilder
        .orderBy(`test.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Retrieved ${tests.length} tests (page ${page}/${totalPages})`,
      );

      return {
        data: tests,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching tests: ${error.message}`, error.stack);

      throw new InternalServerErrorException(
        'An error occurred while retrieving tests',
      );
    }
  }

  /**
   * Récupérer un test par ID (avec questions)
   */
  async findOne(id: string): Promise<Test> {
    try {
      const test = await this.testRepository.findOne({
        where: { id },
        relations: ['questions', 'category'],
      });

      if (!test) {
        throw new NotFoundException(`Test with ID "${id}" not found`);
      }

      // Trier les questions par orderIndex
      if (test.questions) {
        test.questions.sort((a, b) => a.orderIndex - b.orderIndex);
      }

      this.logger.log(`Test found: ${test.id}`);

      return test;
    } catch (error) {
      this.logger.error(
        `Error fetching test with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving the test',
      );
    }
  }

  /**
   * Récupérer un test pour passer (sans les bonnes réponses)
   */
  async findOneForTaking(id: string): Promise<Test> {
    try {
      const test = await this.findOne(id);

      if (!test.isActive) {
        throw new BadRequestException('This test is not currently active');
      }

      // Supprimer les correctAnswer pour ne pas les exposer
      test.questions = test.questions.map((q) => {
        const { correctAnswer, ...questionWithoutAnswer } = q as any;
        return questionWithoutAnswer as TestQuestion;
      });

      return test;
    } catch (error) {
      this.logger.error(
        `Error fetching test for taking: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving the test',
      );
    }
  }

  async findCreatorTestByCategory(categoryId: string): Promise<Test> {
    //
    const poolQuestions = await this.questionPoolService.selectRandomQuestions(
      PoolType.CATEGORY,
      categoryId,
    );

    // 2. CRÉER un nouveau Test
    const test = this.testRepository.create({
      type: TestType.CREATOR_TEST,
      categoryId,
      difficulty: TestDifficulty.INTERMEDIATE,
      passingScore: 70,
      isActive: true,
    });
    const savedTest = await this.testRepository.save(test);

    // 3. COPIER les 10 questions du pool vers test_questions
    const testQuestions = poolQuestions.map((pq, index) =>
      this.testQuestionRepository.create({
        testId: savedTest.id, // ← Lié au test créé
        type: pq.questionType,
        question: pq.question,
        options: pq.options,
        correctAnswer: pq.correctAnswer,
        testCases: pq.testCases,
        codeTemplate: pq.codeTemplate,
        evaluationCriteria: pq.evaluationCriteria,
        points: pq.points,
        orderIndex: index + 1,
      }),
    );
    await this.testQuestionRepository.save(testQuestions);

    // 4. Recharger et retourner (sans correctAnswer)
    const fullTest = await this.findOne(savedTest.id);
    fullTest.questions = fullTest.questions.map((q) => {
      const { correctAnswer, ...rest } = q as any;
      return rest;
    });

    return fullTest;
  }

  /**
   * Récupérer le test MEMBER pour un club donné
   */
  async findMemberTestByClub(clubId: string): Promise<Test> {
    try {
      const club = await this.clubsService.findOne(clubId);

      const test = await this.testRepository.findOne({
        where: {
          clubId,
          type: TestType.MEMBER_TEST, // ← Utilise ton enum existant
          isActive: true,
        },
        relations: ['questions', 'category'],
      });

      if (!test) {
        throw new NotFoundException(
          `No active MEMBER_TEST found for club "${club.name}"`,
        );
      }

      test.questions.sort((a, b) => a.orderIndex - b.orderIndex);
      test.questions = test.questions.map((q) => {
        const { correctAnswer, ...questionWithoutAnswer } = q as any;
        return questionWithoutAnswer as TestQuestion;
      });

      return test;
    } catch (error) {
      this.logger.error(
        `Error fetching member test for club: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving the test',
      );
    }
  }

  /**
   * Récupérer le test pour une catégorie et un type spécifique
   */
  async findByCategory(categoryId: string, type: TestType): Promise<Test> {
    try {
      const test = await this.testRepository.findOne({
        where: {
          categoryId,
          type,
          isActive: true,
          clubId: undefined, // Pour les creator tests uniquement
        },
        relations: ['questions', 'category'],
      });

      if (!test) {
        throw new NotFoundException(
          `No active ${type} found for category "${categoryId}"`,
        );
      }

      // Trier les questions
      test.questions.sort((a, b) => a.orderIndex - b.orderIndex);

      // Supprimer les correctAnswer
      test.questions = test.questions.map((q) => {
        const { correctAnswer, ...questionWithoutAnswer } = q as any;
        return questionWithoutAnswer as TestQuestion;
      });

      return test;
    } catch (error) {
      this.logger.error(
        `Error fetching test for category: ${error.message}`,

        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while retrieving the test',
      );
    }
  }
  /**
   * Soumettre un test
   */
  async submitTest(submitTestDto: SubmitTestDto): Promise<{
    passed: boolean;
    score: number;
    attemptId: string | undefined;
    feedback?: string;
  }> {
    try {
      // ═══════════════════════════════════════════════════════
      //           VALIDATIONS COMMUNES
      // ═══════════════════════════════════════════════════════
      if (!submitTestDto.userId) {
        throw new BadRequestException('userId is required');
      }
      if (!submitTestDto.testId) {
        throw new BadRequestException('testId is required');
      }
      if (!submitTestDto.answers) {
        throw new BadRequestException('answers are required');
      }

      if (submitTestDto.purpose === TestPurpose.CREATE_CLUB) {
        // ✅ Pour CREATOR : On a besoin de categoryId seulement
        if (!submitTestDto.categoryId) {
          throw new BadRequestException(
            'categoryId is required for CREATE_CLUB purpose',
          );
        }

        // Vérifier que la catégorie existe et est active
        const category = await this.categoriesService.findOne(
          submitTestDto.categoryId,
        );
        if (!category.isActive) {
          throw new BadRequestException(
            `Category "${category.name}" is not active`,
          );
        }
      } else if (submitTestDto.purpose === TestPurpose.JOIN_CLUB) {
        // ✅ Pour MEMBER : On a besoin de targetClubId
        if (!submitTestDto.targetClubId) {
          throw new BadRequestException(
            'targetClubId is required for JOIN_CLUB purpose',
          );
        }

        const club = await this.clubsService.findOne(
          submitTestDto.targetClubId,
        );
        if (!club.isActive) {
          throw new BadRequestException('This club is not currently active');
        }
      }

      const test = await this.findOne(submitTestDto.testId);

      if (!test.isActive) {
        throw new BadRequestException('This test is not currently active');
      }

      let totalPoints = 0;
      let earnedPoints = 0;

      for (const question of test.questions) {
        totalPoints += question.points;

        const userAnswer = submitTestDto.answers[question.id];
        if (userAnswer && userAnswer === question.correctAnswer) {
          earnedPoints += question.points;
        }
      }

      const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);
      const passed = scorePercentage >= test.passingScore;

      const attempt = this.testAttemptRepository.create({
        userId: submitTestDto.userId,
        testId: test.id,
        purpose: submitTestDto.purpose,
        intendedCategoryId: submitTestDto.categoryId,
        intendedClubName: submitTestDto.clubName,
        targetClubId: submitTestDto.targetClubId,
        answers: submitTestDto.answers,
        score: scorePercentage,
        passed,
        correctedByAI: false,
        completedAt: new Date(),
      });

      const savedAttempt = await this.testAttemptRepository.save(attempt);

      this.logger.log(
        `Test submitted: User ${submitTestDto.userId} - Purpose: ${submitTestDto.purpose} - Score: ${scorePercentage}% - Passed: ${passed}`,
      );

      console.log('🟢 Calling testResultService.handleTestResult...');
      await this.testResultService.handleTestResult(
        submitTestDto.userId,
        test,
        scorePercentage,
        passed,
      );
      console.log('🟢 testResultService.handleTestResult done');

      return {
        passed,
        score: scorePercentage,
        attemptId: savedAttempt.id,
        feedback: passed
          ? 'Congratulations! You passed the test.'
          : `You scored ${scorePercentage}%. The passing score is ${test.passingScore}%.`,
      };
    } catch (error) {
      this.logger.error(`Error submitting test: ${error.message}`, error.stack);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while submitting the test',
      );
    }
  }

  /**
   * Récupérer les tentatives d'un utilisateur avec détails
   */
  async getUserAttemptsWithDetails(
    userId: string,
    paginationParams: PaginationParams,
  ) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'attemptedAt',
        sortOrder = 'DESC',
      } = paginationParams;

      const queryBuilder = this.testAttemptRepository
        .createQueryBuilder('attempt')
        .leftJoinAndSelect('attempt.test', 'test')
        .leftJoinAndSelect('test.category', 'category')
        .where('attempt.userId = :userId', { userId });

      const total = await queryBuilder.getCount();

      const attempts = await queryBuilder
        .orderBy(`attempt.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      return {
        data: attempts,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching user attempts: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while retrieving user attempts',
      );
    }
  }

  /**
   * Récupérer toutes les tentatives (pour l'admin)
   */
  async getAllAttempts(
    paginationParams: PaginationParams & {
      passed?: boolean;
      purpose?: TestPurpose;
    },
  ) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'attemptedAt',
        sortOrder = 'DESC',
        passed,
        purpose,
      } = paginationParams;

      const queryBuilder = this.testAttemptRepository
        .createQueryBuilder('attempt')
        .leftJoinAndSelect('attempt.test', 'test')
        .leftJoinAndSelect('test.category', 'category');

      if (passed !== undefined) {
        queryBuilder.andWhere('attempt.passed = :passed', { passed });
      }

      if (purpose) {
        queryBuilder.andWhere('attempt.purpose = :purpose', { purpose });
      }

      const total = await queryBuilder.getCount();

      const attempts = await queryBuilder
        .orderBy(`attempt.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      return {
        data: attempts,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching all attempts: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        'An error occurred while retrieving attempts',
      );
    }
  }

  /**
   * Mettre à jour un test
   */
  async update(id: string, updateTestDto: UpdateTestDto): Promise<Test> {
    try {
      const test = await this.findOne(id);

      Object.assign(test, updateTestDto);

      const updatedTest = await this.testRepository.save(test);

      this.logger.log(`Test updated: ${updatedTest.id}`);

      return await this.findOne(updatedTest.id);
    } catch (error) {
      this.logger.error(
        `Error updating test with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while updating the test',
      );
    }
  }

  /**
   * Soft delete
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const test = await this.findOne(id);

      test.isActive = false;
      await this.testRepository.save(test);

      this.logger.log(`Test deactivated: ${test.id}`);

      return { message: 'Test has been deactivated' };
    } catch (error) {
      this.logger.error(
        `Error deactivating test with ID ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while deactivating the test',
      );
    }
  }
}
