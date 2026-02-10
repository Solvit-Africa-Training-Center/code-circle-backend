import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from './entities/test.entity';
import { TestQuestion } from './entities/test-question.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import { PaginationParams } from '../../common/decorators/api-properties';
import { TestType } from './enums/test-type.enum';

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
        const { correctAnswer, ...questionWithoutAnswer } = q as any;
        return questionWithoutAnswer as TestQuestion;
      });

      return test;
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Error fetching test for category: ${error.message}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
   * Soumettre un test et obtenir les résultats
   */
  async submitTest(
    userId: string,
    submitTestDto: SubmitTestDto,
  ): Promise<TestAttempt> {
    try {
      const test = await this.findOne(submitTestDto.testId);

      if (!test.isActive) {
        throw new BadRequestException('This test is not currently active');
      }

      // Calculer le score
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

      // Créer la tentative
      const attempt = this.testAttemptRepository.create({
        userId,
        testId: test.id,
        clubId: submitTestDto.clubId,
        answers: submitTestDto.answers,
        score: scorePercentage,
        passed,
        correctedByAI: false, // TODO: Intégrer l'IA plus tard
        completedAt: new Date(),
      });

      const savedAttempt = await this.testAttemptRepository.save(attempt);

      this.logger.log(
        `Test attempt saved: ${savedAttempt.id} - Score: ${scorePercentage}% - Passed: ${passed}`,
      );

      return savedAttempt;
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
   * Récupérer les tentatives d'un utilisateur
   */
  async getUserAttempts(userId: string, paginationParams: PaginationParams) {
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
