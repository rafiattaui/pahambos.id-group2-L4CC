import { NextResponse, NextRequest } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import { resolveSession } from '@/lib/quiz-session';
import redis from '@/lib/redis';

export const POST = WithAuth(async (req, { user, params }) => {
  try {
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active session found for user.',
        },
        { status: 404 }
      );
    }

    if (session.status !== 'waiting') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Session is already actively answering for a question, or has finished.',
        },
        { status: 404 }
      );
    }

    const hasAnswered = await redis.lindex(
      `session:${session.id}:answers`,
      session.currentQuestionIndex
    );

    if (!hasAnswered) {
      return NextResponse.json(
        {
          success: false,
          message: 'You have not answered the current question.',
        },
        { status: 400 }
      );
    }

    const isLastQuestion =
      session.currentQuestionIndex >= session.totalQuestions - 1;

    if (isLastQuestion) {
      await redis.hset(`session:${session.id}`, 'status', 'finished');
    }

    const pipe = redis.pipeline();

    pipe.hincrby(`session:${session.id}`, 'currentQuestionIndex', 1);

    await pipe.exec();

    return NextResponse.json({
      success: true,
      newStatus: isLastQuestion ? 'finished' : 'active',
    });
  } catch (error) {
    return handleError(error);
  }
});
