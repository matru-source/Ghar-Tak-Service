import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { dbStore } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';

    // Get partner entity
    const partner = (dbStore.partners || [dbStore.partner]).find((p) => p.id === partnerId) || dbStore.partner;

    // Filter technicians belonging to this partner
    const hubTechnicians = dbStore.technicians.filter((t) => t.partnerId === partner.id);
    const onlineTechnicians = hubTechnicians.filter((t) => t.isOnline);

    // Filter jobs belonging to this partner
    const hubJobs = dbStore.jobs.filter((j) => j.partnerId === partner.id);
    const activeJobs = hubJobs.filter((j) => ['BOOKED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'ESCALATED_SLA'].includes(j.status));
    const escalatedJobs = hubJobs.filter((j) => j.status === 'ESCALATED_SLA');

    // Filter invoices & ledger
    const hubInvoices = dbStore.invoices.filter((i) => i.partnerId === partner.id);
    const hubLedgers = dbStore.ledgerEntries.filter((l) => l.partnerId === partner.id);

    // Partner earned share from ledgers
    const totalPartnerShareEarnedInr = hubLedgers
      .filter((l) => l.ledgerType === 'PARTNER_COMMISSION')
      .reduce((sum, l) => sum + l.amountInr, 0);

    // Territory pincodes
    const hubPincodes = dbStore.pincodes.filter((p) => p.partnerId === partner.id);

    const telemetry = {
      partner,
      kpis: {
        totalActiveJobs: activeJobs.length,
        escalatedJobsCount: escalatedJobs.length,
        totalFleetCount: hubTechnicians.length,
        onlineFleetCount: onlineTechnicians.length,
        averageResponseTimeMinutes: 11.4,
        slaComplianceRatePct: 98.2,
        partnerCommissionRatePct: partner.partnerRevenueSharePct || 15.0,
        totalPartnerShareEarnedInr: Math.round(totalPartnerShareEarnedInr * 100) / 100,
        activePincodesCount: hubPincodes.length,
        maxPincodeQuota: partner.maxPincodeQuota || 50,
      },
      activeJobs,
      onlineTechnicians,
      allHubTechnicians: hubTechnicians,
      hubPincodes,
      recentLedgers: hubLedgers.slice(0, 5),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      telemetry,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch partner telemetry' },
      { status: 500 }
    );
  }
}
