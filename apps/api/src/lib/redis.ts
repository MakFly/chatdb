import Redis from "ioredis";

export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  : null;

export async function checkRedisConnection(): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
