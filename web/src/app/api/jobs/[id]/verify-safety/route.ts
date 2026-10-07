import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { safetyGlovesConfirmed, safetyMcbSwitchConfirmed, beforePhotoUrl } = body;

    if (safetyGlovesConfirmed !== true) {
      return apiError(
        'Mandatory Safety Interlock Failure: 1000V Insulated Gloves Protocol must be checked and confirmed before live circuit work.',
        422
      );
    }

    if (safetyMcbSwitchConfirmed !== true) {
      return apiError(
        'Mandatory Safety Interlock Failure: Main MCB breaker power switch must be turned OFF and confirmed before inspection.',
        422
      );
    }

    if (!beforePhotoUrl || typeof beforePhotoUrl !== 'string') {
      return apiError(
        'Mandatory Safety Evidence Failure: Pre-work site photograph (beforePhotoUrl) is required to document initial hazard state.',
        422
      );
    }

    const updatedJob = await db.verifySafetyInterlock(id, {
      safetyGlovesConfirmed: true,
      safetyMcbSwitchConfirmed: true,
      beforePhotoUrl,
    });

    // Broadcast Real-Time Safety Interlock
    realtimeBus.publish({
      type: 'SAFETY_INTERLOCK_VERIFIED',
      jobId: id,
      ticketNumber: updatedJob.jobTicketNumber,
      partnerId: updatedJob.partnerId,
      technicianId: updatedJob.technicianId,
      status: updatedJob.status,
      details: {
        glovesVerified: true,
        mcbIsolated: true,
        beforePhotoUrl,
      },
    });

    return apiSuccess(
      updatedJob,
      `Safety interlocks verified successfully for job '${updatedJob.jobTicketNumber}'. 1000V gloves active, MCB isolated. Work may commence safely.`,
      200
    );
  } catch (error) {
    return apiError('Failed to verify electrical safety interlocks', 400, error instanceof Error ? error.message : String(error));
  }
}
