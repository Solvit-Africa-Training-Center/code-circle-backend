import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import { QuizQuestion, QuestionType } from './entities/quiz-question.entity';
import { QuizAttempt, AttemptStatus } from './entities/quiz-attempt.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto, SubmitQuizAnswerDto } from './dto/index';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestionRepository: Repository<QuizQuestion>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
  ) {}

  async createQuiz(dto: CreateQuizDto, userId: string): Promise<Quiz> {
    const quiz = this.quizRepository.create({ ...dto, createdBy: userId });
    const savedQuiz = await this.quizRepository.save(quiz);
    if (dto.questions && dto.questions.length > 0) {
      const questions = dto.questions.map(q =>
        this.quizQuestionRepository.create({ ...q, quizId: savedQuiz.id })
      );
      await this.quizQuestionRepository.save(questions);
    }
    return savedQuiz;
  }

  async getQuizById(id: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({ where: { id }, relations: ['questions'] });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async getCourseQuizzes(courseId: string): Promise<Quiz[]> {
    return await this.quizRepository.find({ where: { courseId }, order: { createdAt: 'DESC' } });
  }

  async updateQuiz(id: string, dto: UpdateQuizDto, userId: string): Promise<Quiz> {
    const quiz = await this.getQuizById(id);
    if (quiz.createdBy !== userId) throw new ForbiddenException('Only creator can update');
    Object.assign(quiz, dto);
    return await this.quizRepository.save(quiz);
  }

  async deleteQuiz(id: string, userId: string): Promise<void> {
    const quiz = await this.getQuizById(id);
    if (quiz.createdBy !== userId) throw new ForbiddenException('Only creator can delete');
    await this.quizRepository.remove(quiz);
  }

  async publishQuiz(id: string, userId: string): Promise<Quiz> {
    const quiz = await this.getQuizById(id);
    if (quiz.createdBy !== userId) throw new ForbiddenException('Only creator can publish');
    if (!quiz.questions?.length) throw new BadRequestException('Cannot publish without questions');
    quiz.status = QuizStatus.PUBLISHED;
    return await this.quizRepository.save(quiz);
  }

  async startQuizAttempt(quizId: string, userId: string): Promise<QuizAttempt> {
    const quiz = await this.getQuizById(quizId);
    if (quiz.status !== QuizStatus.PUBLISHED) throw new BadRequestException('Quiz not published');
    
    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) throw new BadRequestException('Not yet available');
    if (quiz.availableUntil && now > quiz.availableUntil) throw new BadRequestException('No longer available');

    const attemptCount = await this.quizAttemptRepository.count({ where: { quizId, userId } });
    if (attemptCount >= quiz.maxAttempts) throw new BadRequestException('Max attempts reached');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + quiz.timeLimit);

    const attempt = this.quizAttemptRepository.create({
      quizId,
      userId,
      attemptNumber: attemptCount + 1,
      startedAt: now,
      expiresAt,
    });
    return await this.quizAttemptRepository.save(attempt);
  }

  async submitQuizAttempt(attemptId: string, dto: SubmitQuizAnswerDto, userId: string): Promise<QuizAttempt> {
    const attempt = await this.quizAttemptRepository.findOne({ 
      where: { id: attemptId }, 
      relations: ['quiz', 'quiz.questions'] 
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
    if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new BadRequestException('Already submitted');
    if (new Date() > attempt.expiresAt) {
      attempt.status = AttemptStatus.EXPIRED;
      await this.quizAttemptRepository.save(attempt);
      throw new BadRequestException('Attempt expired');
    }

    const gradedAnswers = this.gradeAnswers(attempt.quiz.questions, dto.answers);
    const totalPoints = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = Object.values(gradedAnswers).reduce((sum, a) => sum + (a.points || 0), 0);
    const percentageScore = (earnedPoints / totalPoints) * 100;

    attempt.answers = gradedAnswers;
    attempt.score = Number(earnedPoints.toFixed(2));
    attempt.percentageScore = Number(percentageScore.toFixed(2));
    attempt.passed = percentageScore >= attempt.quiz.passingScore;
    attempt.status = AttemptStatus.GRADED;
    attempt.submittedAt = new Date();
    attempt.timeSpent = Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000);
    attempt.isAutoGraded = true;

    return await this.quizAttemptRepository.save(attempt);
  }

  async getAttemptById(id: string): Promise<QuizAttempt> {
    const attempt = await this.quizAttemptRepository.findOne({ 
      where: { id }, 
      relations: ['quiz', 'quiz.questions'] 
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    return attempt;
  }

  async getUserAttempts(quizId: string, userId: string): Promise<QuizAttempt[]> {
    return await this.quizAttemptRepository.find({ 
      where: { quizId, userId }, 
      order: { attemptNumber: 'DESC' } 
    });
  }

  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    return await this.quizAttemptRepository.find({ 
      where: { quizId }, 
      order: { submittedAt: 'DESC' } 
    });
  }

  private gradeAnswers(questions: QuizQuestion[], userAnswers: Record<string, { answer: string | string[] }>): Record<string, any> {
    const gradedAnswers: Record<string, { answer: string | string[] | null; isCorrect: boolean; points: number }> = {};

    for (const question of questions) {
      const userAnswer = userAnswers[question.id];
      if (!userAnswer) {
        gradedAnswers[question.id] = { answer: null, isCorrect: false, points: 0 };
        continue;
      }

      let isCorrect = false;
      if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
        const correctOpt = question.options?.find(o => o.isCorrect);
        isCorrect = correctOpt?.id === userAnswer.answer;
      } else if (question.type === QuestionType.SHORT_ANSWER) {
        const processedAnswer = question.caseSensitive 
          ? (userAnswer.answer as string).trim() 
          : (userAnswer.answer as string).trim().toLowerCase();
        isCorrect = question.correctAnswers?.some(correct => {
          const processedCorrect = question.caseSensitive ? correct : correct.toLowerCase();
          return processedAnswer === processedCorrect;
        }) || false;
      } else if (question.type === QuestionType.CODE) {
        isCorrect = !!(userAnswer.answer as string).trim();
      }

      gradedAnswers[question.id] = {
        answer: userAnswer.answer,
        isCorrect,
        points: isCorrect ? question.points : 0,
      };
    }

    return gradedAnswers;
  }
}