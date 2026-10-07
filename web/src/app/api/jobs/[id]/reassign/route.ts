import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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
    const body = await request.json().catch(() => ({}));
    const { targetTechnicianId, reason, slaExtensionMinutes } = body;

    const result = await db.reassignJobProximity(id, {
      targetTechnicianId,
      reason,
      slaExtensionMinutes: typeof slaExtensionMinutes === 'number' ? slaExtensionMinutes : 20,
    });

    return apiSuccess(
      result,
      `Work order '${result.job.jobTicketNumber}' successfully reassigned to ${result.reassignedTechnician.fullName} (${result.proximityDistanceKm} km away). Emergency SLA target extended to ${result.newSlaExpiryAt}.`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to reassign job',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
