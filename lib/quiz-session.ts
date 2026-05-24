import redis from '@/lib/redis';
import { r_SessionSchema } from '@/lib/schemas/sessionschemas';

export async function resolveSession(userId: string) {
  const sessionId = await redis.get(`player_session:${userId}`);

  if (!sessionId) {
    return null; // No active session for the user
  }

  const sessionData = r_SessionSchema.parse(
    await redis.hgetall(`session:${sessionId}`)
  );

  if (!sessionData) {
    return null; // Session data not found or invalid
  }

  return { ...sessionData, id: sessionId }; // Return the session data and session ID for the user
}
