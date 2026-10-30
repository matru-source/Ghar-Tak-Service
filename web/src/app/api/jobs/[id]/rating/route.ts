import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/jobs/[id]/rating
 * Persists customer 1-5 star rating, feedback tags/review, and digital signoff.
 * Recalculates technician live rating in DB and notifies partner/admin portals via SSE.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const ratingVal = body.rating ?? body.customerRating ?? body.stars;
    if (ratingVal === undefined || ratingVal === null) {
      return apiError("'rating' is required (1-5)", 400);
    }

    const result = await db.submitJobRating(id, {
      rating: Number(ratingVal),
      feedback: body.feedback ?? body.customerFeedback ?? body.review,
      feedbackTags: body.feedbackTags,
      signature: body.signature,
      isSignatureAdopted: body.isSignatureAdopted,
      actorId: body.customerId,
      actorRole: 'CUSTOMER',
    });

    return apiSuccess(
      {
        jobId: result.job.id,
        ticketNumber: result.job.jobTicketNumber,
        customerRating: result.customerRating,
        customerFeedback: result.customerFeedback,
        technicianRating: result.technicianRating,
        disputeTicket: result.disputeTicket
          ? {
              id: result.disputeTicket.id,
              ticketNumber: result.disputeTicket.ticketNumber,
              status: result.disputeTicket.status,
            }
          : null,
      },
      `Job #${result.job.jobTicketNumber} rated ${result.customerRating}★ successfully. Technician rating updated to ${result.technicianRating}★.`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to submit job rating',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}

