import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;
    const technicianId = searchParams.get('technicianId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const jobs = await db.getJobs({
      pincode,
      partnerId,
      technicianId,
      customerId,
      status,
      search,
    });

    // Compute telemetry counts for dashboard widgets
    const counts = {
      total: jobs.length,
      pendingDispatch: jobs.filter((j) => j.status === 'PENDING_DISPATCH').length,
      assigned: jobs.filter((j) => j.status === 'ASSIGNED').length,
      enRoute: jobs.filter((j) => j.status === 'EN_ROUTE').length,
      arrived: jobs.filter((j) => j.status === 'ARRIVED').length,
      inProgress: jobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'SAFETY_CHECKED').length,
      completed: jobs.filter((j) => j.status === 'WORK_COMPLETED' || j.status === 'SETTLED').length,
      escalatedSla: jobs.filter((j) => j.status === 'ESCALATED_SLA').length,
    };

    return apiSuccess({
      jobs,
      counts,
      queryFilters: { pincode, partnerId, technicianId, customerId, status },
    }, `Retrieved ${jobs.length} jobs successfully`);
  } catch (error) {
    return apiError('Failed to fetch jobs list', 500, error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      serviceId,
      pincode,
      customerAddressText,
      customerLatitude,
      customerLongitude,
      priority,
      scheduledAt,
    } = body;

    if (!serviceId) {
      return apiError("'serviceId' is required", 400);
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return apiError("'pincode' must be a valid 6-digit Indian postal code", 400);
    }
    if (!customerAddressText || customerAddressText.trim().length < 5) {
      return apiError("'customerAddressText' must contain a detailed address", 400);
    }

    // Default to mock customer if not passed
    const activeCustomerId = customerId || 'cust_amit_01';

    const newJob = await db.createJob({
      customerId: activeCustomerId,
      serviceId,
      pincode,
      customerAddressText: customerAddressText.trim(),
      customerLatitude: typeof customerLatitude === 'number' ? customerLatitude : undefined,
      customerLongitude: typeof customerLongitude === 'number' ? customerLongitude : undefined,
      priority,
      scheduledAt,
    });

    const dispatchNote = newJob.technicianId
      ? `Assigned to verified technician '${newJob.technicianName}' with sub-30-minute SLA.`
      : 'No standby technician currently online in pincode; queued in PENDING_DISPATCH.';

    // Broadcast Real-Time Lifecycle Events
    realtimeBus.publish({
      type: 'JOB_CREATED',
      jobId: newJob.id,
      ticketNumber: newJob.jobTicketNumber,
      partnerId: newJob.partnerId,
      technicianId: newJob.technicianId,
      customerId: newJob.customerId,
      pincode: newJob.pincode,
      status: newJob.status,
      details: {
        serviceTitle: newJob.serviceTitle,
        totalAmountInr: newJob.totalAmountInr,
        priority: newJob.priority,
        technicianName: newJob.technicianName,
        customerAddress: newJob.customerAddressText,
      },
    });

    if (newJob.technicianId) {
      realtimeBus.publish({
        type: 'TECH_DISPATCHED',
        jobId: newJob.id,
        ticketNumber: newJob.jobTicketNumber,
        partnerId: newJob.partnerId,
        technicianId: newJob.technicianId,
        pincode: newJob.pincode,
        status: 'ASSIGNED',
        details: {
          acceptanceTimerSeconds: 60,
          technicianName: newJob.technicianName,
          payoutShareInr: Math.round(newJob.totalAmountInr * 0.7),
        },
      });
    }

    return apiSuccess(
      newJob,
      `Work order '${newJob.jobTicketNumber}' created successfully. ${dispatchNote}`,
      201
    );
  } catch (error) {
    return apiError('Failed to create job booking', 400, error instanceof Error ? error.message : String(error));
  }
}
