import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { isDatabaseConnected } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const search = searchParams.get('search') || undefined;

    // Filter tickets related to customer rating disputes or low-star escalations
    let tickets = dbStore.supportTickets.filter(
      (t) =>
        t.category === 'POOR_RATING_DISPUTE' ||
        t.category === 'CUSTOMER_RATING_DISPUTE' ||
        t.subject.toLowerCase().includes('dispute') ||
        t.subject.toLowerCase().includes('star') ||
        t.priority === 'CRITICAL_EMERGENCY'
    );

    if (status && status !== 'ALL') {
      tickets = tickets.filter((t) => t.status === status);
    }
    if (priority && priority !== 'ALL') {
      tickets = tickets.filter((t) => t.priority === priority);
    }
    if (search) {
      const q = search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          (t.jobTicketNumber && t.jobTicketNumber.toLowerCase().includes(q)) ||
          (t.technicianName && t.technicianName.toLowerCase().includes(q))
      );
    }

    // Enrich tickets with job & rating details
    const enrichedTickets = tickets.map((t) => {
      const matchedJob = t.jobId
        ? dbStore.jobs.find((j) => j.id === t.jobId || j.jobTicketNumber === t.jobTicketNumber)
        : null;
      return {
        ...t,
        customerRating: matchedJob?.customerRating ?? (t.subject.includes('1-Star') ? 1 : t.subject.includes('2-Star') ? 2 : 1),
        customerFeedback: matchedJob?.customerFeedback || '',
        jobTotalAmount: (matchedJob as any)?.totalAmountInr ?? (matchedJob as any)?.totalAmount ?? 0,
        jobServiceCategory: (matchedJob as any)?.serviceCategory ?? (matchedJob as any)?.serviceTitle ?? 'ELECTRICAL_REPAIR',
        partnerId: matchedJob?.partnerId || null,
      };
    });

    const allDisputeTickets = dbStore.supportTickets.filter(
      (t) =>
        t.category === 'POOR_RATING_DISPUTE' ||
        t.category === 'CUSTOMER_RATING_DISPUTE' ||
        t.subject.toLowerCase().includes('dispute')
    );

    const openCount = allDisputeTickets.filter((t) => t.status === 'OPEN').length;
    const investigatingCount = allDisputeTickets.filter((t) => t.status === 'IN_INVESTIGATION').length;
    const resolvedCount = allDisputeTickets.filter((t) => t.status === 'RESOLVED').length;
    const criticalCount = allDisputeTickets.filter((t) => t.priority === 'CRITICAL_EMERGENCY').length;

    return NextResponse.json({
      success: true,
      disputes: enrichedTickets,
      telemetry: {
        totalDisputes: allDisputeTickets.length,
        openCount,
        investigatingCount,
        resolvedCount,
        criticalCount,
        slaComplianceRatePct: allDisputeTickets.length > 0 ? Math.round((resolvedCount / allDisputeTickets.length) * 100) : 100,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dispute tickets' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, action, assignedTo, resolutionNotes, compensationAmount } = body;

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'ticketId is required' }, { status: 400 });
    }

    const ticketIdx = dbStore.supportTickets.findIndex(
      (t) => t.id === ticketId || t.ticketNumber === ticketId
    );
    if (ticketIdx === -1) {
      return NextResponse.json({ success: false, error: 'Dispute ticket not found' }, { status: 404 });
    }

    const ticket = dbStore.supportTickets[ticketIdx];

    if (action === 'ASSIGN') {
      ticket.assignedTo = assignedTo || 'Franchise Operations Manager';
      ticket.status = 'IN_INVESTIGATION';
      ticket.updatedAt = new Date().toISOString();

      await db.recordWormAuditLog({
        actorId: 'usr_admin_01',
        actorRole: 'SUPER_ADMIN',
        action: 'DISPUTE_ASSIGNED_TO_FRANCHISE_MANAGER',
        resourceType: 'SUPPORT_TICKET',
        resourceId: ticket.ticketNumber,
        payloadSummary: `Dispute ticket ${ticket.ticketNumber} assigned to ${ticket.assignedTo}`,
      });
    } else if (action === 'RESOLVE') {
      ticket.status = 'RESOLVED';
      ticket.resolutionNotes = resolutionNotes || 'Resolved after customer outreach and franchise quality review.';
      (ticket as any).resolvedAt = new Date().toISOString();
      if (compensationAmount && Number(compensationAmount) > 0) {
        (ticket as any).compensationAmount = Number(compensationAmount);
      }
      ticket.updatedAt = new Date().toISOString();

      await db.recordWormAuditLog({
        actorId: 'usr_admin_01',
        actorRole: 'SUPER_ADMIN',
        action: 'DISPUTE_RESOLVED',
        resourceType: 'SUPPORT_TICKET',
        resourceId: ticket.ticketNumber,
        payloadSummary: `Dispute ${ticket.ticketNumber} marked as RESOLVED. Notes: ${ticket.resolutionNotes}`,
      });
    } else {
      // General update
      Object.assign(ticket, body, { updatedAt: new Date().toISOString() });
    }

    // Persist to Prisma if connected
    if (await isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.supportTicket.updateMany({
          where: { OR: [{ id: ticket.id }, { ticketNumber: ticket.ticketNumber }] },
          data: {
            status: ticket.status as any,
            ...(ticket.resolutionNotes ? { resolutionSummary: ticket.resolutionNotes } : {}),
          },
        });
      } catch (dbErr) {
        console.warn('[DISPUTES_PRISMA_SYNC_WARN]', dbErr);
      }
    }

    // Broadcast dispute resolved/updated
    realtimeBus.publish({
      type: 'DISPUTE_TICKET_UPDATED',
      ticketNumber: ticket.ticketNumber,
      jobId: ticket.jobId,
      status: ticket.status,
      details: {
        assignedTo: ticket.assignedTo,
        resolutionNotes: ticket.resolutionNotes,
        status: ticket.status,
      },
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: `Dispute ticket ${ticket.ticketNumber} updated successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update dispute ticket' },
      { status: 500 }
    );
  }
}
