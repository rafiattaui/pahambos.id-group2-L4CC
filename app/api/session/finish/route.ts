import { NextResponse, NextRequest } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import { resolveSession } from '@/lib/quiz-session';
import redis from '@/lib/redis';
import { r_MetricsSchema } from '@/lib/schemas/sessionschemas';
import { prisma } from '@/lib/prisma';
import { SCORE_PER_QUESTION } from '../question/route';

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

    if (session.status !== 'finished') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Session is not finished, only finished sessions can be finalized and submitted.',
        },
        { status: 400 }
      );
    }

    const rawMetrics = await redis.hgetall(`metrics:${session.id}`);
    const metrics = r_MetricsSchema.parse({
      totalCorrect: parseInt(rawMetrics.totalCorrect || '0', 10),
      totalIncorrect: parseInt(rawMetrics.totalIncorrect || '0', 10),
      totalResponseTime: parseInt(rawMetrics.totalResponseTime || '0', 10),
      longestStreak: parseInt(rawMetrics.longestStreak || '0', 10),
      currentStreak: parseInt(rawMetrics.currentStreak || '0', 10),
    });

    console.log(session);

    await prisma.userPerformance.create({
      data: {
        userId: user.id,
        quizId: session.quizId,
        classroomQuizId: session.classroomQuizId,
        finalScore: metrics.totalCorrect * SCORE_PER_QUESTION,
        accuracyRate: metrics.totalCorrect / session.totalQuestions,
        timeTaken: metrics.totalResponseTime,
        completedAt: new Date(),
      },
    });

    const pipe = redis.pipeline();
    pipe.del(`session:${session.id}`);
    pipe.del(`metrics:${session.id}`);
    pipe.del(`player_session:${user.id}`);
    pipe.del(`session:${session.id}:answers`);
    await pipe.exec();

    return NextResponse.json({
      success: true,
      message: 'Session finalized and performance recorded.',
    });
  } catch (error) {
    return handleError(error);
  }
});
