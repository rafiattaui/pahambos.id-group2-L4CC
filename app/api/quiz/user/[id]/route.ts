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

    if (quizzes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No quizzes found for this user.',
        },
        { status: 404 }
      );
    }

    const userName = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!userName) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quizzes,
      count: quizzes.length,
      creator: userName.name,
    });
  } catch (error) {
    return handleError(error);
  }
}
