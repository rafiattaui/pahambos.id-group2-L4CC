import { NextResponse, NextRequest } from 'next/server';
import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import redis from '@/lib/redis';

export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const sessionId = await redis.get(`player_session:${user.id}`); // check for an active session

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'No active session found for user.' },
        { status: 404 }
      );
    }

    const sessionData = await redis.hgetall(`session:${sessionId}`);

    if (!sessionData) {
      return NextResponse.json(
        { success: false, message: 'Session data not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId,
      sessionData,
    });
  } catch (error) {
    return handleError(error);
  }
});

export const DELETE = WithAuth(async (req, { user, params }) => {
  try {
    const sessionId = await redis.get(`player_session:${user.id}`); // check for an active session

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'No active session found for user.' },
        { status: 404 }
      );
    }

    const pipe = redis.pipeline();
    pipe.del(`player_session:${user.id}`);
    pipe.del(`metrics:${sessionId}`);
    pipe.del(`session:${sessionId}`);
    pipe.del(`session:${sessionId}:answers`);
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
