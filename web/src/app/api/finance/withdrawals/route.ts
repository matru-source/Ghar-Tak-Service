import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get('technicianId') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;
    const status = searchParams.get('status') || undefined;

    const withdrawals = await db.getWithdrawals({
      technicianId,
      partnerId,
      status,
    });

    return apiSuccess(
      { withdrawals, count: withdrawals.length },
      `Retrieved ${withdrawals.length} withdrawal requests`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch withdrawal requests',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      technicianId,
      amountInr,
      payoutMethod,
      upiId,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
    } = body;

    const MIN_WITHDRAWAL_THRESHOLD_INR = 500;
    const requestedAmount = Number(amountInr);

    if (!technicianId || isNaN(requestedAmount) || requestedAmount <= 0) {
      return apiError('technicianId and valid numeric amountInr are required', 400);
    }

    if (requestedAmount < MIN_WITHDRAWAL_THRESHOLD_INR) {
      return apiError(
        `Banking Regulation Interlock: Minimum withdrawal threshold is ₹${MIN_WITHDRAWAL_THRESHOLD_INR}.00. Requested: ₹${requestedAmount.toFixed(2)}. Micro-transactions below ₹${MIN_WITHDRAWAL_THRESHOLD_INR} are blocked to prevent gateway fee depletion.`,
        400
      );
    }

    if (!payoutMethod || (payoutMethod !== 'UPI' && payoutMethod !== 'BANK_ACCOUNT')) {
      return apiError('Valid payoutMethod (UPI or BANK_ACCOUNT) is required', 400);
    }

    if (payoutMethod === 'UPI' && (!upiId || !upiId.trim())) {
      return apiError('Valid upiId is required for UPI payout', 400);
    }

    if (payoutMethod === 'BANK_ACCOUNT') {
      if (!accountNumber || !ifscCode || !accountHolderName) {
        return apiError('accountHolderName, accountNumber, and ifscCode are required for Bank transfer', 400);
      }
    }

    const withdrawal = await db.createWithdrawalRequest({
      technicianId,
      amountInr: Number(amountInr),
      payoutMethod,
      upiId: upiId?.trim(),
      accountHolderName: accountHolderName?.trim(),
      accountNumber: accountNumber?.trim(),
      ifscCode: ifscCode?.trim(),
      bankName: bankName?.trim(),
    });

    realtimeBus.publish({
      type: 'WITHDRAWAL_REQUESTED',
      technicianId,
      partnerId: (withdrawal as any).partnerId || 'ptnr_mah_01',
      details: {
        amountInr: Number(amountInr),
        payoutMethod,
        withdrawalId: withdrawal.id,
      },
    });

    return apiSuccess(
      withdrawal,
      `Withdrawal request of ₹${amountInr} submitted successfully. Awaiting franchise partner settlement.`,
      201
    );
  } catch (error) {
    return apiError(
      'Failed to create withdrawal request',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
