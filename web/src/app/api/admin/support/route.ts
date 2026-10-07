import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const search = searchParams.get('search') || undefined;

    const tickets = await db.getAllSupportTickets({ status, priority, search });
    const telemetry = await db.getSupportDeskTelemetry();

    return NextResponse.json({
      success: true,
      tickets,
      telemetry,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, description, priority, customerId, customerName, customerPhone, technicianId, technicianName, jobId, jobTicketNumber, category, assignedTo } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { success: false, error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    const ticket = await db.createSupportTicket({
      subject,
      description,
      priority: priority || 'MEDIUM',
      customerId,
      customerName,
      customerPhone,
      technicianId,
      technicianName,
      jobId,
      jobTicketNumber,
      category,
      assignedTo,
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: `Support ticket ${ticket.ticketNumber} created successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
