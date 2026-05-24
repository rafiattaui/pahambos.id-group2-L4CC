import { NextResponse } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import redis from '@/lib/redis';
import { resolveSession } from '@/lib/quiz-session';
import { prisma } from '@/lib/prisma';
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

    if (session.status === 'finished') {
      return NextResponse.json(
        { success: false, message: 'Session has already finished.' },
        { status: 400 }
      );
    }

    if (session.status === 'waiting') {
      const questionStartTime = new Date().toISOString();

      const pipe = redis.pipeline();
      pipe.hset(`session:${session.id}`, 'status', 'active');
      pipe.hset(
        `session:${session.id}`,
        'questionStartTime',
        questionStartTime
      );
      await pipe.exec();

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

      const { correctAnswers, ...question } = questionData;

      return NextResponse.json({
        success: true,
        question,
        questionStartTime,
      });
    }

    // status === 'active'
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

    const { correctAnswers, ...question } = questionData;

    return NextResponse.json({
      success: true,
      question,
      questionStartTime: session.questionStartTime,
    });
  } catch (error) {
    return handleError(error);
  }
});
