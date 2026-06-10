import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';

export async function rebuildLeaderboard(quizId: string) {
  const topPerformances = await prisma.userPerformance.findMany({
    where: { quizId },
    orderBy: [
      { finalScore: 'desc' },
      { hintsUsed: 'asc' },
      { timeTaken: 'asc' },
    ],
    include: {
      user: { select: { name: true } },
    },
    take: 10,
  });

  const key = `leaderboard:${quizId}`;
  const pipe = redis.pipeline();
  pipe.del(key);
  for (const perf of topPerformances) {
    pipe.zadd(key, perf.finalScore, perf.userId);
  }
  pipe.expire(key, 60 * 60);
  await pipe.exec();
}

export async function getLeaderboard(quizId: string) {
  const members = await redis.zrevrange(
    `leaderboard:${quizId}`,
    0,
    9,
    'WITHSCORES'
  );

  const leaderboard = [];
  for (let i = 0; i < members.length; i += 2) {
    leaderboard.push({
      rank: i / 2 + 1,
      userId: members[i],
      finalScore: parseFloat(members[i + 1]),
    });
  }
  return leaderboard;
}
