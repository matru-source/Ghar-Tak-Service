import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params;
    const summary = await db.getPartnerAccountingSummary(partnerId);

    return apiSuccess(
      summary,
      `Retrieved accounting statement for franchise partner '${summary.partner.entityName}'. Gross Billing: ₹${summary.accounting.grossBillingVolumeInr}, Commission: ₹${summary.accounting.partnerCommissionEarnedInr}`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch partner accounting summary',
      404,
      error instanceof Error ? error.message : String(error)
    );
  }
}
