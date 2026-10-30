import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/jobs/[id]/feedback
 * Submits customer star rating (1-5) and feedback review for a completed work order.
 * Delegates to centralized db.submitJobRating and recalculates live technician rating.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { rating, feedback, feedbackTags, signature, isSignatureAdopted } = body;

    const numRating = Number(rating ?? body.customerRating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return apiError("'rating' must be a valid number between 1 and 5", 400);
    }

    const result = await db.submitJobRating(id, {
      rating: numRating,
      feedback: typeof feedback === 'string' ? feedback : undefined,
      feedbackTags: Array.isArray(feedbackTags) ? feedbackTags : undefined,
      signature: typeof signature === 'string' ? signature : undefined,
      isSignatureAdopted: Boolean(isSignatureAdopted),
      actorId: body.customerId,
      actorRole: 'CUSTOMER',
    });

    return apiSuccess({
      jobId: result.job.id,
      ticketNumber: result.job.jobTicketNumber,
      customerRating: result.customerRating,
      customerFeedback: result.customerFeedback,
      technicianRating: result.technicianRating,
      disputeTicket: result.disputeTicket ? {
        id: result.disputeTicket.id,
        ticketNumber: result.disputeTicket.ticketNumber,
        assignedTo: result.disputeTicket.assignedTo,
        status: result.disputeTicket.status,
      } : null,
    }, 'Customer rating and review submitted successfully');
  } catch (error) {
    return apiError(
      'Failed to submit feedback',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
