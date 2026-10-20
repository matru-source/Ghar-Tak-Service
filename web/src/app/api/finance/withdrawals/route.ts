import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

    if (!technicianId || !amountInr || amountInr <= 0) {
      return apiError('technicianId and valid amountInr (> 0) are required', 400);
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
