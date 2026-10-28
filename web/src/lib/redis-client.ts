// ==============================================================================
// Redis Client Manager for Distributed Locking & Pub/Sub Event Backplane
// Supports ioredis connection with automatic reconnection & in-memory fallback
// ==============================================================================

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;
let isConnected = false;
let connectionAttempted = false;

function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return;
  }

  if (connectionAttempted) {
    return;
  }
  connectionAttempted = true;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 100, 1000);
      },
    });

    redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('[Redis] Connected successfully to Redis backplane');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Keep logging minimal to avoid console noise if Redis is optional in dev
      console.warn('[Redis] Connection warning (using in-memory fallback):', err.message);
    });

    redisSubscriber.on('error', () => {
      // Ignored for fallback
    });

    redisClient.connect().catch(() => {});
    redisSubscriber.connect().catch(() => {});
  } catch (err: any) {
    console.warn('[Redis] Initialization warning:', err.message);
  }
}

export function getRedisClient(): Redis | null {
  initRedis();
  return isConnected ? redisClient : null;
}

export function getRedisSubscriber(): Redis | null {
  initRedis();
  return isConnected ? redisSubscriber : null;
}

export function isRedisActive(): boolean {
  initRedis();
  return isConnected;
}
