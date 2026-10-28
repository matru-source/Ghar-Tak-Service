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
    const existingJob = await db.getJobById(id);

    if (!existingJob) {
      return apiError(`Work order '${id}' not found`, 404);
    }

    if (['COMPLETED', 'WORK_COMPLETED', 'SETTLED', 'PAYMENT_PENDING'].includes(existingJob.status)) {
      return apiError(`Cannot cancel work order '${existingJob.jobTicketNumber}'. Service has already been completed.`, 400);
    }

    if (existingJob.status === 'IN_PROGRESS' || existingJob.status === 'SAFETY_CHECKED') {
      return apiError(
        `Direct cancellation is blocked: Work order '${existingJob.jobTicketNumber}' is actively in progress with electrical safety interlocks engaged. To safely abort the service, please contact Partner Operations immediately at +91-800-GHARTAK.`,
        422
      );
    }

    let deadMileageCompensationInr = 0;
    let payoutResult: any = null;

    // Dead Mileage Compensation (Issue 43): If cancelled while technician was EN_ROUTE or ARRIVED, credit ₹99 via instant UPI payout
    if ((existingJob.status === 'EN_ROUTE' || existingJob.status === 'ARRIVED') && existingJob.technicianId) {
      deadMileageCompensationInr = 99.0;
      try {
        const { payoutGateway } = await import('@/lib/payout-gateway');
        payoutResult = await payoutGateway.dispatchInstantUpiPayout({
          recipientId: existingJob.technicianId,
          recipientName: existingJob.technicianName,
          phone: (existingJob as any).technicianPhone,
          amountInr: deadMileageCompensationInr,
          referenceId: `TXN-DEAD-MILEAGE-${Date.now()}`,
          narration: `Dead Mileage Compensation #${existingJob.jobTicketNumber}`,
          jobTicketNumber: existingJob.jobTicketNumber,
          partnerId: existingJob.partnerId,
        });
      } catch (err) {
        console.warn('[Cancel] Failed to dispatch instant UPI dead mileage payout:', err);
      }
    }

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
        deadMileageCompensationInr,
        message: deadMileageCompensationInr > 0
          ? `Booking cancelled. ₹${deadMileageCompensationInr} dead mileage compensation credited to technician.`
          : 'Job cancelled by user',
      },
    });

    if (deadMileageCompensationInr > 0) {
      realtimeBus.publish({
        type: 'DEAD_MILEAGE_CREDITED',
        jobId: id,
        ticketNumber: job.jobTicketNumber,
        partnerId: job.partnerId,
        technicianId: existingJob?.technicianId,
        details: {
          amountInr: deadMileageCompensationInr,
          payout: payoutResult,
          message: `Customer cancelled order #${job.jobTicketNumber}. ₹${deadMileageCompensationInr} fuel compensation transferred via instant UPI (UTR: ${payoutResult?.utrNumber || 'N/A'}).`,
        },
      });
    }

    realtimeBus.publish({
      type: 'TECH_REJECTED',
      jobId: id,
      ticketNumber: job.jobTicketNumber,
      partnerId: job.partnerId,
      technicianId: job.technicianId,
      status: 'CANCELLED',
      details: {
        reason,
        payout: payoutResult,
        message: 'Job cancelled by user',
      },
    });

    const successMessage = deadMileageCompensationInr > 0
      ? `Booking cancelled. ₹${deadMileageCompensationInr.toFixed(2)} dead mileage compensation transferred to technician's UPI (UTR: ${payoutResult?.utrNumber || 'N/A'}).`
      : 'Booking cancelled successfully';

    return apiSuccess({ ...job, deadMileageCompensationInr, payout: payoutResult }, successMessage);
  } catch (error) {
    return apiError('Failed to cancel job', 400, error instanceof Error ? error.message : String(error));
  }
}
