import { NextResponse, NextRequest } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import { resolveSession } from '@/lib/quiz-session';
import { GetQuestionWithCache } from '@/lib/read-with-cache';

export const GET = WithAuth(async (req, { user }) => {
  try {
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found for the user.' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Session is not active.' },
        { status: 400 }
      );
    }

    const questionData = await GetQuestionWithCache(
      session.quizId,
      session.currentQuestionIndex
    );

    if (!questionData) {
      return NextResponse.json(
        { success: false, message: 'Question not found.' },
        { status: 404 }
      );
    }
    const startTime = Number(session.questionStartTime) || Date.now();

    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    if (timeElapsed >= questionData.time) {
      return NextResponse.json(
        { success: false, message: 'Time for answering has expired.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      timeLeft: questionData.time - timeElapsed,
    });
  } catch (error) {
    return handleError(error);
  }
});
