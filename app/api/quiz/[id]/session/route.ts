import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { r_SessionSchema, r_MetricsSchema } from '@/lib/schemas/sessionschemas';

export const POST = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;

    // check for an active session (Crucial check)
    if (await redis.exists(`player_session:${user.id}`)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Session already exists. Please join the existing session or delete the current one.',
        },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz not found.',
        },
        { status: 404 }
      );
    }

    // fetch questions before opening the pipeline block
    const questionCount = await prisma.quizQuestion.count({
      where: { quizId: id },
    });

    if (questionCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz has no questions.',
        },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();
    const SESSION_TTL = 60 * 60 * 2; // 2 hours session window

    const pipe = redis.pipeline();

    // map player to their current active session
    pipe.set(`player_session:${user.id}`, sessionId, 'EX', SESSION_TTL);

    // store core metadata
    const session = r_SessionSchema.parse({
      quizId: id,
      userId: user.id,
      status: 'waiting',
      totalQuestions: questionCount,
      questionStartTime: null,
    });

    // flattening object into string-only records for hset safety
    pipe.hset(`session:${sessionId}`, session);
    pipe.expire(`session:${sessionId}`, SESSION_TTL);

    // store metrics blob safely as a Redis String (since it's a unified JSON string)
    const metrics = r_MetricsSchema.parse({});
    pipe.set(
      `metrics:${sessionId}`,
      JSON.stringify(metrics),
      'EX',
      SESSION_TTL
    );

    await pipe.exec();

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Quiz initialization error:', error);
    return handleError(error);
  }
});
