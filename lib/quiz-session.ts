import redis from '@/lib/redis';
import { r_SessionSchema } from '@/lib/schemas/sessionschemas';

export async function resolveSession(userId: string) {
  const sessionId = await redis.get(`player_session:${userId}`);

  if (!sessionId) {
    return null; // No active session for the user
  }

  const redisData = await redis.hgetall(`session:${sessionId}`);
  const sessionData = r_SessionSchema.parse({
    quizId: redisData.quizId,
    userId: redisData.userId,
    status: redisData.status,
    score: parseInt(redisData.score, 10),
    currentQuestionIndex: parseInt(redisData.currentQuestionIndex, 10),
    questionStartTime: redisData.questionStartTime,
    totalQuestions: parseInt(redisData.totalQuestions, 10),
    classroomQuizId: redisData.classroomQuizId,
  });

  if (!sessionData) {
    return null; // Session data not found or invalid
  }

  return { ...sessionData, id: sessionId }; // Return the session data and session ID for the user
}
