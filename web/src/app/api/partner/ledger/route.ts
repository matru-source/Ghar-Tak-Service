import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';
    const ledgerType = searchParams.get('ledgerType') || undefined;
    const search = searchParams.get('search') || undefined;

    const entries = await db.getPartnerLedger({
      partnerId,
      ledgerType,
      search,
    });

    // Compute financial stat summaries
    const customerPayments = entries
      .filter((e) => e.ledgerType === 'CUSTOMER_PAYMENT' && e.entryDirection === 'CREDIT')
      .reduce((acc, e) => acc + e.amountInr, 0);

    const partnerCommissions = entries
      .filter((e) => e.ledgerType === 'PARTNER_COMMISSION')
      .reduce((acc, e) => acc + e.amountInr, 0);

    const techPayouts = entries
      .filter((e) => e.ledgerType === 'TECHNICIAN_PAYOUT')
      .reduce((acc, e) => acc + e.amountInr, 0);

    const gstEscrows = entries
      .filter((e) => e.ledgerType === 'GST_RESERVE_18')
      .reduce((acc, e) => acc + e.amountInr, 0);

    return NextResponse.json({
      success: true,
      partnerId,
      stats: {
        totalTransactionsCount: entries.length,
        grossInflowInr: Math.round(customerPayments * 100) / 100,
        partnerCommissionInr: Math.round(partnerCommissions * 100) / 100,
        technicianPayoutsInr: Math.round(techPayouts * 100) / 100,
        gstStatutoryReserveInr: Math.round(gstEscrows * 100) / 100,
        pendingSettlementInr: 85000.0,
        nextSettlementCycleDate: '28 Oct 2026',
      },
      entries,
    });
  } catch (error) {
    console.error('Failed to fetch partner ledger entries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error fetching ledger' },
      { status: 500 }
    );
  }
}
