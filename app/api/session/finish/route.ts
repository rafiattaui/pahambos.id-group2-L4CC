import { NextResponse, NextRequest } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import { resolveSession } from '@/lib/quiz-session';
import redis from '@/lib/redis';
import { r_MetricsSchema } from '@/lib/schemas/sessionschemas';
import { prisma } from '@/lib/prisma';
import { SCORE_PER_QUESTION } from '../question/route';
import { model } from '@/lib/groq';
import { generateText, Output } from 'ai';
import { type GroqLanguageModelOptions } from '@ai-sdk/groq';
import { z } from 'zod';
import { generateFeedback } from '@/lib/session/ai';

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
      hintsUsed: parseInt(rawMetrics.hintsUsed || '0', 10),
    });

    await prisma.userPerformance.create({
      data: {
        userId: user.id,
        quizId: session.quizId,
        finalScore: metrics.totalCorrect * SCORE_PER_QUESTION,
        accuracyRate: metrics.totalCorrect / session.totalQuestions,
        timeTaken: metrics.totalResponseTime,
        completedAt: new Date(),
        hintsUsed: metrics.hintsUsed,
      },
    });

    const pipe = redis.pipeline();
    pipe.del(`session:${session.id}`);
    pipe.del(`metrics:${session.id}`);
    pipe.del(`player_session:${user.id}`);
    pipe.del(`hint-rl:user:${user.id}`); // clear all hint rate limit keys for this quiz
    // pipe.del(`session:${session.id}:answers`); don't delete this yet
    // we need to generate feedback from ai so we need the answers for that.
    await pipe.exec();

    // ai feedback logic
    // const feedback = await generateFeedback(session, session.id);

    return NextResponse.json({
      success: true,
      message: 'Session finalized and performance recorded.',
    });
  } catch (error) {
    return handleError(error);
  }
});
