import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';

//
export const GET = WithAuth(async (req, { user }) => {
  try {
    const records = await prisma.userPerformance.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
    });

    if (records.length === 0) {
      return new Response(JSON.stringify({ success: true, data: null }), {
        status: 200,
      });
    }

    const totalQuizzes = records.length;
    const finalScore = Math.max(...records.map((r) => r.finalScore));
    const avgAccuracy = (
      records.reduce((sum, r) => sum + Number(r.accuracyRate), 0) / totalQuizzes
    ).toFixed(1);
    const longestStreak = Math.max(...records.map((r) => r.longestStreak));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalQuizzes,
          finalScore,
          accuracyRate: avgAccuracy,
          longestStreak,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
});
