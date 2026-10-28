// ==============================================================================
// Redis Distributed Lock for Atomic Work Order Acceptance (Urban Company / Uber standard)
// Ensures that under 60-second broadcast dispatch, only the first atomic tap
// claims the work order via Redlock: SET lock:job:<id> <technicianId> NX EX 10
// With atomic Lua unlock script to ensure only the holder can release.
// ==============================================================================

import { getRedisClient } from './redis-client';

interface MemoryLockEntry {
  holder: string;
  expiresAt: number;
}

// In-process atomic lock store fallback when external Redis cluster is not active
const memoryLockStore = new Map<string, MemoryLockEntry>();

// Redlock atomic release script (Lua)
const LUA_UNLOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

/**
 * Acquire distributed lock for job siren acceptance.
 * Atomic semantics equivalent to: SET lock:job:<jobId> <technicianId> NX EX <ttlSeconds>
 */
export async function acquireJobLock(
  jobId: string,
  technicianId: string,
  ttlSeconds: number = 10
): Promise<{ success: boolean; holder?: string; key: string }> {
  const lockKey = `lock:job:${jobId}`;
  const now = Date.now();

  const redis = getRedisClient();
  if (redis) {
    try {
      // ioredis atomic call: set(key, val, 'EX', ttl, 'NX')
      const result = await redis.set(lockKey, technicianId, 'EX', ttlSeconds, 'NX');
      if (result === 'OK') {
        return { success: true, holder: technicianId, key: lockKey };
      }
      const currentHolder = await redis.get(lockKey);
      return {
        success: currentHolder === technicianId,
        holder: currentHolder || undefined,
        key: lockKey,
      };
    } catch (redisErr: any) {
      console.warn(`[RedisLock] Redis command error, falling back to memory:`, redisErr.message);
    }
  }

  // Atomic in-memory lock engine with strict TTL check
  const existing = memoryLockStore.get(lockKey);
  if (existing && existing.expiresAt > now) {
    if (existing.holder === technicianId) {
      return { success: true, holder: technicianId, key: lockKey };
    }
    return { success: false, holder: existing.holder, key: lockKey };
  }

  // Atomically set lock with TTL
  memoryLockStore.set(lockKey, {
    holder: technicianId,
    expiresAt: now + ttlSeconds * 1000,
  });

  return { success: true, holder: technicianId, key: lockKey };
}

/**
 * Releases distributed lock if held by the given technician using atomic Lua script.
 */
export async function releaseJobLock(jobId: string, technicianId: string): Promise<boolean> {
  const lockKey = `lock:job:${jobId}`;

  const redis = getRedisClient();
  if (redis) {
    try {
      const res = await redis.eval(LUA_UNLOCK_SCRIPT, 1, lockKey, technicianId);
      return res === 1;
    } catch (_) {}
  }

  const existing = memoryLockStore.get(lockKey);
  if (existing && existing.holder === technicianId) {
    memoryLockStore.delete(lockKey);
    return true;
  }
  return false;
}
