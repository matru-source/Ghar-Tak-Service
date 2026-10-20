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
    const { technicianId, action, rejectionReason } = body;

    if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
      return apiError("'action' must be either 'ACCEPT' or 'REJECT'", 400);
    }

    // Resolve technician ID from request or from the job record
    let activeTechId = technicianId;
    if (!activeTechId) {
      const existingJob = await db.getJobById(id);
      activeTechId = existingJob?.technicianId || 'tech_unassigned';
    }

    const result = await db.respondToDispatch(id, activeTechId, action, rejectionReason);

    // Broadcast Real-Time Acceptance or Rejection to both Technician and Customer
    realtimeBus.publish({
      type: action === 'ACCEPT' ? 'TECH_ACCEPTED' : 'TECH_REJECTED',
      jobId: id,
      ticketNumber: result.job?.jobTicketNumber,
      partnerId: result.job?.partnerId,
      technicianId: activeTechId,
      customerId: result.job?.customerId,
      status: result.job?.status,
      details: {
        action,
        rejectionReason,
        message: result.message,
        customerId: result.job?.customerId,
        technicianName: result.job?.technicianName,
      },
    });

    const responsePayload = {
      ...(result.job || {}),
      outcome: result.outcome,
      message: result.message,
    };

    return apiSuccess(
      responsePayload,
      result.message,
      200
    );
  } catch (error) {
    return apiError('Failed to process dispatch response', 400, error instanceof Error ? error.message : String(error));
  }
}
