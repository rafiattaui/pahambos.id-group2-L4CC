import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { CreateQuizAndQuestionsSchema } from '@/lib/schemas/quizschemas';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseQueryParams,
  QuizListQuerySchema,
} from '@/lib/schemas/queryparams';

export const POST = WithAuth(async (req, { user }) => {
  try {
    const rawData = await req.json();
    const data = CreateQuizAndQuestionsSchema.parse(rawData);

    const numQuestions = data.questions.length;

    // use transaction to prevent zombie transaction where one transaction succeeds and the other fails.
    const result = await prisma.$transaction(async (tx: any) => {
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

/**
 * @description Returns a list of quizzes
 * @pathParams QuizListQuerySchema
 * @response QuizListResponseSchema
 * @openapi
 */
export async function GET(req: NextRequest) {
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
};
