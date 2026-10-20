import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { isDatabaseConnected } from '@/lib/db';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/jobs/[id]/feedback
 * Submits customer star rating (1-5) and feedback review for a completed work order.
 * Dynamically recalculates technician's live average rating and persists to DB.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, feedback } = body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return apiError("'rating' must be a valid number between 1 and 5", 400);
    }

    const job = await db.findOrRecoverJob(id);
    if (!job) {
      return apiError('Job not found', 404);
    }

    job.customerRating = Math.round(numRating);
    if (typeof feedback === 'string' && feedback.trim()) {
      job.customerFeedback = feedback.trim();
    }

    // Dynamically update assigned technician rating
    let updatedTechRating = 5.0;
    if (job.technicianId) {
      const tech = dbStore.technicians.find(
        (t) => t.id === job.technicianId || t.badgeNumber === (job as any).technicianBadge
      );
      if (tech) {
        const prevRating = tech.rating || 5.0;
        const totalJobs = Math.max(1, tech.totalJobsCompleted || 1);
        const calculated = ((prevRating * totalJobs) + numRating) / (totalJobs + 1);
        tech.rating = Math.round(calculated * 10) / 10;
        updatedTechRating = tech.rating;
      }
    }

    // Persist to PostgreSQL if connected
    if (await isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.job.updateMany({
          where: { OR: [{ id: job.id }, { jobTicketNumber: job.jobTicketNumber }] },
          data: {
            customerRating: Math.round(numRating),
            ...(feedback ? { customerFeedback: String(feedback).trim() } : {}),
          },
        });

        if (job.technicianId) {
          await prisma.technician.updateMany({
            where: { id: job.technicianId },
            data: { rating: updatedTechRating },
          });
        }
      } catch (err) {
        console.warn('[FEEDBACK_DB_SYNC_WARN]', err);
      }
    }

    // Broadcast feedback event on Real-Time bus
    realtimeBus.publish({
      type: 'JOB_FEEDBACK_SUBMITTED',
      jobId: job.id,
      ticketNumber: job.jobTicketNumber,
      partnerId: job.partnerId,
      technicianId: job.technicianId,
      customerId: job.customerId,
      status: job.status,
      details: {
        customerRating: numRating,
        customerFeedback: feedback || '',
        updatedTechnicianRating: updatedTechRating,
      },
    });

    return apiSuccess({
      jobId: job.id,
      ticketNumber: job.jobTicketNumber,
      customerRating: numRating,
      customerFeedback: job.customerFeedback || null,
      technicianRating: updatedTechRating,
    }, 'Customer rating and review submitted successfully');

  } catch (error) {
    return apiError(
      'Failed to submit feedback',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
