import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { executeSlaSweep, getSlaWorkerStatus, startSlaDaemon } from '@/workers/sla-worker';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET: Monitor BullMQ / Redis continuous 30-second cron worker daemon status and SLA health
 */
export async function GET() {
  try {
    const workerStatus = getSlaWorkerStatus();
    return apiSuccess({
      worker: workerStatus,
      description: 'Continuous 30-second BullMQ/cron worker auto-escalates jobs exceeding 15-minute SLA',
      activePeriodicitySeconds: Math.round(workerStatus.intervalMs / 1000),
    }, 'SLA continuous escalation daemon is active');
  } catch (error) {
    return apiError('Failed to retrieve SLA worker status', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * POST: Triggers immediate sweep and ensures continuous BullMQ / cron worker daemon is running
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure background daemon is spinning
    startSlaDaemon(30000);

    const sweepResult = await executeSlaSweep();

    if (request.headers.get('accept')?.includes('text/html')) {
      return NextResponse.redirect(new URL('/admin?sweep=done', request.url));
    }

    return apiSuccess(
      {
        ...sweepResult,
        workerDaemon: getSlaWorkerStatus(),
      },
      `SLA Monitor Sweep completed: ${sweepResult.breachedCount} breached jobs detected, ${sweepResult.autoReassignedCount} auto-reassigned via proximity engine.`
    );
  } catch (error) {
    return apiError(
      'Failed to execute SLA escalation sweep',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
