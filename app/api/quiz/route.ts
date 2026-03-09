import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { CreateQuizAndQuestionsSchema } from '@/lib/schemas/quizschemas';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseQueryParams,
  QuizListQuerySchema,
} from '@/lib/schemas/queryparams';

/**
 * @swagger
 * /api/quiz:
 * post:
 * summary: Create a new quiz with questions
 * description: Validates and creates a quiz along with at least 4 associated questions within a database transaction.
 * tags:
 * - Quizzes
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - quiz
 * - questions
 * properties:
 * quiz:
 * type: object
 * required: [title, description, category]
 * properties:
 * title:
 * type: string
 * minLength: 5
 * description:
 * type: string
 * category:
 * type: string
 * enum: [Mathematics, Science, History, Language, Geography, Technology, General]
 * questions:
 * type: array
 * minItems: 4
 * items:
 * type: object
 * required: [order, question, answers, correctAnswer]
 * properties:
 * order:
 * type: integer
 * minimum: 0
 * question:
 * type: string
 * minLength: 5
 * maxLength: 100
 * answers:
 * type: array
 * minItems: 2
 * items:
 * type: string
 * minLength: 2
 * correctAnswer:
 * type: integer
 * minimum: 0
 * responses:
 * 200:
 * description: Quiz created successfully
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * success:
 * type: boolean
 * example: true
 * quizId:
 * type: string
 * format: uuid
 * 400:
 * description: Validation error (Zod)
 * 401:
 * description: Unauthorized - Valid JWT required
 * 500:
 * description: Internal server error
 */
export const POST = WithAuth(async (req, { user }) => {
  try {
    const rawData = await req.json();
    const data = CreateQuizAndQuestionsSchema.parse(rawData);

    const numQuestions = data.questions.length;

    // use transaction to prevent zombie transaction where one transaction succeeds and the other fails.
    const result = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          ...data.quiz,
          numQuestions,
          creator: { connect: { id: user.id } },
        },
      });

      const questions = await tx.quizQuestion.createMany({
        data: data.questions.map((element) => ({
          quizId: quiz.id,
          order: element.order,
          question: element.question,
          answers: element.answers,
          correctAnswer: element.correctAnswer,
        })),
      });

      return { quiz, questions };
    });

    return NextResponse.json(
      { success: true, quizId: result.quiz.id },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
});

/*
 * Protected Route,
 * Route for retrieving a list of quiz
 */
export const GET = WithAuth(async (req) => {
  try {
    const { limit, cursor, sortBy, tags } = parseQueryParams(
      req.nextUrl.searchParams,
      QuizListQuerySchema
    );

    const quizList = await prisma.quiz.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        id: sortBy,
      },
      where: {
        category: { in: tags },
      },
    });

    let nextCursor: typeof cursor | null = null;

    if (quizList.length > limit) {
      const nextQuiz = quizList.pop();
      nextCursor = nextQuiz!.id;
    }

    return NextResponse.json({ data: quizList, nextCursor }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
});
