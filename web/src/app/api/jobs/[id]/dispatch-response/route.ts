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

    // Default to active test technician if none specified
    const activeTechId = technicianId || 'tech_rajesh_01';

    const result = await db.respondToDispatch(id, activeTechId, action, rejectionReason);

    // Broadcast Real-Time Acceptance or Rejection
    realtimeBus.publish({
      type: action === 'ACCEPT' ? 'TECH_ACCEPTED' : 'TECH_REJECTED',
      jobId: id,
      ticketNumber: result.job?.jobTicketNumber,
      partnerId: result.job?.partnerId,
      technicianId: activeTechId,
      status: result.job?.status,
      details: {
        action,
        rejectionReason,
        message: result.message,
      },
    });

    return apiSuccess(
      result,
      result.message,
      200
    );
  } catch (error) {
    return apiError('Failed to process dispatch response', 400, error instanceof Error ? error.message : String(error));
  }
}
