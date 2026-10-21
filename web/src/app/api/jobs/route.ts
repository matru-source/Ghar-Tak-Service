import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
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

// Idempotency cache to protect against rapid double-tapping / network retries
const jobCreationIdempotencyCache = new Map<string, { job: any; timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey =
      request.headers.get('x-idempotency-key') ||
      request.headers.get('idempotency-key');
    const body = await request.json();
    const clientKey = idempotencyKey || body.idempotencyKey;

    if (clientKey && jobCreationIdempotencyCache.has(clientKey)) {
      const cached = jobCreationIdempotencyCache.get(clientKey)!;
      return apiSuccess(
        cached.job,
        `Idempotent request: returning existing work order '${cached.job.jobTicketNumber}'.`,
        200
      );
    }

    const {
      customerId,
      customerName,
      customerPhone,
      technicianId,
      serviceId,
      serviceTitle,
      basePriceInr,
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

    // Check duplicate window (30-second rapid double-tap deduplication)
    const phoneToMatch = customerPhone?.trim() || '';
    const thirtySecondsAgo = Date.now() - 30_000;
    const recentDuplicate = dbStore.jobs.find((j) => {
      const isSameCust = (customerId && j.customerId === customerId) || (phoneToMatch && j.customerPhone === phoneToMatch);
      const isSameService = j.serviceId === serviceId;
      const isSamePin = j.pincode === pincode;
      const createdTime = new Date(j.scheduledAt).getTime();
      return isSameCust && isSameService && isSamePin && createdTime > thirtySecondsAgo && j.status !== 'CANCELLED';
    });

    if (recentDuplicate) {
      if (clientKey) {
        jobCreationIdempotencyCache.set(clientKey, { job: recentDuplicate, timestamp: Date.now() });
      }
      return apiSuccess(
        recentDuplicate,
        `Duplicate booking prevented. Returning active work order '${recentDuplicate.jobTicketNumber}'.`,
        200
      );
    }

    // Generate or use customerId
    const activeCustomerId = customerId || `cust_${Date.now().toString(36)}`;

    const newJob = await db.createJob({
      customerId: activeCustomerId,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      technicianId: technicianId || undefined,
      serviceId,
      serviceTitle: serviceTitle || undefined,
      basePriceInr: typeof basePriceInr === 'number' ? basePriceInr : undefined,
      pincode,
      customerAddressText: customerAddressText.trim(),
      customerLatitude: typeof customerLatitude === 'number' ? customerLatitude : undefined,
      customerLongitude: typeof customerLongitude === 'number' ? customerLongitude : undefined,
      priority,
      scheduledAt,
    });

    if (clientKey) {
      jobCreationIdempotencyCache.set(clientKey, { job: newJob, timestamp: Date.now() });
    }

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
        customerName: newJob.customerName,
        customerPhone: newJob.customerPhone,
        pincode: newJob.pincode,
        customerLatitude: newJob.customerLatitude,
        customerLongitude: newJob.customerLongitude,
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
          serviceTitle: newJob.serviceTitle,
          totalAmountInr: newJob.totalAmountInr,
          customerName: newJob.customerName,
          customerPhone: newJob.customerPhone,
          customerAddress: newJob.customerAddressText,
          pincode: newJob.pincode,
          customerLatitude: newJob.customerLatitude,
          customerLongitude: newJob.customerLongitude,
          handoverOtp: newJob.handoverOtp,
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
