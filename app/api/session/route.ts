import { NextResponse, NextRequest } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import redis from '@/lib/redis';
import { r_SessionSchema } from '@/lib/schemas/sessionschemas';
import { resolveSession } from '@/lib/quiz-session';

export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found for user.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session,
    });
  } catch (error) {
    return handleError(error);
  }
});

export const DELETE = WithAuth(async (req, { user, params }) => {
  try {
    const session = await resolveSession(user.id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found for user.' },
        { status: 404 }
      );
    }

    const pipe = redis.pipeline();
    pipe.del(`player_session:${user.id}`);
    pipe.del(`metrics:${session.id}`);
    pipe.del(`session:${session.id}`);
    pipe.del(`session:${session.id}:answers`);
    pipe.del(`hint-rl:user:${user.id}`); // clear all hint rate limit keys for this quiz
    await pipe.exec();
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully.',
    });
  } catch (error) {
    return handleError(error);
  }
});
