import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await db.getSupportTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Support ticket not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === 'RESOLVE') {
      const resolved = await db.resolveSupportTicket(id, body.resolutionNotes || 'Resolved by Support Engineer');
      if (!resolved) {
        return NextResponse.json({ success: false, error: 'Support ticket not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        ticket: resolved,
        message: `Support ticket ${resolved.ticketNumber} marked as RESOLVED`,
      });
    }

    const updated = await db.updateSupportTicket(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Support ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: updated,
      message: `Support ticket ${updated.ticketNumber} updated`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
