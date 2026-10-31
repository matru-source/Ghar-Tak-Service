import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { assertAuth } from '@/lib/auth-guard';
import { sendHighPriorityDispatchSiren, broadcastDispatchSirenToPincodeFleet } from '@/lib/fcm-dispatcher';


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
    const unassigned = searchParams.get('unassigned') === 'true' ? true : undefined;
    const includeUnassigned = searchParams.get('includeUnassigned') === 'true' || (technicianId ? true : undefined);

    const jobs = await db.getJobs({
      pincode,
      partnerId,
      technicianId,
      customerId,
      status,
      search,
      unassigned,
      includeUnassigned,
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
    // Enforce Issue 2: Customer Authentication Gate (prohibit orphan guest bookings)
    const auth = await assertAuth(request, ['CUSTOMER', 'SUPER_ADMIN']);
    const body = await request.json();
    let activeCustomerId: string | null = null;
    let verifiedCustomerName = body.customerName;
    let verifiedCustomerPhone = body.customerPhone;

    if (auth.ok) {
      activeCustomerId = auth.context.userId;
      const user = await db.getUserById(auth.context.userId);
      if (user) {
        verifiedCustomerName = verifiedCustomerName || user.fullName;
        verifiedCustomerPhone = verifiedCustomerPhone || user.phone;
      }
    } else {
      // If token not provided in Authorization header, check if customerPhone belongs to an existing verified user
      if (body.customerPhone) {
        const existingUser = await db.getUserByPhone(body.customerPhone);
        if (existingUser && existingUser.isVerified) {
          activeCustomerId = existingUser.id;
          verifiedCustomerName = verifiedCustomerName || existingUser.fullName;
        }
      }
      if (!activeCustomerId && body.customerId) {
        const userById = await db.getUserById(body.customerId);
        if (userById && userById.isVerified) {
          activeCustomerId = userById.id;
        }
      }
    }

    if (!activeCustomerId) {
      return apiError(
        'Authentication Required: Unauthenticated guest bookings are prohibited. Please log in with a verified mobile number before placing a booking.',
        401
      );
    }

    const idempotencyKey =
      request.headers.get('x-idempotency-key') ||
      request.headers.get('idempotency-key');
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
      customerLatitude,
      customerLongitude,
      priority,
      scheduledAt,
    } = body;

    // Robust Parameter Aliasing & Normalization for Address Contracts
    let rawAddress =
      body.customerAddressText ||
      body.addressText ||
      body.address ||
      body.customerAddress ||
      body.fullAddress ||
      body.premiseAddress ||
      body.serviceAddress ||
      body.locationAddress ||
      body.addressLine ||
      '';

    let customerAddressText = String(rawAddress).trim();

    // If empty or less than 5 characters, attempt fallback to customer's saved default address
    if ((!customerAddressText || customerAddressText.length < 5) && activeCustomerId) {
      const userProfile = dbStore.customers.find(
        (c) => c.userId === activeCustomerId || c.id === activeCustomerId
      );
      if (userProfile?.defaultAddressLine && userProfile.defaultAddressLine.trim().length >= 5) {
        customerAddressText = userProfile.defaultAddressLine.trim();
      } else {
        const dbUser = dbStore.users.find(
          (u) => u.id === activeCustomerId || (customerPhone && u.phone === customerPhone)
        );
        if (dbUser && (dbUser as any).address && String((dbUser as any).address).trim().length >= 5) {
          customerAddressText = String((dbUser as any).address).trim();
        }
      }
    }

    if (!serviceId) {
      return apiError("'serviceId' is required", 400);
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return apiError("'pincode' must be a valid 6-digit Indian postal code", 400);
    }
    if (!customerAddressText || customerAddressText.length < 5) {
      return apiError(
        "'customerAddressText' (or 'addressText') must contain a detailed premise address (min 5 characters)",
        400
      );
    }

    // Issue 7: Serviceable Pincode & Active Coverage Gate
    const coverage = await db.getPincodeCoverage(pincode);
    if (!coverage || !coverage.isActive) {
      return apiError(
        `OutOfService Pincode: Postal code '${pincode}' is not within an active licensed franchise territory.`,
        400
      );
    }

    // Check duplicate window (30-second rapid double-tap deduplication)
    const phoneToMatch = customerPhone?.trim() || verifiedCustomerPhone || '';
    const thirtySecondsAgo = Date.now() - 30_000;
    const recentDuplicate = dbStore.jobs.find((j) => {
      const isSameCust = (activeCustomerId && j.customerId === activeCustomerId) || (phoneToMatch && j.customerPhone === phoneToMatch);
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


    // Issue 8: Canonical Service Lookup from Database (Never trust client-supplied price)
    let canonicalService: { id: string; title: string; basePriceInr: number } | null = null;
    
    if (await (await import('@/lib/db')).isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbService = await prisma.serviceCatalog.findFirst({
          where: {
            OR: [
              { id: serviceId },
              { code: serviceId },
            ],
            isActive: true,
          },
        });
        if (dbService) {
          canonicalService = {
            id: dbService.id,
            title: dbService.title,
            basePriceInr: dbService.basePriceInr,
          };
        }
      } catch (err) {
        console.warn('Prisma canonical service lookup fallback:', err);
      }
    }

    if (!canonicalService) {
      const memoryService = dbStore.serviceCatalog?.find(
        (s) => s.id === serviceId || s.code === serviceId || s.title?.toLowerCase() === serviceTitle?.toLowerCase()
      );
      if (memoryService) {
        canonicalService = {
          id: memoryService.id,
          title: memoryService.title,
          basePriceInr: memoryService.basePriceInr,
        };
      }
    }

    if (!canonicalService) {
      return apiError(`Invalid or unrecognized serviceId '${serviceId}'. Service not found in catalog.`, 400);
    }

    // Issue 12: Deterministic Statutory Emergency & Night Surge Calculation
    // Statutory 20% multiplier (1 + 0.20 = 1.20) for EMERGENCY or Night Hours (20:00 - 06:00 IST)
    const bookingTime = scheduledAt ? new Date(scheduledAt) : new Date();
    const istHours = new Date(bookingTime.getTime() + 5.5 * 3600 * 1000).getUTCHours();
    const isNightHours = istHours >= 20 || istHours < 6;
    const isEmergencyPriority = priority === 'EMERGENCY' || priority === 'EMERGENCY_SOS_247';
    const emergencyMultiplier = (isEmergencyPriority || isNightHours) ? 0.20 : 0.0;
    const surgeFactor = 1.0 + emergencyMultiplier;

    // AMC Membership Benefits: Check if customer has active ZEX-SHIELD AMC subscription
    // Automatically sets base labor fee to ₹0.00 for active AMC subscription holders
    let hasActiveSubscription = false;
    let baseLaborFee = Number((canonicalService.basePriceInr * surgeFactor).toFixed(2));

    if (activeCustomerId || customerPhone) {
      if (await (await import('@/lib/db')).isDatabaseConnected()) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const cp = await prisma.customerProfile.findFirst({
            where: {
              OR: [
                { id: activeCustomerId },
                { userId: activeCustomerId },
                ...(customerPhone ? [{ user: { phone: customerPhone } }] : []),
              ],
            },
          });
          if (cp && cp.activeSubscriptionPlan && cp.activeSubscriptionPlan !== 'NONE') {
            const isNotExpired = !cp.subscriptionExpiryDate || new Date(cp.subscriptionExpiryDate) > new Date();
            if (isNotExpired) {
              hasActiveSubscription = true;
              baseLaborFee = 0; // ₹0 base labor fee for active AMC subscription
            }
          }
        } catch (_) {}
      }
    }

    const newJob = await db.createJob({
      customerId: activeCustomerId,
      customerName: verifiedCustomerName || undefined,
      customerPhone: verifiedCustomerPhone || undefined,

      technicianId: technicianId || undefined,
      serviceId: canonicalService.id,
      serviceTitle: canonicalService.title,
      basePriceInr: baseLaborFee,
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
        customerAddressText: newJob.customerAddressText,
        addressText: newJob.customerAddressText,
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
          customerAddressText: newJob.customerAddressText,
          addressText: newJob.customerAddressText,
          pincode: newJob.pincode,
          customerLatitude: newJob.customerLatitude,
          customerLongitude: newJob.customerLongitude,
        },
      });

      // Dual-Channel FCM High-Priority Push Siren (Issue 2)
      sendHighPriorityDispatchSiren({
        technicianId: newJob.technicianId,
        ticketNumber: newJob.jobTicketNumber,
        serviceTitle: newJob.serviceTitle,
        payoutInr: Math.round(newJob.totalAmountInr * 0.7),
        jobId: newJob.id,
        pincode: newJob.pincode,
        customerId: newJob.customerId,
        customerAddress: newJob.customerAddressText,
        timerSeconds: 60,
      }).catch((err) => console.warn('[Jobs -> FCM] Error sending targeted push:', err));
    } else {
      // Geo-Pincode Broadcast Model: Broadcast unassigned work orders to nearby technician fleet
      realtimeBus.publish({
        type: 'TECH_BROADCAST',
        jobId: newJob.id,
        ticketNumber: newJob.jobTicketNumber,
        partnerId: newJob.partnerId,
        pincode: newJob.pincode,
        status: 'PENDING_DISPATCH',
        details: {
          broadcastTimerSeconds: 60,
          acceptanceTimerSeconds: 60,
          payoutShareInr: Math.round(newJob.totalAmountInr * 0.7),
          serviceTitle: newJob.serviceTitle,
          totalAmountInr: newJob.totalAmountInr,
          customerName: newJob.customerName,
          customerPhone: newJob.customerPhone,
          customerAddress: newJob.customerAddressText,
          customerAddressText: newJob.customerAddressText,
          addressText: newJob.customerAddressText,
          pincode: newJob.pincode,
          customerLatitude: newJob.customerLatitude,
          customerLongitude: newJob.customerLongitude,
        },
      });

      // Dual-Channel FCM High-Priority Pincode Fleet Broadcast (Issue 2)
      broadcastDispatchSirenToPincodeFleet({
        pincode: newJob.pincode,
        ticketNumber: newJob.jobTicketNumber,
        serviceTitle: newJob.serviceTitle,
        payoutInr: Math.round(newJob.totalAmountInr * 0.7),
        jobId: newJob.id,
        customerId: newJob.customerId,
        customerAddress: newJob.customerAddressText,
        timerSeconds: 60,
      }).catch((err) => console.warn('[Jobs -> FCM] Error sending fleet broadcast:', err));
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
