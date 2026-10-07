import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.getJobById(id);

    if (!job) {
      return apiError(`Job ticket '${id}' not found`, 404);
    }

    // Calculate SLA remaining minutes
    const now = Date.now();
    const expiry = new Date(job.slaExpiryAt).getTime();
    const remainingMinutes = Math.round((expiry - now) / (60 * 1000));
    const isSlaBreached = remainingMinutes < 0 && job.status !== 'WORK_COMPLETED' && job.status !== 'SETTLED';

    return apiSuccess({
      ...job,
      slaTelemetry: {
        slaExpiryAt: job.slaExpiryAt,
        remainingMinutes,
        isSlaBreached,
        slaStatus: isSlaBreached ? 'BREACHED' : remainingMinutes <= 10 ? 'URGENT_WARNING' : 'HEALTHY',
      },
    }, `Retrieved details for job ${job.jobTicketNumber}`);
  } catch (error) {
    return apiError('Failed to fetch job details', 500, error instanceof Error ? error.message : String(error));
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason, actorId } = body;

    if (!status) {
      return apiError("'status' field is required", 400);
    }

    const updatedJob = await db.updateJobStatus(id, status, { actorId, reason });

    return apiSuccess(
      updatedJob,
      `Job '${updatedJob.jobTicketNumber}' status transitioned to '${updatedJob.status}' successfully`
    );
  } catch (error) {
    return apiError('Failed to transition job status', 400, error instanceof Error ? error.message : String(error));
  }
}
