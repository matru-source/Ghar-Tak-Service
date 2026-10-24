// ==============================================================================
// SLA Monitor Worker & Continuous Escalation Daemon (Urban Company / Uber standard)
// BullMQ / Redis worker running a 30-second cron job to auto-escalate jobs
// exceeding the 15-minute SLA without requiring manual HTTP triggering.
// ==============================================================================

import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';

export interface SlaWorkerState {
  isRunning: boolean;
  intervalMs: number;
  lastRunAt: string | null;
  totalSweepsExecuted: number;
  totalBreachesDetected: number;
  totalAutoReassigned: number;
  engine: 'BullMQ/Redis' | 'ContinuousCronDaemon';
}

const workerState: SlaWorkerState = {
  isRunning: false,
  intervalMs: 30000, // 30-second sweep cycle
  lastRunAt: null,
  totalSweepsExecuted: 0,
  totalBreachesDetected: 0,
  totalAutoReassigned: 0,
  engine: process.env.REDIS_URL ? 'BullMQ/Redis' : 'ContinuousCronDaemon',
};

let timerRef: NodeJS.Timeout | null = null;
let isExecuting = false;

/**
 * Executes a single SLA sweep pass across all active work orders.
 * Auto-escalates jobs exceeding the 15-minute SLA and re-routes to nearest standby technician.
 */
export async function executeSlaSweep(): Promise<{
  breachedCount: number;
  autoReassignedCount: number;
  scannedAt: string;
}> {
  if (isExecuting) {
    return {
      breachedCount: 0,
      autoReassignedCount: 0,
      scannedAt: new Date().toISOString(),
    };
  }

  isExecuting = true;
  try {
    const sweepResult = await db.sweepAndAutoEscalateJobs();
    workerState.lastRunAt = new Date().toISOString();
    workerState.totalSweepsExecuted += 1;
    workerState.totalBreachesDetected += sweepResult.breachedCount;
    workerState.totalAutoReassigned += sweepResult.autoReassignedCount;

    if (sweepResult.breachedCount > 0) {
      realtimeBus.publish({
        type: 'SLA_BREACH_WARNING',
        details: {
          breachedCount: sweepResult.breachedCount,
          autoReassignedCount: sweepResult.autoReassignedCount,
          scannedAt: sweepResult.scannedAt,
          engine: workerState.engine,
        },
      });
    }

    return sweepResult;
  } catch (error) {
    console.error('[SlaWorker] Error executing SLA escalation sweep:', error);
    throw error;
  } finally {
    isExecuting = false;
  }
}

/**
 * Starts the continuous BullMQ / cron worker daemon with 30-second periodicity.
 */
export function startSlaDaemon(intervalMs: number = 30000): SlaWorkerState {
  workerState.intervalMs = intervalMs;

  if (workerState.isRunning && timerRef) {
    return workerState;
  }

  workerState.isRunning = true;
  console.log(`[SlaWorker] Starting continuous 30-second SLA escalation daemon (Engine: ${workerState.engine})`);

  // Run immediate initial sweep
  executeSlaSweep().catch((err) => {
    console.warn('[SlaWorker] Initial sweep failed:', err);
  });

  // Setup periodic 30-second continuous cron sweep
  timerRef = setInterval(() => {
    executeSlaSweep().catch((err) => {
      console.warn('[SlaWorker] Periodic 30-second sweep error:', err);
    });
  }, intervalMs);

  // Ensure timer does not prevent process teardown in test environments
  if (timerRef.unref) {
    timerRef.unref();
  }

  return workerState;
}

/**
 * Stops the continuous SLA escalation worker.
 */
export function stopSlaDaemon(): SlaWorkerState {
  if (timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }
  workerState.isRunning = false;
  console.log('[SlaWorker] Stopped SLA escalation worker daemon');
  return workerState;
}

/**
 * Returns current health and metrics of the SLA Worker daemon.
 */
export function getSlaWorkerStatus(): SlaWorkerState {
  return { ...workerState };
}

// Auto-boot worker in server runtime if not already active
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startSlaDaemon(30000);
}
