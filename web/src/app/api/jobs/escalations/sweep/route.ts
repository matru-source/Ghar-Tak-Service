import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const sweepResult = await db.sweepAndAutoEscalateJobs();

    if (sweepResult.breachedCount > 0) {
      realtimeBus.publish({
        type: 'SLA_BREACH_WARNING',
        details: {
          breachedCount: sweepResult.breachedCount,
          autoReassignedCount: sweepResult.autoReassignedCount,
          scannedAt: sweepResult.scannedAt,
        },
      });
    }

    return apiSuccess(
      sweepResult,
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
