import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
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
    const { action, utrNumber, message, rejectionReason } = body;

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return apiError("Valid action ('APPROVE' or 'REJECT') is required", 400);
    }

    const updated = await db.processWithdrawalAction(id, action, {
      utrNumber,
      message,
      rejectionReason,
    });

    realtimeBus.publish({
      type: action === 'APPROVE' ? 'WITHDRAWAL_APPROVED' : 'PAYOUT_TRANSFERRED',
      technicianId: (updated as any).technicianId,
      partnerId: (updated as any).partnerId || 'ptnr_mah_01',
      details: {
        withdrawalId: id,
        action,
        amountInr: (updated as any).amountInr,
        utrNumber,
      },
    });

    const statusMsg = action === 'APPROVE'
      ? `Withdrawal ${id} approved and marked PAID. UTR: ${updated.utrNumber}`
      : `Withdrawal ${id} rejected. Reason: ${updated.rejectionReason}`;

    return apiSuccess(updated, statusMsg);
  } catch (error) {
    return apiError(
      'Failed to process withdrawal action',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
