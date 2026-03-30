import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { PublicQuestionSchema } from '@/lib/schemas/quizschemas';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @description Retrieve a question and its possible answers.
 * @params IDSchema
 * @response 200:PublicQuestionSchema
 * @add 404:APIErrorSchema
 * @tag QuizQuestion
 * @openapi
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.quizQuestion.findFirst({
      where: { id },
    });

    const res = PublicQuestionSchema.parse(question);
    return NextResponse.json(
      {
        success: true,
        ...res,
      },
      { status: 200 }
    );
  } catch (err) {
    return handleError(err);
  }
}
