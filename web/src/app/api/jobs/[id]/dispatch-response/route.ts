import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { acquireJobLock, releaseJobLock } from '@/lib/redis-lock';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * Automated cascading dispatch: on rejection, immediately cascade dispatch siren to the next candidate
 */
async function cascadeDispatchToNextTechnician(
  jobId: string,
  currentTechId: string,
  rejectionReason?: string
) {
  return db.respondToDispatch(jobId, currentTechId, 'REJECT', rejectionReason);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { technicianId, action, rejectionReason, version } = body;

    if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
      return apiError("'action' must be either 'ACCEPT' or 'REJECT'", 400);
    }

    // Resolve technician ID from request or from the job record
    let activeTechId = technicianId;
    const existingJob = await db.getJobById(id);
    if (!existingJob) {
      return apiError(`Work order #${id} not found`, 404);
    }

    if (!activeTechId) {
      activeTechId = existingJob.technicianId || 'tech_unassigned';
    }

    // --------------------------------------------------------------------------
    // Issue 23: Optimistic Concurrency Control (OCC) with version column
    // Prevent collision if partner admin manually reassigned while siren is ringing
    // --------------------------------------------------------------------------
    const currentVersion = (existingJob as any).version ?? 1;
    if (version !== undefined && currentVersion !== undefined && version !== currentVersion) {
      return apiError(
        `Conflict: Work order #${existingJob.jobTicketNumber} was updated concurrently by partner dispatch (version ${currentVersion} vs expected ${version}). Please refresh.`,
        409
      );
    }

    // --------------------------------------------------------------------------
    // Issue 19: Redis Distributed Lock on Siren Acceptance (SET lock:job:<id> <techId> NX EX 10)
    // Ensures that under 60s broadcast dispatch, only the first atomic tap succeeds
    // --------------------------------------------------------------------------
    if (action === 'ACCEPT') {
      const lock = await acquireJobLock(id, activeTechId, 10);
      if (!lock.success) {
        return apiError(
          `Conflict: Work order #${existingJob.jobTicketNumber} was claimed by another technician (${lock.holder || 'another pro'}).`,
          409
        );
      }

      // Concurrency check: Ensure job was not already assigned or moved out of dispatchable state
      if (
        existingJob.status !== 'PENDING_DISPATCH' &&
        existingJob.status !== 'ASSIGNED' &&
        (existingJob.status as string) !== 'DISPATCHED'
      ) {
        await releaseJobLock(id, activeTechId);
        return apiError(
          `Work order #${existingJob.jobTicketNumber} is no longer available for acceptance (current status: ${existingJob.status}).`,
          409
        );
      }
    }

    // Execute dispatch response or cascading dispatch
    const result = action === 'ACCEPT'
      ? await db.respondToDispatch(id, activeTechId, action, rejectionReason)
      : await cascadeDispatchToNextTechnician(id, activeTechId, rejectionReason);

    // Bump version for optimistic concurrency tracking
    if (result.job) {
      (result.job as any).version = (currentVersion || 1) + 1;
    }

    if (action === 'ACCEPT') {
      realtimeBus.publish({
        type: 'TECH_ACCEPTED',
        jobId: id,
        ticketNumber: result.job?.jobTicketNumber,
        partnerId: result.job?.partnerId,
        technicianId: activeTechId,
        customerId: result.job?.customerId,
        status: 'EN_ROUTE',
        details: {
          action: 'ACCEPT',
          message: result.message,
          customerId: result.job?.customerId,
          technicianName: result.job?.technicianName,
          version: (result.job as any)?.version,
        },
      });
    } else if (result.outcome === 'REASSIGNED' && result.nextTechnicianId) {
      // Release distributed lock on rejection
      await releaseJobLock(id, activeTechId);

      // 1. Notify the declining technician
      realtimeBus.publish({
        type: 'TECH_REJECTED',
        jobId: id,
        ticketNumber: result.job?.jobTicketNumber,
        partnerId: result.job?.partnerId,
        technicianId: activeTechId,
        customerId: result.job?.customerId,
        status: 'ASSIGNED',
        details: {
          action: 'REJECT',
          rejectionReason,
          message: 'Decline recorded. Cascading dispatch to next standby technician.',
        },
      });

      // 2. Cascade 60-second dispatch siren to the next standby technician!
      realtimeBus.publish({
        type: 'TECH_DISPATCHED',
        jobId: id,
        ticketNumber: result.job?.jobTicketNumber,
        partnerId: result.job?.partnerId,
        technicianId: result.nextTechnicianId,
        customerId: result.job?.customerId,
        pincode: result.job?.pincode,
        status: 'ASSIGNED',
        details: {
          acceptanceTimerSeconds: 60,
          technicianName: result.job?.technicianName,
          payoutShareInr: Math.round((result.job?.totalAmountInr || 299) * 0.7),
          serviceTitle: result.job?.serviceTitle,
          totalAmountInr: result.job?.totalAmountInr,
          customerName: result.job?.customerName,
          customerPhone: result.job?.customerPhone,
          customerAddress: result.job?.customerAddressText,
          dispatchedAt: result.job?.dispatchedAt || new Date().toISOString(),
          version: (result.job as any)?.version,
        },
      });
    } else {
      // Release lock
      await releaseJobLock(id, activeTechId);

      // Queued in PENDING_DISPATCH for Partner Hub manual dispatch
      realtimeBus.publish({
        type: 'TECH_REJECTED',
        jobId: id,
        ticketNumber: result.job?.jobTicketNumber,
        partnerId: result.job?.partnerId,
        technicianId: activeTechId,
        customerId: result.job?.customerId,
        status: 'PENDING_DISPATCH',
        details: {
          action: 'REJECT',
          rejectionReason,
          message: 'Technician declined. Queued for Partner Hub dispatch.',
        },
      });
    }

    const responsePayload = {
      ...(result.job || {}),
      outcome: result.outcome,
      message: result.message,
      nextTechnicianId: (result as any).nextTechnicianId,
      version: (result.job as any)?.version,
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
