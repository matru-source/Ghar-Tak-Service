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
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Customer cancelled request';

    const job = await db.updateJobStatus(id, 'CANCELLED', { reason });

    realtimeBus.publish({
      type: 'JOB_CANCELLED',
      jobId: id,
      ticketNumber: job.jobTicketNumber,
      partnerId: job.partnerId,
      technicianId: job.technicianId,
      status: 'CANCELLED',
      details: {
        reason,
        message: 'Job cancelled by user',
      },
    });

    realtimeBus.publish({
      type: 'TECH_REJECTED',
      jobId: id,
      ticketNumber: job.jobTicketNumber,
      partnerId: job.partnerId,
      technicianId: job.technicianId,
      status: 'CANCELLED',
      details: {
        reason,
        message: 'Job cancelled by user',
      },
    });

    return apiSuccess(job, 'Booking cancelled successfully');
  } catch (error) {
    return apiError('Failed to cancel job', 400, error instanceof Error ? error.message : String(error));
  }
}
