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
    const { handoverOtp, afterPhotoUrl, customerRating, customerFeedback } = body;

    if (!handoverOtp || !/^\d{4}$/.test(String(handoverOtp).trim())) {
      return apiError(
        'Handover Verification Failure: 4-digit numeric handover OTP is required to prove customer physical inspection.',
        400
      );
    }

    if (!afterPhotoUrl || typeof afterPhotoUrl !== 'string') {
      return apiError(
        'Quality Assurance Failure: Post-work site photograph (afterPhotoUrl) is mandatory to certify clean, completed electrical work.',
        422
      );
    }

    const { job, invoice } = await db.completeJob(id, {
      handoverOtp: String(handoverOtp).trim(),
      afterPhotoUrl,
      customerRating: typeof customerRating === 'number' ? customerRating : undefined,
      customerFeedback: typeof customerFeedback === 'string' ? customerFeedback : undefined,
    });

    // 1. Broadcast Real-Time Job Completion
    realtimeBus.publish({
      type: 'JOB_COMPLETED',
      jobId: id,
      ticketNumber: job.jobTicketNumber,
      partnerId: job.partnerId,
      technicianId: job.technicianId,
      customerId: job.customerId,
      status: job.status,
      details: {
        completedAt: job.completedAt,
        totalAmountInr: job.totalAmountInr,
        invoiceNumber: invoice.invoiceNumber,
        customerRating: job.customerRating || 5,
        handoverOtp,
      },
    });

    // 2. Broadcast Double-Entry Payout Transfer
    realtimeBus.publish({
      type: 'PAYOUT_TRANSFERRED',
      jobId: id,
      ticketNumber: job.jobTicketNumber,
      partnerId: job.partnerId,
      technicianId: job.technicianId,
      details: {
        technicianPayoutInr: Math.round(job.totalAmountInr * 0.7),
        franchiseCommissionInr: Math.round(job.totalAmountInr * 0.15),
        platformRoyaltyInr: Math.round(job.totalAmountInr * 0.15),
        gstEscrowReserveInr: Math.round((invoice.cgstAmount || 0) + (invoice.sgstAmount || 0)),
      },
    });

    return apiSuccess(
      {
        job,
        invoice,
        completionSummary: {
          jobTicketNumber: job.jobTicketNumber,
          completedAt: job.completedAt,
          totalAmountInr: job.totalAmountInr,
          invoiceNumber: invoice.invoiceNumber,
          customerRating: job.customerRating || 5,
        },
      },
      `Job '${job.jobTicketNumber}' completed and verified successfully! 18% GST Tax Invoice '${invoice.invoiceNumber}' issued.`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to complete job handover',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
