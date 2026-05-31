import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api/errors';

// retrieve quizzes made by a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quizzes = await prisma.quiz.findMany({
      where: { createdBy: id },
    });

    const userName = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    });

    return NextResponse.json({
      success: true,
      quizzes,
      count: quizzes.length,
      creator: userName,
    });
  } catch (error) {
    return handleError(error);
  }
}
