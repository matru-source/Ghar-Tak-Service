/**
 * Database Circuit Breaker & Resilient Write-Ahead Log (WAL) Engine
 * Implements Netflix Hystrix / Uber resilience standard for mission-critical PostgreSQL failover.
 * Protects endpoints from unhandled 500 exceptions during network partitions,
 * queues mutations in a persistent local WAL, and automatically drains back to PostgreSQL upon recovery.
 * Resolves Issue 50: Zero Circuit Breakers on Database Failover.
 */

import fs from 'fs';
import path from 'path';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface QueuedWalOperation {
  id: string;
  operationType: 'create' | 'update' | 'upsert' | 'delete' | 'updateMany' | 'createMany';
  tableName: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

export interface CircuitBreakerTelemetry {
  state: CircuitState;
  consecutiveFailures: number;
  totalTripsCount: number;
  lastFailureTime: string | null;
  lastRecoveryTime: string | null;
  pendingWalCount: number;
}

export class DatabaseCircuitBreaker {
  private static instance: DatabaseCircuitBreaker;
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private totalTripsCount = 0;
  private lastFailureTime: number | null = null;
  private lastRecoveryTime: number | null = null;

  // Thresholds
  private readonly failureThreshold = 3;
  private readonly cooldownPeriodMs = 30000; // 30s probe cooldown
  private readonly walFilePath = path.join(process.cwd(), '.database_wal.json');
  private isDraining = false;

  private constructor() {
    this.ensureWalFile();
  }

  static getInstance(): DatabaseCircuitBreaker {
    if (!DatabaseCircuitBreaker.instance) {
      DatabaseCircuitBreaker.instance = new DatabaseCircuitBreaker();
    }
    return DatabaseCircuitBreaker.instance;
  }

  private ensureWalFile(): void {
    try {
      if (!fs.existsSync(this.walFilePath)) {
        fs.writeFileSync(this.walFilePath, '[]', 'utf-8');
      }
    } catch {}
  }

  private loadWalQueue(): QueuedWalOperation[] {
    try {
      if (fs.existsSync(this.walFilePath)) {
        const raw = fs.readFileSync(this.walFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {}
    return [];
  }

  private saveWalQueue(queue: QueuedWalOperation[]): void {
    try {
      fs.writeFileSync(this.walFilePath, JSON.stringify(queue, null, 2), 'utf-8');
    } catch (e: any) {
      console.error('[CircuitBreaker] Failed to save WAL queue to disk:', e.message);
    }
  }

  getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime > this.cooldownPeriodMs) {
        this.state = 'HALF_OPEN';
        console.log('[CircuitBreaker] ⏳ Cooldown elapsed. Circuit transitioning to HALF_OPEN (Probing recovery)...');
      }
    }
    return this.state;
  }

  recordSuccess(): void {
    if (this.state !== 'CLOSED') {
      console.log('[CircuitBreaker] ✅ PostgreSQL Probe Succeeded. Circuit reset to CLOSED.');
      this.lastRecoveryTime = Date.now();
      // Drain WAL queue asynchronously
      this.drainWalQueue();
    }
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(error: any): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    console.warn(`[CircuitBreaker] ⚠️ DB Failure #${this.consecutiveFailures}:`, error?.message || error);

    if (this.consecutiveFailures >= this.failureThreshold && this.state !== 'OPEN') {
      this.state = 'OPEN';
      this.totalTripsCount++;
      console.error(
        `[CircuitBreaker] 🚨 CIRCUIT BREAKER TRIPPED TO OPEN! Fast-failing DB queries for ${this.cooldownPeriodMs / 1000}s to prevent request stalls.`
      );
    }
  }

  /**
   * Enqueues a critical write mutation to the persistent Write-Ahead Log (WAL)
   */
  enqueueWal(tableName: string, operationType: QueuedWalOperation['operationType'], payload: any): QueuedWalOperation {
    const queue = this.loadWalQueue();
    const item: QueuedWalOperation = {
      id: `wal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operationType,
      tableName,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    this.saveWalQueue(queue);
    console.warn(
      `[CircuitBreaker] 💾 Preserved critical mutation in persistent WAL: [${tableName}.${operationType}]. Total pending: ${queue.length}`
    );
    return item;
  }

  /**
   * Drains the WAL queue back to PostgreSQL upon connection recovery
   */
  async drainWalQueue(): Promise<{ drainedCount: number; remainingCount: number }> {
    if (this.isDraining) return { drainedCount: 0, remainingCount: this.getPendingCount() };
    this.isDraining = true;

    let drainedCount = 0;
    try {
      const queue = this.loadWalQueue();
      if (queue.length === 0) {
        this.isDraining = false;
        return { drainedCount: 0, remainingCount: 0 };
      }

      console.log(`[CircuitBreaker] 🔄 Draining ${queue.length} pending operations from WAL to PostgreSQL...`);
      const { prisma } = await import('./prisma');

      while (queue.length > 0) {
        const op = queue[0];
        try {
          const model = (prisma as any)[op.tableName];
          if (model && typeof model[op.operationType] === 'function') {
            await model[op.operationType](op.payload);
            drainedCount++;
          }
          queue.shift();
          this.saveWalQueue(queue);
        } catch (err: any) {
          console.error(`[CircuitBreaker] Error draining WAL operation ${op.id}:`, err?.message);
          op.retryCount++;
          if (op.retryCount >= 5) {
            console.error(`[CircuitBreaker] Poison pill WAL operation ${op.id} dropped after 5 retries.`);
            queue.shift();
            this.saveWalQueue(queue);
          } else {
            break;
          }
        }
      }
    } finally {
      this.isDraining = false;
    }

    return { drainedCount, remainingCount: this.getPendingCount() };
  }

  /**
   * Executes a database query safely. If circuit is OPEN or DB throws,
   * gracefully falls back to the provided fallback handler without throwing unhandled 500s.
   */
  async executeWithFallback<T>(
    dbOperation: () => Promise<T>,
    fallback: () => Promise<T> | T,
    options?: {
      tableName?: string;
      operationType?: QueuedWalOperation['operationType'];
      walPayload?: any;
    }
  ): Promise<T> {
    const currentState = this.getState();

    // Fast-fail if circuit is OPEN
    if (currentState === 'OPEN') {
      if (options?.tableName && options?.operationType && options?.walPayload) {
        this.enqueueWal(options.tableName, options.operationType, options.walPayload);
      }
      return fallback();
    }

    try {
      const result = await dbOperation();
      this.recordSuccess();
      return result;
    } catch (err: any) {
      this.recordFailure(err);

      if (options?.tableName && options?.operationType && options?.walPayload) {
        this.enqueueWal(options.tableName, options.operationType, options.walPayload);
      }

      return fallback();
    }
  }

  getPendingCount(): number {
    return this.loadWalQueue().length;
  }

  getTelemetry(): CircuitBreakerTelemetry {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      totalTripsCount: this.totalTripsCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastRecoveryTime: this.lastRecoveryTime ? new Date(this.lastRecoveryTime).toISOString() : null,
      pendingWalCount: this.getPendingCount(),
    };
  }
}

export const circuitBreaker = DatabaseCircuitBreaker.getInstance();
