import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';

export const GET = WithAuth(async (req, { user }) => {
  try {
    // only grab ones within one month,
    // if its 12 may, grab ones starting 1 may

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const agg = await prisma.userPerformance.aggregate({
      where: { userId: user.id, completedAt: { gte: startOfMonth } },
      _max: { finalScore: true, longestStreak: true },
      _avg: { accuracyRate: true },
      _count: { _all: true },
    });

    if (agg._count._all === 0) {
      return new Response(JSON.stringify({ success: true, data: null }), {
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalQuizzes: agg._count._all,
          finalScore: agg._max.finalScore ?? 0,
          accuracyRate: Number(agg._avg.accuracyRate ?? 0).toFixed(1),
          longestStreak: agg._max.longestStreak ?? 0,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
});
