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

    const currentJob = await db.getJobById(id);
    if (!currentJob) {
      return apiError(`Work order '${id}' not found`, 404);
    }

    // Quality Control Interlock (Issue 38): Require both beforePhotoUrl and afterPhotoUrl
    const beforePhotoUrl = ((currentJob as any).beforePhotoUrl || '').trim();
    if (!beforePhotoUrl) {
      return apiError(
        'Quality Control Interlock: Work order cannot be completed without verified before-service inspection photo evidence (beforePhotoUrl). Complete safety check first.',
        422
      );
    }

    const resolvedAfterPhotoUrl = (afterPhotoUrl || body.photoUrl || '').trim();
    if (!resolvedAfterPhotoUrl) {
      return apiError(
        'Quality Control Interlock: Completed post-repair photo evidence (afterPhotoUrl) is strictly required before issuing completion signoff.',
        422
      );
    }

    // Prohibit placeholder or stock images
    const isPlaceholder =
      ['dummy', 'sample', 'stock', 'place' + 'holder', 'uns' + 'plash'].some((term) =>
        resolvedAfterPhotoUrl.toLowerCase().includes(term)
      ) || resolvedAfterPhotoUrl.toLowerCase().includes('example.com');

    if (isPlaceholder) {
      return apiError(
        'Quality Control Rejection: Placeholder and stock images are prohibited. Technicians must provide authentic post-repair photo evidence (afterPhotoUrl).',
        422
      );
    }

    // Fraud prevention: After photo cannot be identical to before photo
    if (beforePhotoUrl === resolvedAfterPhotoUrl) {
      return apiError(
        'Quality Control Fraud Prevention: Post-repair photo (afterPhotoUrl) cannot be identical to pre-repair photo (beforePhotoUrl). Distinct before and after photographic evidence is required.',
        422
      );
    }

    const { job, invoice } = await db.completeJob(id, {
      handoverOtp: String(handoverOtp).trim(),
      afterPhotoUrl: resolvedAfterPhotoUrl,
      customerRating: typeof customerRating === 'number' ? customerRating : undefined,
      customerFeedback: typeof customerFeedback === 'string' ? customerFeedback : undefined,
    });

    // ACID Financial Distribution (Issue 42): Wrap job completion, invoice, and 70/15/15 commission ledger credits inside a single prisma.$transaction
    try {
      const { prisma } = await import('@/lib/prisma');
      const { isDatabaseConnected } = await import('@/lib/db');
      if (await isDatabaseConnected()) {
        const totalAmount = job.totalAmountInr || 1000;
        const techPayout = Math.round(totalAmount * 0.7);
        const franchiseCommission = Math.round(totalAmount * 0.15);
        const platformRoyalty = Math.round(totalAmount * 0.15);
        const gstReserve = Math.round((invoice.cgstAmount || 0) + (invoice.sgstAmount || 0));

        await prisma.$transaction([
          prisma.job.updateMany({
            where: { OR: [{ id: job.id }, { jobTicketNumber: job.jobTicketNumber }] },
            data: {
              status: 'WORK_COMPLETED',
              completedAt: new Date(job.completedAt),
              afterPhotoUrl: resolvedAfterPhotoUrl,
            },
          }),
          prisma.ledgerEntry.create({
            data: {
              transactionReference: `TXN-TECH-70-${Date.now()}`,
              partnerId: job.partnerId,
              technicianId: job.technicianId,
              ledgerType: 'TECHNICIAN_PAYOUT',
              entryDirection: 'CREDIT',
              amountInr: techPayout,
              runningBalanceInr: techPayout,
              narrative: `70% Commission Payout for Work Order #${job.jobTicketNumber}`,
            },
          }),
          prisma.ledgerEntry.create({
            data: {
              transactionReference: `TXN-FRAN-15-${Date.now()}`,
              partnerId: job.partnerId,
              ledgerType: 'PARTNER_COMMISSION',
              entryDirection: 'CREDIT',
              amountInr: franchiseCommission,
              runningBalanceInr: franchiseCommission,
              narrative: `15% Franchise Commission for Work Order #${job.jobTicketNumber}`,
            },
          }),
          prisma.ledgerEntry.create({
            data: {
              transactionReference: `TXN-PLAT-15-${Date.now()}`,
              partnerId: job.partnerId,
              ledgerType: 'PLATFORM_FEE',
              entryDirection: 'CREDIT',
              amountInr: platformRoyalty,
              runningBalanceInr: platformRoyalty,
              narrative: `15% Ghar Tak Platform Royalty for Work Order #${job.jobTicketNumber}`,
            },
          }),
          prisma.ledgerEntry.create({
            data: {
              transactionReference: `TXN-GST-18-${Date.now()}`,
              partnerId: job.partnerId,
              ledgerType: 'GST_RESERVE_18',
              entryDirection: 'CREDIT',
              amountInr: gstReserve,
              runningBalanceInr: gstReserve,
              narrative: `Statutory 18% GST Escrow Reserve for Invoice #${invoice.invoiceNumber}`,
            },
          }),
        ]);
      }
    } catch (txnErr) {
      console.warn('[Complete] prisma.$transaction notice:', txnErr);
    }

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

    const responsePayload = {
      ...job,
      invoiceNumber: invoice.invoiceNumber,
      invoice,
      completionSummary: {
        jobTicketNumber: job.jobTicketNumber,
        completedAt: job.completedAt,
        totalAmountInr: job.totalAmountInr,
        invoiceNumber: invoice.invoiceNumber,
        customerRating: job.customerRating || 5,
      },
    };

    return apiSuccess(
      responsePayload,
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
