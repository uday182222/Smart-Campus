import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const initializeRedis = async (): Promise<Redis> => {
  if (redisClient) {
    return redisClient;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  };

  redisClient = new Redis(redisConfig);

  redisClient.on('connect', () => {
    logger.info('✅ Redis connection established');
  });

  redisClient.on('error', (error) => {
    logger.error('❌ Redis connection error:', error);
  });

  redisClient.on('ready', () => {
    logger.info('Redis client is ready');
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redisClient;
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

// Cache helper functions
export const setCache = async (key: string, value: any, ttl?: number): Promise<void> => {
  const client = getRedisClient();
  const serialized = JSON.stringify(value);
  
  if (ttl) {
    await client.setex(key, ttl, serialized);
  } else {
    await client.set(key, serialized);
  }
};

export const getCache = async (key: string): Promise<any | null> => {
  const client = getRedisClient();
  const value = await client.get(key);
  
  if (!value) {
    return null;
  }
  
  try {
    return JSON.parse(value);
  } catch (error) {
    logger.error('Error parsing cached value:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  
  if (keys.length > 0) {
    await client.del(...keys);
  }
};

