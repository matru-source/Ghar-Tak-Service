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
    const body = await request.json();
    const { partId, decision = 'ACCEPT', customerId } = body;

    if (!partId) {
      return apiError("'partId' (or 'latest') is required", 400);
    }

    const dec = (decision || '').toUpperCase();
    if (dec !== 'ACCEPT' && dec !== 'REJECT') {
      return apiError("Decision must be either 'ACCEPT' or 'REJECT'", 422);
    }

    const result = await db.approveJobPartQuote(id, partId, dec as 'ACCEPT' | 'REJECT', {
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
