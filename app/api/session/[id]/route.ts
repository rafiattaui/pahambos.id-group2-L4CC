import { WithAuth } from '@/lib/api/auth-protected';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api/errors';
import redis from '@/lib/redis';
import { r_SessionSchema, r_MetricsSchema } from '@/lib/schemas/sessionschemas';
import { NextResponse } from 'next/server';

// post route specifically for starting sessions tied to
// a classroom quiz
export const POST = WithAuth(async (req, { user, params }) => {
  try {
    const { classroomQuizId } = await params;

    if (!classroomQuizId) {
      return NextResponse.json(
        { error: 'Missing classroomQuizId' },
        { status: 400 }
      );
    }

    // check if the classroom quiz exists
    const classroomQuiz = await prisma.classroomQuiz.findUnique({
      where: { id: classroomQuizId },
      include: { Quiz: true, Classroom: true },
    });

    if (!classroomQuiz) {
      return NextResponse.json(
        { error: 'Classroom quiz not found' },
        { status: 404 }
      );
    }
    // check if user is part of the classroom
    const isUserInClassroom = await prisma.userClassroom.findFirst({
      where: {
        classroomId: classroomQuiz.classroomId,
        userId: user.id,
      },
    });

    if (!isUserInClassroom) {
      return new Response(
        JSON.stringify({ error: 'User is not part of the classroom' }),
        { status: 403 }
      );
    }

    // session creation logic
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

    // no need to check if quiz exists since classroomQuiz has a relation to Quiz and will throw if it doesn't exist
    const questionCount = await prisma.quizQuestion.count({
      where: { quizId: classroomQuiz.quizId },
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
      quizId: classroomQuiz.quizId,
      userId: user.id,
      status: 'waiting',
      totalQuestions: questionCount,
      questionStartTime: null,
      classroomQuizId: classroomQuizId,
    });

    // flattening object into string-only records for hset safety
    pipe.hset(`session:${sessionId}`, session);
    pipe.expire(`session:${sessionId}`, SESSION_TTL);

    // store metrics blob safely as a Redis String (since it's a unified JSON string)
    const metrics = r_MetricsSchema.parse({});
    pipe.hset(`metrics:${sessionId}`, metrics);
    pipe.expire(`metrics:${sessionId}`, SESSION_TTL);

    await pipe.exec();

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    return handleError(error);
  }
});
