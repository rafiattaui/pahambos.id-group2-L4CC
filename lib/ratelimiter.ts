import redis from './redis';
import z from 'zod';

const RateLimitResult = z.object({
  allowed: z.boolean(),
  remaining: z.number(),
  resetIn: z.number(), // seconds until rate limit resets
});

export async function rateLimit(
  id: string,
  limit = 100,
  windowSeconds = 60
): Promise<z.infer<typeof RateLimitResult>> {
  const key = `ratelimit:${id}`;

  const requests = await redis.incr(key);
  if (requests === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);

  return {
    allowed: requests <= limit,
    remaining: Math.max(limit - requests, 0),
    resetIn: ttl > 0 ? ttl : windowSeconds,
  };
}
