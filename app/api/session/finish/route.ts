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
import { rebuildLeaderboard } from '@/lib/leaderboard';

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

    console.log(session);

    await prisma.userPerformance.create({
      data: {
        userId: user.id,
        quizId: session.quizId,
        classroomQuizId: session.classroomQuizId,
        finalScore: session.score,
        accuracyRate: metrics.totalCorrect / session.totalQuestions,
        timeTaken: metrics.totalResponseTime,
        completedAt: new Date(),
        hintsUsed: metrics.hintsUsed,
        longestStreak: metrics.longestStreak,
      },
    });

    const uniqueUsers = await prisma.userPerformance.findMany({
      where: { quizId: session.quizId },
      distinct: ['userId'],
      select: { userId: true },
    });

    const perfAgg = await prisma.userPerformance.aggregate({
      where: { quizId: session.quizId },
      _avg: { accuracyRate: true, finalScore: true, timeTaken: true },
      _count: { _all: true },
    });

    await prisma.quizMetrics.upsert({
      where: { quizId: session.quizId },
      create: {
        quizId: session.quizId,
        attempts: 1,
        uniqueUsers: 1,
        avgAccuracy: metrics.totalCorrect / session.totalQuestions,
        avgScore: session.score,
        avgTimeTaken: metrics.totalResponseTime,
      },
      update: {
        attempts: { increment: 1 },
        uniqueUsers: uniqueUsers.length,
        avgAccuracy: perfAgg._avg.accuracyRate ?? 0,
        avgScore: perfAgg._avg.finalScore ?? 0,
        avgTimeTaken: Math.round(perfAgg._avg.timeTaken ?? 0),
      },
    });

    // right now, leaderboards are being rebuilt
    // for every session submission which is not efficient,
    // but because we take into account hintsUsed and timeTaken as tiebreakers,
    // we need to recalculate the entire leaderboard every time to ensure correct rankings.
    await rebuildLeaderboard(session.quizId);

    const pipe = redis.pipeline();
    pipe.del(`session:${session.id}`);
    pipe.del(`metrics:${session.id}`);
    pipe.del(`player_session:${user.id}`);
    pipe.del(`hint-rl:user:${user.id}`); // clear all hint rate limit keys for this quiz
    // pipe.del(`session:${session.id}:answers`); don't delete this yet
    // we need to generate feedback from ai so we need the answers for that.
    await pipe.exec();

    // ai feedback logic
    let feedback: string | null = null;

    try {
      feedback = await generateFeedback(session, session.id);
      // console.log('Feedback generated successfully:', feedback);
    } catch (error) {
      console.error('Feedback generation failed:', error);
    }

    if (!feedback) {
      console.warn('No feedback generated for session:', session.id);
      feedback =
        'Great effort! Keep practicing to improve your score and accuracy.';
    }

    pipe.del(`session:${session.id}:answers`); // now we can delete the answers after generating feedback
    await pipe.exec();

    return NextResponse.json({
      success: true,
      message: 'Session finalized and performance recorded.',
      data: { feedback },
    });
  } catch (error) {
    return handleError(error);
  }
});
