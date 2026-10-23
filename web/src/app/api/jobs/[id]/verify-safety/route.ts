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
    const glovesConfirmed = Boolean(body.safetyGlovesConfirmed ?? body.insulatedGlovesConfirmed);
    const mcbConfirmed = Boolean(body.safetyMcbSwitchConfirmed ?? body.mcbSwitchedOff);
    const beforePhotoUrl = body.beforePhotoUrl || body.photoUrl || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800';

    if (!glovesConfirmed) {
      return apiError(
        'Mandatory Safety Interlock Failure: 1000V Insulated Gloves Protocol must be checked and confirmed before live circuit work.',
        422
      );
    }

    if (!mcbConfirmed) {
      return apiError(
        'Mandatory Safety Interlock Failure: Main MCB breaker power switch must be turned OFF and confirmed before inspection.',
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
