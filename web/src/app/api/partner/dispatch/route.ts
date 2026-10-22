import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';
    const status = searchParams.get('status') || undefined;
    const pincode = searchParams.get('pincode') || undefined;
    const search = searchParams.get('search') || undefined;
    const priority = searchParams.get('priority') || undefined;

    // Fetch live jobs from database (PostgreSQL via db.getJobs)
    const rawJobs = await db.getJobs({
      partnerId: partnerId === 'ALL' ? undefined : partnerId,
      status: status === 'ALL' ? undefined : status,
      pincode: pincode === 'ALL' ? undefined : pincode,
      search,
    });

    let jobs: any[] = rawJobs;
    if (priority && priority !== 'ALL') {
      jobs = jobs.filter((j: any) => j.priority === priority);
    }

    // Live Dispatch Metrics
    const allHubJobs = await db.getJobs({
      partnerId: partnerId === 'ALL' ? undefined : partnerId,
    });

    const unassignedCount = allHubJobs.filter(
      (j: any) => !j.technicianId || j.status === 'PENDING_DISPATCH'
    ).length;
    const inProgressCount = allHubJobs.filter(
      (j: any) => j.status === 'IN_PROGRESS' || j.status === 'SAFETY_CHECKED'
    ).length;
    const escalatedCount = allHubJobs.filter(
      (j: any) => j.status === 'ESCALATED_SLA'
    ).length;
    const completedCount = allHubJobs.filter(
      (j: any) =>
        j.status === 'WORK_COMPLETED' ||
        j.status === 'SETTLED' ||
        j.status === 'COMPLETED'
    ).length;

    // Available standby technicians in hub from database
    const allTechs = await db.getAllTechnicians({
      partnerId: partnerId === 'ALL' ? undefined : partnerId,
      isOnline: true,
    });

    const standbyTechnicians = allTechs.map((t: any) => ({
      id: t.id,
      badgeNumber: t.badgeNumber,
      fullName: t.fullName,
      phone: t.phone,
      rating: t.rating || 4.9,
      isOnline: t.isOnline,
      assignedPincode: t.assignedPincode || '400001',
    }));

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
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authorization Bearer token required' }, { status: 401 });
    }
    const payload = await verifyAccessToken(token);
    if (!payload || (payload.role !== 'PARTNER' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Access denied: PARTNER or SUPER_ADMIN role required' }, { status: 403 });
    }

    const body = await req.json();
    const { jobId, status, technicianId, technicianName } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    // Lookup job in live database
    const currentJob = await db.getJobById(jobId);
    if (!currentJob) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Concurrency Lock: Prevent collision if already claimed by someone else
    if (
      technicianId &&
      currentJob.technicianId &&
      currentJob.technicianId !== technicianId &&
      currentJob.status !== 'PENDING_DISPATCH'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Conflict: Work order #${currentJob.jobTicketNumber} has already been claimed by another technician (${currentJob.technicianName}).`,
          code: 'JOB_ALREADY_CLAIMED',
          currentTechnicianId: currentJob.technicianId,
        },
        { status: 409 }
      );
    }

    let updatedJob: any = currentJob;

    // Execute reassignment in live database if a technician is being assigned
    if (technicianId) {
      try {
        const reassignResult = await db.reassignJobProximity(currentJob.id, {
          targetTechnicianId: technicianId,
          reason: 'Manual partner dispatch assignment via Territory CRM',
          slaExtensionMinutes: 30,
        });
        if (reassignResult?.job) {
          updatedJob = reassignResult.job;
        }
      } catch {
        // Fallback status update
        if (status) {
          updatedJob = await db.updateJobStatus(currentJob.id, status);
        }
      }
    } else if (status) {
      updatedJob = await db.updateJobStatus(currentJob.id, status);
    }

    // Also sync in-memory store for fallback parity
    const memIdx = dbStore.jobs.findIndex((j) => j.id === currentJob.id || j.jobTicketNumber === currentJob.jobTicketNumber);
    if (memIdx !== -1) {
      if (status) dbStore.jobs[memIdx].status = status as any;
      if (technicianId) {
        dbStore.jobs[memIdx].technicianId = technicianId;
        dbStore.jobs[memIdx].technicianName = technicianName || updatedJob.technicianName || 'Assigned Technician';
      }
    }

    await db.recordWormAuditLog({
      actorId: payload.sub,
      actorRole: payload.role,
      action: 'TERRITORY_DISPATCH_UPDATED',
      resourceType: 'JOB_ORDER',
      resourceId: updatedJob.jobTicketNumber,
      payloadSummary: `Territory Hub updated ${updatedJob.jobTicketNumber}: status=${updatedJob.status}, tech=${updatedJob.technicianName || technicianName}`,
    });

    if (technicianId) {
      realtimeBus.publish({
        type: 'TECH_DISPATCHED',
        jobId: updatedJob.id,
        ticketNumber: updatedJob.jobTicketNumber,
        partnerId: updatedJob.partnerId,
        technicianId: updatedJob.technicianId || technicianId,
        customerId: updatedJob.customerId,
        pincode: updatedJob.pincode,
        status: updatedJob.status,
        details: {
          acceptanceTimerSeconds: 60,
          technicianName: updatedJob.technicianName || technicianName,
          payoutShareInr: Math.round((updatedJob.totalAmountInr || 299) * 0.7),
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
