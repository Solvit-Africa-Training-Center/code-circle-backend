// src/tests/services/question-pool.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  QuestionPool,
  PoolType,
  QuestionType,
} from '../entities/question-pool.entity';
import { CategoriesService } from '../../categories/categories.service';
import { ClubsService } from '../../clubs/clubs.service';
import { ConfigService } from '@nestjs/config';

interface GeneratePoolParams {
  poolType: PoolType;
  categoryId?: string;
  clubId?: string;
  difficulty: string;
}

@Injectable()
export class QuestionPoolService {
  private readonly logger = new Logger(QuestionPoolService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;

  constructor(
    @InjectRepository(QuestionPool)
    private readonly questionPoolRepository: Repository<QuestionPool>,
    private readonly categoriesService: CategoriesService,
    private readonly clubsService: ClubsService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in .env file');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1' },
    );
  }

  /**
   * Générer 30 questions et les stocker dans le pool
   */
  async generateQuestionPool(
    params: GeneratePoolParams,
  ): Promise<QuestionPool[]> {
    try {
      this.logger.log(`Generating question pool for ${params.poolType}`);

      // Vérifier si un pool existe déjà
      const existingPool = await this.questionPoolRepository.find({
        where: {
          poolType: params.poolType,
          categoryId: params.categoryId,
          clubId: params.clubId,
        },
      });

      if (existingPool.length > 0) {
        throw new BadRequestException(
          `A question pool already exists. Delete it first or update individual questions.`,
        );
      }

      // Construire le prompt
      const prompt = await this.buildPrompt(params);

      // Appel à Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parser la réponse
      const questions = this.parseGeminiResponse(text);

      // Valider qu'on a bien 30 questions
      if (questions.length !== 30) {
        this.logger.warn(`Expected 30 questions, got ${questions.length}`);
      }

      // Créer les questions dans le pool
      const poolQuestions = questions.map((q) =>
        this.questionPoolRepository.create({
          poolType: params.poolType,
          categoryId: params.categoryId,
          clubId: params.clubId,
          questionType: q.type,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          testCases: q.testCases,
          codeTemplate: q.codeTemplate,
          evaluationCriteria: q.evaluationCriteria,
          points: q.points,
          difficulty: params.difficulty,
          isActive: true,
        }),
      );

      const savedQuestions =
        await this.questionPoolRepository.save(poolQuestions);

      this.logger.log(
        `Generated and saved ${savedQuestions.length} questions to pool`,
      );

      return savedQuestions;
    } catch (error) {
      this.logger.error(
        `Error generating question pool: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Construire le prompt pour Gemini selon le type de compétence
   */
  private async buildPrompt(params: GeneratePoolParams): Promise<string> {
    if (params.poolType === PoolType.CATEGORY) {
      const category = await this.categoriesService.findOne(params.categoryId!);
      return this.buildCategoryPrompt(category, params.difficulty);
    } else {
      const club = await this.clubsService.findOne(params.clubId!);
      const category = await this.categoriesService.findOne(club.categoryId);
      return this.buildClubPrompt(club, category, params.difficulty);
    }
  }

  /**
   * Prompt pour CREATOR TEST (selon le skillType de la catégorie)
   */
  private buildCategoryPrompt(category: any, difficulty: string): string {
    const baseInstruction = this.getBaseInstruction(difficulty);

    // Déterminer la distribution des questions selon le skillType
    const distribution = this.getQuestionDistribution(category.skillType);

    return `${baseInstruction}

CONTEXT: Questions for CREATOR TEST in category "${category.name}"
Description: ${category.description}
Skill Type: ${category.skillType}

QUESTION DISTRIBUTION:
${distribution.description}

TOPICS TO COVER:
1. ${distribution.topic1}
2. Leadership and team management (25%)
3. Community building and communication (15%)

${distribution.examples}

Generate 30 diverse questions in JSON format now:`;
  }

  /**
   * Prompt pour MEMBER TEST (selon le club)
   */
  private buildClubPrompt(
    club: any,
    category: any,
    difficulty: string,
  ): string {
    const baseInstruction = this.getBaseInstruction(difficulty);

    // Déterminer la distribution selon la catégorie du club
    const distribution = this.getQuestionDistribution(category.skillType);

    return `${baseInstruction}

CONTEXT: Questions for MEMBER TEST to join club "${club.name}"
Category: ${category.name}
Skill Type: ${category.skillType}
Club Description: ${club.description || 'A club focused on ' + category.name}

QUESTION DISTRIBUTION:
${distribution.description}

TOPICS TO COVER:
1. ${distribution.topic1}
2. Understanding of club's goals and values (15%)
3. Motivation and engagement (5%)

${distribution.examples}

The questions should be specifically tailored to: ${club.description || category.name}

Generate 30 diverse questions in JSON format now:`;
  }

  /**
   * Obtenir la distribution des questions selon le type de compétence
   */
  private getQuestionDistribution(skillType: string): {
    description: string;
    topic1: string;
    examples: string;
  } {
    switch (skillType) {
      case 'PROGRAMMING':
        return {
          description: `- 40% MULTIPLE_CHOICE (12 questions)
- 30% CODE_ANALYSIS (9 questions)
- 20% CODE_CHALLENGE (6 questions)
- 10% OPEN_ENDED (3 questions)`,
          topic1: 'Technical programming skills (60%)',
          examples: `EXAMPLES OF EXPECTED QUESTIONS:
- Multiple choice on programming concepts, algorithms, data structures
- Code analysis: "What does this code return?"
- Code challenge: "Write a function that..."
- Open-ended: "How would you motivate inactive members?"
- Open-ended: "Describe your strategy to grow a technical community"
- Leadership: "What's your approach to conflict resolution?"`,
        };

      case 'DESIGN':
        return {
          description: `- 60% MULTIPLE_CHOICE (18 questions)
- 0% CODE_ANALYSIS (0 questions)
- 0% CODE_CHALLENGE (0 questions)
- 40% OPEN_ENDED (12 questions)`,
          topic1: 'Design principles and best practices (60%)',
          examples: `EXAMPLES OF EXPECTED QUESTIONS:
- Multiple choice on design principles, color theory, typography, user research
- Multiple choice: "What is the best accessibility contrast ratio?"
- Multiple choice: "Which design pattern is best for mobile navigation?"
- Open-ended: "Describe your design process for a new feature"
- Open-ended: "How do you conduct user research?"
- Open-ended: "Explain your approach to creating a design system"
- Open-ended: "How would you improve the UX of [scenario]?"
- Leadership: "How do you handle feedback on your designs?"

IMPORTANT: Do NOT include any code-related questions (CODE_ANALYSIS, CODE_CHALLENGE). Focus on design theory, principles, processes, and case studies.`,
        };

      case 'BUSINESS':
        return {
          description: `- 50% MULTIPLE_CHOICE (15 questions)
- 0% CODE_ANALYSIS (0 questions)
- 0% CODE_CHALLENGE (0 questions)
- 50% OPEN_ENDED (15 questions)`,
          topic1: 'Business strategy and product management (60%)',
          examples: `EXAMPLES OF EXPECTED QUESTIONS:
- Multiple choice on product management frameworks, metrics, business strategy
- Multiple choice: "What is the difference between OKRs and KPIs?"
- Multiple choice: "Which pricing strategy is best for SaaS?"
- Open-ended: "How would you prioritize features in a roadmap?"
- Open-ended: "Describe your approach to market research"
- Open-ended: "How do you measure product success?"
- Open-ended: "Explain how you would launch a new product"
- Leadership: "How do you align stakeholders with different priorities?"

IMPORTANT: Do NOT include any code-related questions. Focus on business strategy, product thinking, market analysis, and leadership.`,
        };

      case 'MIXED':
        return {
          description: `- 50% MULTIPLE_CHOICE (15 questions)
- 20% CODE_ANALYSIS (6 questions)
- 10% CODE_CHALLENGE (3 questions)
- 20% OPEN_ENDED (6 questions)`,
          topic1: 'Technical and theoretical knowledge (60%)',
          examples: `EXAMPLES OF EXPECTED QUESTIONS:
- Multiple choice on both technical concepts and theoretical knowledge
- Code analysis: Only if relevant to the domain (e.g., DevOps scripts, Data Science code)
- Code challenge: Simple technical tasks when applicable
- Open-ended: Mix of technical explanations and strategic thinking
- Open-ended: "Explain your CI/CD pipeline design" (DevOps)
- Open-ended: "How do you choose the right ML model?" (Data Science)
- Leadership: "How do you balance technical debt with feature development?"`,
        };

      default:
        // Par défaut, traiter comme PROGRAMMING
        return this.getQuestionDistribution('PROGRAMMING');
    }
  }

  /**
   * Instruction de base (commune à tous les types)
   */
  private getBaseInstruction(difficulty: string): string {
    return `
You are an expert at creating technical questions for a developer community platform.

STRICT RULES:
1. Respond ONLY with valid JSON, no markdown, no preamble
2. Generate EXACTLY 30 questions
3. Follow the QUESTION DISTRIBUTION specified below
4. Difficulty: ${difficulty}
5. Points: 10 per question
6. All questions must be in ENGLISH

EXPECTED JSON FORMAT:
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "points": 10
    },
    {
      "type": "CODE_ANALYSIS",
      "question": "What does this code return?\\n\`\`\`python\\ndef func():\\n    return x\\n\`\`\`",
      "options": ["Result A", "Result B", "Result C", "Result D"],
      "correctAnswer": "Result A",
      "points": 10
    },
    {
      "type": "CODE_CHALLENGE",
      "question": "Write a function that...",
      "codeTemplate": "def function_name(param):\\n    pass",
      "testCases": [
        {"input": "5", "expectedOutput": "25", "description": "Square of 5"}
      ],
      "points": 10
    },
    {
      "type": "OPEN_ENDED",
      "question": "Explain how you would...",
      "evaluationCriteria": {
        "keywords": ["keyword1", "keyword2"],
        "minLength": 50,
        "rubric": "The answer should mention..."
      },
      "points": 10
    }
  ]
}`;
  }
  /**
   * Parser la réponse de Gemini
   */
  private parseGeminiResponse(text: string): Array<{
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer?: string;
    testCases?: Array<{
      input: string;
      expectedOutput: string;
      description?: string;
    }>;
    codeTemplate?: string;
    evaluationCriteria?: {
      keywords?: string[];
      minLength?: number;
      maxLength?: number;
      rubric?: string;
    };
    points: number;
  }> {
    try {
      let cleanedText = text.trim();
      cleanedText = cleanedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');

      const parsed = JSON.parse(cleanedText);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response format');
      }

      return parsed.questions;
    } catch (error) {
      this.logger.error(`Failed to parse Gemini response: ${text}`);
      throw new BadRequestException('AI returned invalid format');
    }
  }

  /**
   * Sélectionner 10 questions aléatoires du pool
   */
  async selectRandomQuestions(
    poolType: PoolType,
    categoryId?: string,
    clubId?: string,
  ): Promise<QuestionPool[]> {
    try {
      const queryBuilder = this.questionPoolRepository
        .createQueryBuilder('question')
        .where('question.poolType = :poolType', { poolType })
        .andWhere('question.isActive = :isActive', { isActive: true });

      if (poolType === PoolType.CATEGORY && categoryId) {
        queryBuilder.andWhere('question.categoryId = :categoryId', {
          categoryId,
        });
      } else if (poolType === PoolType.CLUB && clubId) {
        queryBuilder.andWhere('question.clubId = :clubId', { clubId });
      }

      const allQuestions = await queryBuilder.getMany();

      if (allQuestions.length < 10) {
        throw new BadRequestException(
          `Not enough questions in pool. Found ${allQuestions.length}, need at least 10`,
        );
      }

      // Sélection aléatoire de 10 questions
      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);

      this.logger.log(
        `Selected 10 random questions from pool of ${allQuestions.length}`,
      );

      return selected;
    } catch (error) {
      this.logger.error(
        `Error selecting random questions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtenir toutes les questions d'un pool
   */
  async getPoolQuestions(
    poolType: PoolType,
    categoryId?: string,
    clubId?: string,
  ): Promise<QuestionPool[]> {
    const where: any = { poolType, isActive: true };

    if (categoryId) where.categoryId = categoryId;
    if (clubId) where.clubId = clubId;

    return await this.questionPoolRepository.find({ where });
  }

  /**
   * Supprimer un pool de questions
   */
  async deletePool(
    poolType: PoolType,
    categoryId?: string,
    clubId?: string,
  ): Promise<void> {
    const where: any = { poolType };

    if (categoryId) where.categoryId = categoryId;
    if (clubId) where.clubId = clubId;

    await this.questionPoolRepository.delete(where);

    this.logger.log(`Deleted question pool for ${poolType}`);
  }
}
