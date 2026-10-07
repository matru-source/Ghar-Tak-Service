import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ technicianId: string }> }
) {
  try {
    const { technicianId } = await params;
    const wallet = await db.getTechnicianWallet(technicianId);

    return apiSuccess(
      wallet,
      `Retrieved wallet for technician '${wallet.technician.fullName}' (${wallet.technician.badgeNumber}). Balance: ₹${wallet.wallet.withdrawableBalanceInr}`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch technician wallet',
      404,
      error instanceof Error ? error.message : String(error)
    );
  }
}
