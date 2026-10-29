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

    // Issue 40: Automated Dispute Ticket Creation for poor ratings (< 3 stars)
    let disputeTicket = null;
    if (numRating < 3) {
      disputeTicket = await db.createSupportTicket({
        subject: `🚨 Urgent ${numRating}-Star Dispute: Job #${job.jobTicketNumber}`,
        description: `Customer ${job.customerName || 'Customer'} rated ${numRating} star(s) with feedback: "${feedback || 'No written feedback provided'}". Immediate franchise manager intervention and customer outreach required.`,
        priority: 'CRITICAL_EMERGENCY',
        category: 'POOR_RATING_DISPUTE',
        assignedTo: 'Franchise Operations Manager',
        jobId: job.id,
        jobTicketNumber: job.jobTicketNumber,
        customerId: job.customerId,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        technicianId: job.technicianId,
        technicianName: job.technicianName,
      });

      // Also record WORM audit log
      await db.recordWormAuditLog({
        actorId: job.customerId || 'usr_customer_web',
        actorRole: 'CUSTOMER',
        action: 'LOW_RATING_DISPUTE_ESCALATED',
        resourceType: 'SUPPORT_TICKET',
        resourceId: disputeTicket.ticketNumber,
        payloadSummary: `Automated low-rating dispute ticket ${disputeTicket.ticketNumber} created for Job #${job.jobTicketNumber} (${numRating}★)`,
      });

      // Broadcast dispute ticket creation on realtime bus
      realtimeBus.publish({
        type: 'DISPUTE_TICKET_CREATED',
        jobId: job.id,
        ticketNumber: job.jobTicketNumber,
        partnerId: job.partnerId,
        technicianId: job.technicianId,
        customerId: job.customerId,
        status: job.status,
        details: {
          disputeTicketId: disputeTicket.id,
          disputeTicketNumber: disputeTicket.ticketNumber,
          customerRating: numRating,
          customerFeedback: feedback || '',
          assignedTo: disputeTicket.assignedTo,
          priority: disputeTicket.priority,
        },
      });

      // If database is connected, also persist to Prisma SupportTicket table
      if (await isDatabaseConnected()) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const customerUser = await prisma.user.findFirst({
            where: { OR: [{ id: job.customerId }, { phone: job.customerPhone }] },
            select: { id: true },
          });
          const requesterId = customerUser?.id || (await prisma.user.findFirst({ select: { id: true } }))?.id;
          if (requesterId) {
            await prisma.supportTicket.create({
              data: {
                ticketNumber: disputeTicket.ticketNumber,
                requesterUserId: requesterId,
                jobId: job.id,
                partnerId: job.partnerId,
                subject: disputeTicket.subject,
                priority: 'CRITICAL_EMERGENCY',
                status: 'OPEN',
                description: disputeTicket.description,
              },
            });
          }
        } catch (dbErr) {
          console.warn('[FEEDBACK_PRISMA_TICKET_SYNC_WARN]', dbErr);
        }
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
        disputeTicket: disputeTicket ? {
          id: disputeTicket.id,
          ticketNumber: disputeTicket.ticketNumber,
          assignedTo: disputeTicket.assignedTo,
        } : null,
      },
    });

    return apiSuccess({
      jobId: job.id,
      ticketNumber: job.jobTicketNumber,
      customerRating: numRating,
      customerFeedback: job.customerFeedback || null,
      technicianRating: updatedTechRating,
      disputeTicket: disputeTicket ? {
        id: disputeTicket.id,
        ticketNumber: disputeTicket.ticketNumber,
        assignedTo: disputeTicket.assignedTo,
        status: disputeTicket.status,
      } : null,
    }, 'Customer rating and review submitted successfully');

  } catch (error) {
    return apiError(
      'Failed to submit feedback',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
