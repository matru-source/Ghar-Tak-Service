import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || undefined;
    const technicianId = searchParams.get('technicianId') || undefined;
    const invoiceId = searchParams.get('invoiceId') || undefined;
    const ledgerType = searchParams.get('ledgerType') || undefined;
    const search = searchParams.get('search') || undefined;

    const data = await db.getLedgerEntries({
      partnerId,
      technicianId,
      invoiceId,
      ledgerType,
      search,
    });

    return apiSuccess(
      data,
      `Retrieved ${data.ledgerEntries.length} double-entry ledger records. Reconciliation balanced: ${data.telemetry.isDoubleEntryBalanced}`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch financial ledger entries',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
