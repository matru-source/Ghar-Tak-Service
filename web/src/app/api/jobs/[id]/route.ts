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

    const url = new URL(request.url);
    const roleParam = url.searchParams.get('role')?.toUpperCase();
    const roleHeader = request.headers.get('x-user-role')?.toUpperCase();
    const clientApp = request.headers.get('x-client-app')?.toLowerCase();
    const isCustomerCaller =
      roleParam === 'CUSTOMER' ||
      roleHeader === 'CUSTOMER' ||
      clientApp === 'customer';

    // Strict backend field masking (Issue 36): Mask OTP unless explicitly verified as customer
    const isTechnicianCaller =
      !isCustomerCaller ||
      roleParam === 'TECHNICIAN' ||
      roleHeader === 'TECHNICIAN' ||
      clientApp === 'technician';

function maskPhoneNumber(phone?: string): string {
  if (!phone) return '+91-XXXXX-XXXXX';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return '+91-XXXXX-XXXXX';
  const last4 = clean.slice(-4);
  return `+91-XXXXX-${last4}`;
}

    return apiSuccess({
      ...job,
      customerPhone: isTechnicianCaller ? maskPhoneNumber(job.customerPhone) : job.customerPhone,
      customerPhoneMasked: isTechnicianCaller,
      handoverOtp: isTechnicianCaller ? undefined : job.handoverOtp,
      isHandoverOtpRequired: Boolean(job.handoverOtp),
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
    const { status, reason, actorId, version } = body;

    if (!status) {
      return apiError("'status' field is required", 400);
    }

    const currentJob = await db.getJobById(id);
    if (!currentJob) {
      return apiError(`Work order '${id}' not found`, 404);
    }

    // Optimistic Concurrency Control (OCC): Prevent overwriting concurrent reassignments or siren accepts
    const currentVersion = (currentJob as any).version ?? 1;
    if (version !== undefined && currentVersion !== undefined && version !== currentVersion) {
      return apiError(
        `Conflict: Work order '${currentJob.jobTicketNumber}' was updated concurrently (version ${currentVersion} vs expected ${version}). Please refresh.`,
        409
      );
    }

    // Normalize status: Map STARTED -> IN_PROGRESS, COMPLETED -> WORK_COMPLETED across all layers (Issue 31, 37)
    const canonicalStatus =
      status === 'STARTED'
        ? 'IN_PROGRESS'
        : status === 'COMPLETED'
        ? 'WORK_COMPLETED'
        : status;

    // Issue 32 Safety Interlock: Prohibit transitioning to IN_PROGRESS unless safetyGlovesConfirmed and safetyMcbSwitchConfirmed are true
    if (canonicalStatus === 'IN_PROGRESS') {
      if (!currentJob.safetyGlovesConfirmed || !currentJob.safetyMcbSwitchConfirmed) {
        return apiError(
          `Safety Interlock Engaged: Cannot transition work order '${currentJob.jobTicketNumber}' to IN_PROGRESS directly. Safety interlocks unverified: 1000V Insulated Gloves (${currentJob.safetyGlovesConfirmed ? 'VERIFIED' : 'PENDING'}) and MCB Power Isolation (${currentJob.safetyMcbSwitchConfirmed ? 'VERIFIED' : 'PENDING'}). Complete /api/jobs/${id}/verify-safety first.`,
          422
        );
      }
    }

    const updatedJob = await db.updateJobStatus(id, canonicalStatus, { actorId, reason });
    (updatedJob as any).version = currentVersion + 1;

    return apiSuccess(
      updatedJob,
      `Job '${updatedJob.jobTicketNumber}' status transitioned to '${updatedJob.status}' successfully`
    );
  } catch (error) {
    return apiError('Failed to transition job status', 400, error instanceof Error ? error.message : String(error));
  }
}
