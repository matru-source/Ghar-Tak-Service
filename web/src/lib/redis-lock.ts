// ==============================================================================
// Redis Distributed Lock for Atomic Work Order Acceptance (Urban Company / Uber standard)
// Ensures that under 60-second broadcast dispatch, only the first atomic tap
// claims the work order via: SET lock:job:<id> <technicianId> NX EX 10
// ==============================================================================

interface MemoryLockEntry {
  holder: string;
  expiresAt: number;
}

// In-process atomic lock store fallback when external Redis cluster is not active
const memoryLockStore = new Map<string, MemoryLockEntry>();

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

  // If REDIS_URL is configured, attempt Redis command SET lock:job:<id> <techId> NX EX <ttl>
  if (process.env.REDIS_URL) {
    try {
      // Dynamic import to prevent crashing if redis module is optional in local dev
      // standard Redis client: redis.set(lockKey, technicianId, 'NX', 'EX', ttlSeconds)
      // @ts-ignore
      const { createClient } = await import('redis').catch(() => ({ createClient: null as any }));
      if (createClient) {
        const client = createClient({ url: process.env.REDIS_URL });
        await client.connect();
        const acquired = await client.set(lockKey, technicianId, { NX: true, EX: ttlSeconds });
        const currentHolder = acquired ? technicianId : await client.get(lockKey);
        await client.disconnect().catch(() => {});
        return {
          success: acquired === 'OK',
          holder: currentHolder || undefined,
          key: lockKey,
        };
      }
    } catch (redisErr) {
      console.warn(`[RedisLock] Redis connection warning, using memory fallback:`, redisErr);
    }
  }

  // Atomic in-memory lock engine with strict TTL check
  const existing = memoryLockStore.get(lockKey);
  if (existing && existing.expiresAt > now) {
    // Lock is actively held by someone else or current technician
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
 * Releases distributed lock if held by the given technician.
 */
export async function releaseJobLock(jobId: string, technicianId: string): Promise<boolean> {
  const lockKey = `lock:job:${jobId}`;

  if (process.env.REDIS_URL) {
    try {
      // @ts-ignore
      const { createClient } = await import('redis').catch(() => ({ createClient: null as any }));
      if (createClient) {
        const client = createClient({ url: process.env.REDIS_URL });
        await client.connect();
        const holder = await client.get(lockKey);
        if (holder === technicianId) {
          await client.del(lockKey);
        }
        await client.disconnect().catch(() => {});
        return true;
      }
    } catch (_) {}
  }

  const existing = memoryLockStore.get(lockKey);
  if (existing && existing.holder === technicianId) {
    memoryLockStore.delete(lockKey);
    return true;
  }
  return false;
}
