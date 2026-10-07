import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || undefined;
    const paymentStatus = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const invoices = await db.getInvoices({
      partnerId,
      paymentStatus,
      search,
    });

    const totalInvoiceAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalGstAmount = invoices.reduce((sum, i) => sum + (i.cgstAmount + i.sgstAmount), 0);
    const paidCount = invoices.filter((i) => i.paymentStatus === 'PAID').length;

    return apiSuccess(
      {
        invoices,
        metrics: {
          totalCount: invoices.length,
          paidCount,
          totalInvoiceAmount,
          totalGstAmount,
        },
      },
      'Tax invoices retrieved successfully'
    );
  } catch (error) {
    return apiError(
      'Failed to retrieve tax invoices',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
