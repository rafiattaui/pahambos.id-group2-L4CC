import Redis from 'ioredis';

// Extend the global scope to include the Redis client for reuse across hot reloads in development
declare global {
  var redis: Redis | undefined;
}

const getRedisClient = () => {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
  });
  client.on('error', (err) => {
    console.error('Redis error:', err);
  });
  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  return client;
};

// Reuse the Redis client across hot reloads in development to prevent multiple connections
const redis = globalThis.redis ?? getRedisClient();
if (process.env.NODE_ENV !== 'production') {
  globalThis.redis = redis;
}

export default redis;
