import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// id is quizId
// retrieve all performance records
// for this user for this quiz
export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;

    const records = await prisma.userPerformance.findMany({
      where: {
        userId: user.id,
        quizId: id,
      },
      orderBy: { completedAt: 'desc' },
    });

    if (records.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: null,
          message: 'No performance records found for this quiz.',
        }),
        {
          status: 200,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    return handleError(error);
  }
});
