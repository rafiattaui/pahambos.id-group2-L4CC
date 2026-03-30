import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { CreateQuestionListSchema } from '@/lib/schemas/quizschemas';
import { APIError } from '@/lib/api/errors';
import { NextResponse } from 'next/server';
import { WithAuth } from '@/lib/api/auth-protected';

/**
 * @description Add a new question an already existing quiz.
 * @body CreateQuestionListSchema
 * @response 200
 * @add 404:APIErrorSchema
 * @tag QuizQuestion
 * @openapi
 */
export const POST = WithAuth(async (req, { user }) => {
  try {
    const rawData = await req.json();
    const data = CreateQuestionListSchema.parse(rawData);

    const exists = prisma.quiz.findFirst({
      where: { id: data.quizId },
    });

    if (!exists) {
      throw new APIError('Failed to retrieve valid quiz of that ID', 404);
    }

    const res = await prisma.quizQuestion.createMany({
      data: data.questions.map((question) => ({
        ...question,
        quizId: data.quizId,
      })),
    });

    const update = await prisma.quiz.update({
      where: { id: data.quizId },
      data: {
        numQuestions: {
          increment: data.questions.length,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleError(err);
  }
});
