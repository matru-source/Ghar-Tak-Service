import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db, isDatabaseConnected } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

const QUOTE_SECRET = process.env.QUOTE_SECRET || 'ghartak-authoritative-quote-secret-2026';

/**
 * POST /api/quotes
 * Server-authoritative checkout quote generator (Urban Company / Uber pattern)
 * Issues cryptographic quote tokens with 10-minute expiry, accounting for:
 * 1. Base catalog pricing
 * 2. Active AMC membership zero-labor benefits
 * 3. Real-time dynamic surge / congestion multipliers (1.2x - 1.6x)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, customerId, customerPhone, pincode, priority } = body;

    if (!serviceId) {
      return apiError("'serviceId' is mandatory to generate checkout quote", 400);
    }

    const cleanPin = pincode ? String(pincode).trim() : '400001';

    // 1. Resolve Service Catalog item
    let service: any = dbStore.serviceCatalog.find(
      (s) => s.id === serviceId || s.code === serviceId || s.id.toLowerCase() === serviceId.toLowerCase()
    );

    if (!service && (await isDatabaseConnected())) {
      try {
        const { prisma } = await import('@/lib/prisma');
        service = await prisma.serviceCatalog.findFirst({
          where: {
            OR: [{ id: serviceId }, { code: serviceId.toUpperCase() }],
          },
        });
      } catch (_) {}
    }

    const baseLaborFee = service?.basePriceInr || 299.0;
    const serviceTitle = service?.title || 'Professional Doorstep Service';

    // 2. Check AMC Active Membership Benefit (ZEX-SHIELD)
    let hasActiveSubscription = false;
    let subscriptionPlan = 'NONE';

    if (customerId || customerPhone) {
      if (await isDatabaseConnected()) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const cp = await prisma.customerProfile.findFirst({
            where: {
              OR: [
                ...(customerId ? [{ id: customerId }, { userId: customerId }] : []),
                ...(customerPhone ? [{ user: { phone: customerPhone } }] : []),
              ],
            },
          });
          if (cp && cp.activeSubscriptionPlan && cp.activeSubscriptionPlan !== 'NONE') {
            const isNotExpired = !cp.subscriptionExpiryDate || new Date(cp.subscriptionExpiryDate) > new Date();
            if (isNotExpired) {
              hasActiveSubscription = true;
              subscriptionPlan = cp.activeSubscriptionPlan;
            }
          }
        } catch (_) {}
      }

      if (!hasActiveSubscription) {
        const userMem = dbStore.users.find(
          (u) => (customerId && u.id === customerId) || (customerPhone && u.phone === customerPhone)
        );
        if (userMem && (userMem as any).activeSubscriptionPlan && (userMem as any).activeSubscriptionPlan !== 'NONE') {
          hasActiveSubscription = true;
          subscriptionPlan = (userMem as any).activeSubscriptionPlan;
        }
      }
    }

    // 3. Dynamic Surge Pricing Engine (1.2x – 1.6x)
    // Triggered when unassigned pending jobs exceed online technician capacity by 200%
    const unassignedJobsInZone = dbStore.jobs.filter(
      (j) => j.pincode === cleanPin && (j.status === 'PENDING_DISPATCH' || !j.technicianId)
    ).length;
    const onlineTechsInZone = dbStore.technicians.filter(
      (t) => t.isOnline && t.assignedPincode === cleanPin
    ).length;

    let surgeMultiplier = 1.0;
    let surgeReason: string | null = null;

    if (onlineTechsInZone === 0 && unassignedJobsInZone > 0) {
      surgeMultiplier = 1.6;
      surgeReason = 'Severe congestion: High demand with all technicians assigned';
    } else if (unassignedJobsInZone >= onlineTechsInZone * 3.0 && unassignedJobsInZone >= 3) {
      surgeMultiplier = 1.6;
      surgeReason = '300% Zone Overcapacity: High demand surge applied';
    } else if (unassignedJobsInZone >= onlineTechsInZone * 2.5 && unassignedJobsInZone >= 2) {
      surgeMultiplier = 1.4;
      surgeReason = '250% Zone Overcapacity: Peak hour congestion surge applied';
    } else if (unassignedJobsInZone >= onlineTechsInZone * 2.0 && unassignedJobsInZone >= 2) {
      surgeMultiplier = 1.2;
      surgeReason = '200% Zone Overcapacity: Moderate demand surge applied';
    } else if (priority === 'EMERGENCY' || priority === 'EMERGENCY_SOS_247') {
      surgeMultiplier = 1.2;
      surgeReason = '24/7 Priority Emergency SLA Dispatch';
    }

    // 4. Calculate Final Authoritative Price
    // Active AMC membership grants ₹0.00 base consultation labor fee
    const finalBasePrice = hasActiveSubscription ? 0.0 : Number((baseLaborFee * surgeMultiplier).toFixed(2));
    const gstRatePct = 18.0;
    const gst18PctInr = Number((finalBasePrice * (gstRatePct / 100)).toFixed(2));
    const totalAmountInr = Number((finalBasePrice + gst18PctInr).toFixed(2));

    // 5. Generate Cryptographic Quote Token (10-minute expiry)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const payload = `${serviceId}|${customerId || 'guest'}|${cleanPin}|${finalBasePrice}|${totalAmountInr}|${expiresAt}`;
    const signature = crypto.createHmac('sha256', QUOTE_SECRET).update(payload).digest('hex').substring(0, 32);
    const quoteToken = `qt_${Buffer.from(payload).toString('base64url')}.${signature}`;

    return apiSuccess(
      {
        quoteToken,
        serviceId,
        serviceTitle,
        originalBasePriceInr: baseLaborFee,
        surgeMultiplier,
        surgeReason,
        basePriceInr: finalBasePrice,
        gstRatePct,
        gst18PctInr,
        totalAmountInr,
        hasActiveSubscription,
        subscriptionPlan,
        expiresAt,
      },
      'Cryptographic authoritative checkout quote generated (valid for 10 minutes)',
      200
    );
  } catch (error) {
    return apiError(
      'Failed to generate authoritative checkout quote',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
