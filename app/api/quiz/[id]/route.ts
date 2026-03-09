import { WithAuth } from '@/lib/api/auth-protected';
import { APIError, handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/*
 * Retrieve a quiz and its contents via its UUID.
 */
export const GET = WithAuth(async (req, { user, params }) => {
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
});

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
