import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const search = searchParams.get('search') || undefined;
    const ticketId = searchParams.get('ticketId') || undefined;

    // Single ticket detail lookup (for PTNR-SCR-16)
    if (ticketId) {
      const singleTicket = await db.getSupportTicketById(ticketId);
      if (!singleTicket) {
        return NextResponse.json(
          { success: false, error: `Ticket '${ticketId}' not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        ticket: singleTicket,
      });
    }

    const tickets = await db.getAllSupportTickets({
      status,
      priority,
      search,
    });

    const telemetry = await db.getSupportDeskTelemetry();

    return NextResponse.json({
      success: true,
      partnerId: 'ptnr_mah_01',
      stats: {
        totalTickets: telemetry.totalTicketsCount,
        openTicketsCount: telemetry.openCount,
        inProgressCount: telemetry.investigatingCount,
        resolvedCount: telemetry.resolvedCount,
        slaComplianceRatePct: telemetry.slaComplianceRatePct,
      },
      tickets,
    });
  } catch (error) {
    console.error('Failed to fetch partner support tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error fetching support tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      actionType, // 'CREATE_TICKET' | 'ADD_REPLY' | 'RESOLVE'
      ticketId,
      subject,
      description,
      priority,
      category,
      jobTicketNumber,
      resolutionNotes,
      actorId,
    } = body;

    // Resolve an existing ticket
    if (actionType === 'RESOLVE' && ticketId) {
      const resolved = await db.resolveSupportTicket(ticketId, resolutionNotes || 'Resolved by Partner Regional Supervisor');
      if (!resolved) {
        return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      }

      const auditLog = await db.recordWormAuditLog({
        actorId: actorId || 'usr_partner_01',
        actorRole: 'PARTNER',
        action: 'RESOLVE_PARTNER_SUPPORT_TICKET',
        resourceType: 'SUPPORT_TICKET',
        resourceId: resolved.ticketNumber,
        payloadSummary: `Partner resolved ticket ${resolved.ticketNumber}: ${resolutionNotes || 'Closed'}`,
      });

      return NextResponse.json({
        success: true,
        message: `Ticket ${resolved.ticketNumber} resolved successfully`,
        ticket: resolved,
        auditLog: {
          sequenceNumber: auditLog.sequenceNumber,
          currentHash: auditLog.currentHash,
        },
      });
    }

    // Add reply / note to existing ticket
    if (actionType === 'ADD_REPLY' && ticketId) {
      const existing = await db.getSupportTicketById(ticketId);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      }

      const updatedDesc = `${existing.description}\n\n[Partner Update ${new Date().toLocaleTimeString()}]: ${description}`;
      const updated = await db.updateSupportTicket(ticketId, {
        description: updatedDesc,
        status: 'IN_INVESTIGATION',
      });

      const auditLog = await db.recordWormAuditLog({
        actorId: actorId || 'usr_partner_01',
        actorRole: 'PARTNER',
        action: 'PARTNER_SUPPORT_TICKET_INTERVENTION',
        resourceType: 'SUPPORT_TICKET',
        resourceId: existing.ticketNumber,
        payloadSummary: `Partner update on ticket ${existing.ticketNumber}: ${description?.slice(0, 60)}`,
      });

      return NextResponse.json({
        success: true,
        message: `Reply recorded on ticket ${existing.ticketNumber}`,
        ticket: updated,
        auditLog: {
          sequenceNumber: auditLog.sequenceNumber,
          currentHash: auditLog.currentHash,
        },
      });
    }

    // Create new ticket
    if (!subject || !description) {
      return NextResponse.json(
        { success: false, error: 'Subject and description are required to open a support ticket' },
        { status: 400 }
      );
    }

    const newTicket = await db.createSupportTicket({
      subject,
      description,
      priority: priority || 'MEDIUM',
      category: category || 'DISPATCH_DELAY',
      jobTicketNumber,
      customerName: 'Maharashtra Regional Partner Ops',
      customerPhone: '+919876543211',
      assignedTo: 'National Support HQ',
    });

    const auditLog = await db.recordWormAuditLog({
      actorId: actorId || 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'OPEN_PARTNER_SUPPORT_TICKET',
      resourceType: 'SUPPORT_TICKET',
      resourceId: newTicket.ticketNumber,
      payloadSummary: `New ticket ${newTicket.ticketNumber} opened: ${newTicket.subject} [${newTicket.priority}]`,
    });

    return NextResponse.json({
      success: true,
      message: `Support Ticket ${newTicket.ticketNumber} created successfully`,
      ticket: newTicket,
      auditLog: {
        sequenceNumber: auditLog.sequenceNumber,
        currentHash: auditLog.currentHash,
      },
    });
  } catch (error) {
    console.error('Failed to process partner support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error processing support ticket' },
      { status: 500 }
    );
  }
}
