import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, jobId, paymentMethod, transactionRef } = body;

    const identifier = invoiceId || jobId;
    if (!identifier) {
      return apiError("Either 'invoiceId' or 'jobId' is required for commission distribution", 400);
    }

    const result = await db.distributeJobCommissions(identifier, {
      paymentMethod,
      transactionRef,
    });

    return apiSuccess(
      result,
      `Commission split & double-entry posting completed for invoice '${result.invoice.invoiceNumber}'. Total ₹${result.invoice.totalAmount} (Platform: ₹${result.splitSummary.platformFeeInr}, Partner: ₹${result.splitSummary.partnerCommissionInr}, Tech: ₹${result.splitSummary.technicianPayoutInr}, GST: ₹${result.splitSummary.gstReserveInr})`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to distribute commissions',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
