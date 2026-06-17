import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// retrieve quiz aggregate metrics for a quiz
export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json({
        success: false,
        message: 'Quiz not found.',
      });
    }

    // check if user is creator of quiz
    if (quiz.createdBy !== user.id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to view quiz performance.',
      });
    }

    // retrieve aggregate metrics for quiz
    const metrics = await prisma.quizMetrics.findUnique({
      where: { quizId: id },
      include: {
        quiz: {
          select: {
            title: true,
            description: true,
            numQuestions: true,
            createdAt: true,
          },
        },
      },
    });

    if (!metrics) {
      return NextResponse.json({
        success: false,
        message: 'No performance metrics found for this quiz.',
      });
    }

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return handleError(error);
  }
});
