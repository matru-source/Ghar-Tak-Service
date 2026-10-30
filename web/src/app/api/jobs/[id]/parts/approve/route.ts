import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/jobs/[id]/parts/approve
 * Customer in-app quote approval dialog handler (Issues 31, 33, 35)
 * Transitions job back to IN_PROGRESS, deducts warehouse inventory stock, and broadcasts JOB_PRICE_UPDATED.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const rawPartId = body.partId || body.id || 'latest';
    const effectivePartId = String(rawPartId || 'latest').trim();

    const rawDecision = String(body.decision || body.action || body.status || 'ACCEPT').toUpperCase().trim();
    const isAccept = rawDecision === 'ACCEPT' || rawDecision === 'APPROVE' || rawDecision === 'ACCEPTED';
    const isReject = rawDecision === 'REJECT' || rawDecision === 'DECLINE' || rawDecision === 'REJECTED';

    if (!isAccept && !isReject) {
      return apiError("Decision must be either 'ACCEPT' or 'REJECT'", 422);
    }

    const dec: 'ACCEPT' | 'REJECT' = isAccept ? 'ACCEPT' : 'REJECT';
    const customerId = body.customerId || undefined;
    const paymentMethod = body.paymentMethod || 'UPI';

    const result = await db.approveJobPartQuote(id, effectivePartId, dec, {
      customerId,
      actorRole: 'CUSTOMER',
    });

    const actionText = dec === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    return apiSuccess(
      {
        jobId: result.job.id,
        ticketNumber: result.job.jobTicketNumber,
        status: result.job.status,
        decision: result.decision,
        part: result.part,
        revisedTotalAmountInr: result.revisedTotalAmountInr,
        paymentMethod,
      },
      `Customer has ${actionText} the spare parts estimate. Work order resumed in IN_PROGRESS.`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to process customer parts quote approval',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return POST(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return POST(request, context);
}

