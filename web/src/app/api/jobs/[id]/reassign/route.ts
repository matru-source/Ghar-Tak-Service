import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { realtimeBus } from '@/lib/realtime-bus';

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
    const { targetTechnicianId, newTechnicianId, reason, slaExtensionMinutes } = body;
    const resolvedTargetId = targetTechnicianId || newTechnicianId;

    const result = await db.reassignJobProximity(id, {
      targetTechnicianId: resolvedTargetId,
      reason,
      slaExtensionMinutes: typeof slaExtensionMinutes === 'number' ? slaExtensionMinutes : 20,
    });

    // Notify customer and ecosystem of re-assigned technician
    realtimeBus.publish({
      type: 'JOB_REASSIGNED',
      jobId: id,
      ticketNumber: result.job?.jobTicketNumber,
      partnerId: result.job?.partnerId,
      technicianId: result.reassignedTechnician?.id,
      customerId: result.job?.customerId,
      status: result.job?.status || 'ASSIGNED',
      details: {
        action: 'REASSIGN',
        technicianName: result.reassignedTechnician?.fullName,
        technicianPhone: result.reassignedTechnician?.phone,
        technicianBadge: result.reassignedTechnician?.badgeNumber,
        technicianRating: result.reassignedTechnician?.rating,
        status: result.job?.status || 'ASSIGNED',
        reason,
      },
    });

    // Alert newly assigned standby technician on their mobile terminal
    realtimeBus.publish({
      type: 'TECH_DISPATCHED',
      jobId: id,
      ticketNumber: result.job?.jobTicketNumber,
      partnerId: result.job?.partnerId,
      technicianId: result.reassignedTechnician?.id,
      customerId: result.job?.customerId,
      pincode: result.job?.pincode,
      status: 'ASSIGNED',
      details: {
        acceptanceTimerSeconds: 60,
        technicianName: result.reassignedTechnician?.fullName,
        payoutShareInr: Math.round((result.job?.totalAmountInr || 299) * 0.7),
        serviceTitle: result.job?.serviceTitle,
        totalAmountInr: result.job?.totalAmountInr,
        customerName: result.job?.customerName,
        customerPhone: result.job?.customerPhone,
        customerAddress: result.job?.customerAddressText,
        dispatchedAt: result.job?.dispatchedAt || new Date().toISOString(),
      },
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
