import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';
    const status = searchParams.get('status') || undefined;
    const pincode = searchParams.get('pincode') || undefined;
    const search = searchParams.get('search') || undefined;
    const priority = searchParams.get('priority') || undefined;

    const isMatchingPartner = (jPartnerId: string, targetId: string) => {
      if (targetId === 'ALL') return true;
      if (jPartnerId === targetId) return true;
      const cleanJ = (jPartnerId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanT = (targetId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanJ.includes('mah') || cleanJ.includes('mumbai')) {
        return cleanT.includes('mah') || cleanT.includes('mumbai');
      }
      if (cleanJ.includes('odisha') || cleanJ.includes('puri') || cleanJ.includes('bbsr')) {
        return cleanT.includes('odisha') || cleanT.includes('puri') || cleanT.includes('bbsr');
      }
      return cleanJ === cleanT;
    };

    let jobs = dbStore.jobs.filter((j) => isMatchingPartner(j.partnerId, partnerId));

    if (status && status !== 'ALL') {
      jobs = jobs.filter((j) => j.status === status);
    }
    if (pincode && pincode !== 'ALL') {
      jobs = jobs.filter((j) => j.pincode === pincode);
    }
    if (priority && priority !== 'ALL') {
      jobs = jobs.filter((j) => j.priority === priority);
    }
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.jobTicketNumber.toLowerCase().includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.serviceTitle.toLowerCase().includes(q) ||
          j.pincode.includes(q) ||
          (j.technicianName && j.technicianName.toLowerCase().includes(q))
      );
    }

    // Dispatch metrics
    const allHubJobs = dbStore.jobs.filter((j) => isMatchingPartner(j.partnerId, partnerId));
    const unassignedCount = allHubJobs.filter((j) => !j.technicianId || j.status === 'PENDING_DISPATCH').length;
    const inProgressCount = allHubJobs.filter((j) => j.status === 'IN_PROGRESS').length;
    const escalatedCount = allHubJobs.filter((j) => j.status === 'ESCALATED_SLA').length;
    const completedCount = allHubJobs.filter((j) => j.status === 'WORK_COMPLETED' || j.status === 'SETTLED').length;

    // Available standby technicians in hub
    const standbyTechnicians = dbStore.technicians.filter((t) => isMatchingPartner(t.partnerId, partnerId) && t.isOnline);

    return NextResponse.json({
      success: true,
      jobs,
      metrics: {
        totalTerritoryJobs: allHubJobs.length,
        unassignedCount,
        inProgressCount,
        escalatedCount,
        completedCount,
        onlineStandbyCount: standbyTechnicians.length,
      },
      standbyTechnicians,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dispatch queue' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, status, technicianId, technicianName } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    const jobIndex = dbStore.jobs.findIndex((j) => j.id === jobId || j.jobTicketNumber === jobId);
    if (jobIndex === -1) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (status) {
      dbStore.jobs[jobIndex].status = status;
    }
    if (technicianId) {
      dbStore.jobs[jobIndex].technicianId = technicianId;
      dbStore.jobs[jobIndex].technicianName = technicianName || 'Assigned Technician';
    }

    const updatedJob = dbStore.jobs[jobIndex];

    await db.recordWormAuditLog({
      actorId: 'usr_partner_01',
      actorRole: 'PARTNER',
      action: 'TERRITORY_DISPATCH_UPDATED',
      resourceType: 'JOB_ORDER',
      resourceId: updatedJob.jobTicketNumber,
      payloadSummary: `Maharashtra Hub updated ${updatedJob.jobTicketNumber}: status=${updatedJob.status}, tech=${updatedJob.technicianName}`,
    });

    if (technicianId) {
      realtimeBus.publish({
        type: 'TECH_DISPATCHED',
        jobId: updatedJob.id,
        ticketNumber: updatedJob.jobTicketNumber,
        partnerId: updatedJob.partnerId,
        technicianId: updatedJob.technicianId,
        customerId: updatedJob.customerId,
        pincode: updatedJob.pincode,
        status: updatedJob.status,
        details: {
          acceptanceTimerSeconds: 60,
          technicianName: updatedJob.technicianName,
          payoutShareInr: Math.round(updatedJob.totalAmountInr * 0.7),
          serviceTitle: updatedJob.serviceTitle,
          totalAmountInr: updatedJob.totalAmountInr,
          customerName: updatedJob.customerName,
          customerPhone: updatedJob.customerPhone,
          customerAddress: updatedJob.customerAddressText,
        },
      });
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: `Job ${updatedJob.jobTicketNumber} dispatch state updated`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update dispatch state' },
      { status: 500 }
    );
  }
}
