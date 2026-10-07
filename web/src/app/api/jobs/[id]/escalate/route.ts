import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { trigger, reason } = body;

    const validTriggers = [
      'SLA_BREACH_TIMER',
      'TECHNICIAN_REJECTION',
      'MANUAL_DISPATCHER_OVERRIDE',
      'CUSTOMER_COMPLAINT',
    ];

    const activeTrigger = validTriggers.includes(trigger) ? trigger : 'MANUAL_DISPATCHER_OVERRIDE';
    const activeReason = reason && reason.trim().length > 0 ? reason.trim() : 'Manual SLA escalation triggered by dispatch operator';

    const result = await db.escalateJobSla(id, activeTrigger, activeReason);

    return apiSuccess(
      result,
      `Job '${result.job.jobTicketNumber}' escalated to ESCALATED_SLA. Critical emergency support ticket '${result.supportTicketNumber}' generated.`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to escalate job SLA',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
