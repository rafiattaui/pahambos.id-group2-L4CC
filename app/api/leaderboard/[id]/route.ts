import { WithAuth } from '@/lib/api/auth-protected';
import { handleError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';
import { getLeaderboard } from '@/lib/leaderboard';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const leaderboard = await getLeaderboard(id);

    const userIds = leaderboard.map((entry) => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const result = leaderboard.map((entry) => ({
      rank: entry.rank,
      userId: entry.userId,
      userName: userMap.get(entry.userId) || 'Unknown',
      finalScore: entry.finalScore,
    }));

    return new NextResponse(JSON.stringify({ success: true, data: result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleError(error);
  }
}
