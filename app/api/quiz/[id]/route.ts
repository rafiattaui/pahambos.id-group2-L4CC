import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
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
