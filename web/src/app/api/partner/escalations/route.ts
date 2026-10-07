import { NextRequest, NextResponse } from 'next/server';
import db, { calculateHaversineDistanceKm } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';

    const escalationsData = await db.getEscalatedJobs({ partnerId });

    // For job J-1005 (or any escalated job), compute sorted candidate technicians by proximity
    const hubTechs = dbStore.technicians.filter((t) => t.partnerId === partnerId);

    // Compute candidate distance from Colaba market (18.9100, 72.8200)
    const targetLat = 18.9100;
    const targetLng = 72.8200;

    const proximityCandidates = hubTechs.map((tech) => {
      const distanceKm = calculateHaversineDistanceKm(
        targetLat,
        targetLng,
        tech.currentLatitude || 18.9200,
        tech.currentLongitude || 72.8300
      );
      const etaMinutes = Math.max(3, Math.round(distanceKm * 3.5));

      return {
        ...tech,
        distanceKm,
        etaMinutes,
        isEligible: tech.isOnline && tech.kycStatus === 'VERIFIED' && tech.insulatedGlovesVerified,
      };
    });

    // Sort by proximity distance ascending
    proximityCandidates.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      escalatedJobs: escalationsData.escalatedJobs,
      atRiskJobs: escalationsData.atRiskJobs,
      escalationEvents: escalationsData.escalationEvents,
      counts: escalationsData.counts,
      proximityCandidates,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch escalation data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, reassignTechnicianId, reason, slaExtensionMinutes } = body;

    if (!jobId || !reassignTechnicianId) {
      return NextResponse.json(
        { success: false, error: 'jobId and reassignTechnicianId are required' },
        { status: 400 }
      );
    }

    const result = await db.reassignJobProximity(jobId, {
      targetTechnicianId: reassignTechnicianId,
      reason: reason || 'Urgent 30-min SLA breach proximity reassignment by Maharashtra Dispatcher',
      slaExtensionMinutes: slaExtensionMinutes || 20,
    });

    await db.recordWormAuditLog({
      actorId: 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'SLA_BREACH_REASSIGNMENT',
      resourceType: 'JOB_ORDER',
      resourceId: result.job.jobTicketNumber,
      payloadSummary: `Emergency proximity reassignment for ${result.job.jobTicketNumber} to ${result.reassignedTechnician.fullName} (${result.proximityDistanceKm} km away). SLA extended +20m.`,
    });

    return NextResponse.json({
      success: true,
      result,
      message: `Job ${result.job.jobTicketNumber} successfully reassigned to ${result.reassignedTechnician.fullName}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reassign job' },
      { status: 500 }
    );
  }
}
