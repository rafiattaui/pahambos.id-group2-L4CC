import { handleError } from '@/lib/api/errors';
import { WithAuth } from '@/lib/api/auth-protected';
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export const POST = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;

    // check if an already existing session exists for the player.
    if (await redis.exists(`player_session:${id}`)) {
      return NextResponse.json({
        success: 'false',
        message: `Session already exists, 
                please join the existing session or delete the current one.`,
      });
    }

    const quiz = prisma.quiz.findUnique({
      where: { id },
    });

    return NextResponse.json({ success: 'true' });
  } catch (error) {
    console.log(error);
    return handleError(error);
  }
});
