import { WithAuth } from '@/lib/api/auth-protected';
import { APIError, handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @description Returns a quiz and its questions and possible answers.
 * @pathParams { id: string }
 * @response QuizDetailResponseSchema
 * @openapi
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string}>}) {

  try {
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
};

/*
 * Delete a quiz based on its ID.
 */
export const DELETE = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;
    const quiz = await prisma.quiz.findFirst({
      where: { id },
    });

    if (!quiz) {
      throw new APIError('Invalid Quiz ID', 404);
    } else {
      if (quiz.createdBy == user.id) {
        await prisma.quiz.delete({
          where: { id },
        });
      } else {
        throw new APIError('User must be owner of the quiz.', 401);
      }
    }

    return NextResponse.json({ sucess: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
});
