// src/tests/services/question-generator.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TestType, TestDifficulty } from '../enums/test-type.enum';
import { QuestionType } from '../entities/test-question.entity';

interface GenerateQuestionsParams {
  testType: TestType;
  categoryName: string;
  difficulty: TestDifficulty;
  clubName?: string; // Pour MEMBER_TEST
  clubDescription?: string; // Pour MEMBER_TEST
}

interface GeneratedQuestion {
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
}

@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(QuestionGeneratorService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Plus économique
  }

  /**
   * Point d'entrée principal
   */
  async generateQuestions(
    params: GenerateQuestionsParams,
  ): Promise<GeneratedQuestion[]> {
    try {
      this.logger.log(
        `Generating questions for ${params.testType} - ${params.categoryName}`,
      );

      const prompt = this.buildPrompt(params);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parser la réponse JSON
      const questions = this.parseGeminiResponse(text);

      this.logger.log(`Generated ${questions.length} questions successfully`);

      return questions;
    } catch (error) {
      this.logger.error(
        `Error generating questions: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to generate questions with AI');
    }
  }

  /**
   * Construire le prompt selon le type de test
   */
  private buildPrompt(params: GenerateQuestionsParams): string {
    const baseInstruction = `
Tu es un expert en création de questions techniques pour une plateforme de clubs de développeurs.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans préambule
2. Génère EXACTEMENT ${this.getQuestionCount(params.testType)} questions
3. Répartition des types de questions :
   - 50% MULTIPLE_CHOICE (QCM)
   - 20% CODE_ANALYSIS (analyser du code donné)
   - 20% CODE_CHALLENGE (écrire du code)
   - 10% OPEN_ENDED (question ouverte)
4. Difficulté : ${params.difficulty}
5. Points : 10 par question

FORMAT JSON ATTENDU :
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "points": 10
    },
    {
      "type": "CODE_ANALYSIS",
      "question": "Que retourne ce code ?\\n\`\`\`python\\ncode here\\n\`\`\`",
      "options": ["Result A", "Result B", "Result C", "Result D"],
      "correctAnswer": "Result A",
      "points": 10
    },
    {
      "type": "CODE_CHALLENGE",
      "question": "Écris une fonction qui...",
      "codeTemplate": "def function_name():\\n    pass",
      "testCases": [
        {"input": "5", "expectedOutput": "25", "description": "Square of 5"}
      ],
      "points": 10
    },
    {
      "type": "OPEN_ENDED",
      "question": "Explique comment tu gérerais...",
      "evaluationCriteria": {
        "keywords": ["mot1", "mot2"],
        "minLength": 50,
        "rubric": "La réponse doit mentionner..."
      },
      "points": 10
    }
  ]
}`;

    if (params.testType === TestType.CREATOR_TEST) {
      return `${baseInstruction}

CONTEXTE : Test pour devenir CRÉATEUR de club dans la catégorie "${params.categoryName}"

THÈMES À COUVRIR :
1. Compétences techniques en ${params.categoryName} (70%)
2. Leadership et gestion d'équipe (20%)
3. Communication et animation de communauté (10%)

EXEMPLES DE QUESTIONS ATTENDUES :
- QCM sur concepts clés de ${params.categoryName}
- Analyse de code lié à ${params.categoryName}
- Challenge : "Écris une fonction qui résout X"
- Question ouverte : "Comment motiver des membres inactifs ?"

Génère maintenant les questions en JSON :`;
    } else {
      return `${baseInstruction}

CONTEXTE : Test pour rejoindre le club "${params.clubName}"
Description du club : ${params.clubDescription || 'Club sur ' + params.categoryName}

THÈMES À COUVRIR :
1. Compétences spécifiques au sujet du club (90%)
2. Motivation et engagement (10%)

EXEMPLES DE QUESTIONS ATTENDUES :
- QCM sur les concepts du club
- Analyse de code pertinent pour le club
- Challenge de programmation lié au sujet du club
- Question ouverte sur la motivation

Génère maintenant les questions en JSON :`;
    }
  }

  /**
   * Parser la réponse de Gemini
   */
  private parseGeminiResponse(text: string): GeneratedQuestion[] {
    try {
      // Nettoyer les markdown fences si présents
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
   * Nombre de questions selon le type de test
   */
  private getQuestionCount(testType: TestType): number {
    return testType === TestType.CREATOR_TEST ? 15 : 10;
  }
}
