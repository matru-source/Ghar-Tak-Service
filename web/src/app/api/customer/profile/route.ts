import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paramCustomerId = searchParams.get('customerId');
    const paramPhone = searchParams.get('phone');

    const token = extractBearerToken(request);
    let targetId: string = paramCustomerId || '';
    let targetPhone: string | undefined = paramPhone || undefined;

    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        targetId = (payload.customerId as string) || payload.sub;
        if (paramCustomerId && paramCustomerId !== targetId) {
          if (payload.role === 'SUPER_ADMIN' || payload.role === 'PARTNER') {
            targetId = paramCustomerId;
          }
        }
        if (payload.phone) targetPhone = payload.phone;
      }
    }

    // Find customer in live database
    let customer: any = null;
    if (targetId) {
      customer = await db.getCustomerById(targetId);
    }
    if (!customer && targetPhone) {
      customer = await db.getCustomerByPhone(targetPhone);
    }
    if (!customer && !targetId && !targetPhone) {
      customer = await db.getFirstCustomer();
    }
    if (!customer && targetId) {
      const found = dbStore.customers.find(
        (c) => c.id === targetId || c.userId === targetId || (targetPhone && c.phone === targetPhone)
      );
      if (found) {
        customer = await db.getCustomerById(found.id) || (found as any);
      }
    }

    // Issue 3.3: Unified User Query & Synthetic Customer Profile for Admin/Staff preview
    if (!customer && (targetId || targetPhone)) {
      const user = targetId
        ? (await db.getUserById(targetId)) || dbStore.users.find((u) => u.id === targetId)
        : (await db.getUserByPhone(targetPhone!)) || dbStore.users.find((u) => u.phone === targetPhone);

      if (user) {
        customer = {
          id: `cust_${user.id}`,
          userId: user.id,
          fullName: user.fullName || 'Admin User',
          phone: user.phone || '+919876543210',
          email: user.email || 'admin@ghartak.in',
          defaultAddressLine: 'HQ Command Center, Colaba',
          defaultPincode: '400001',
          defaultLatitude: 18.922,
          defaultLongitude: 72.833,
          activeSubscriptionPlan: 'ZEX_SHIELD_PRO',
          totalOrdersCount: 0,
          totalSpendInr: 0,
          isVip: true,
          memberSince: '2026-08-01',
        };
      }
    }

    if (!customer) {
      return apiError('Customer profile not found', 404);
    }

    // Find active / live jobs for customer directly from PostgreSQL
    const allCustomerJobs = await db.getJobs({
      customerId: customer.id,
    });

    const activeJob = allCustomerJobs.find(
      (j: any) => !['SETTLED', 'CANCELLED', 'WORK_COMPLETED', 'COMPLETED'].includes(j.status)
    ) || allCustomerJobs[0] || null;

    // Attach technician details if assigned
    let assignedTechnician = null;
    if (activeJob && activeJob.technicianId) {
      const tech: any = (await db.getTechnicianById(activeJob.technicianId)) ||
        dbStore.technicians.find((t) => t.id === activeJob.technicianId);
      if (tech) {
        assignedTechnician = {
          id: tech.id,
          fullName: tech.user?.fullName || tech.fullName || 'Technician',
          phone: tech.user?.phone || tech.phone || '',
          badgeNumber: tech.badgeNumber,
          rating: tech.rating,
          totalJobsCompleted: tech.totalJobsCompleted,
          isOnline: tech.isOnline,
          currentLatitude: tech.currentLatitude,
          currentLongitude: tech.currentLongitude,
          kycStatus: tech.kycStatus,
          insulatedGlovesVerified: tech.insulatedGlovesVerified,
        };
      }
    }


    // Active subscription plan details
    const activePlan = dbStore.subscriptionTiers.find(
      (t) => t.code === customer?.activeSubscriptionPlan
    ) || null;

    // Serviceable pincodes list
    const serviceablePincodes = dbStore.pincodes.filter((p) => p.isActive);

    return apiSuccess({
      customer: {
        id: customer.id,
        userId: customer.userId,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        defaultAddressLine: customer.defaultAddressLine,
        defaultPincode: customer.defaultPincode,
        defaultLatitude: customer.defaultLatitude,
        defaultLongitude: customer.defaultLongitude,
        activeSubscriptionPlan: customer.activeSubscriptionPlan || 'NONE',
        subscriptionExpiryDate: (customer as any).subscriptionExpiryDate || null,
        totalOrdersCount: (customer as any).totalOrdersCount || allCustomerJobs.length,
        totalSpendInr: (customer as any).totalSpendInr || 0,
        isVip: (customer as any).isVip || false,
        memberSince: (customer as any).memberSince || new Date().toISOString(),
      },
      activeJob: activeJob ? {
        ...activeJob,
        technician: assignedTechnician,
        etaMinutes: 12,
        routeOrigin: 'Marine Drive',
        routeDestination: 'Colaba, Mumbai',
      } : null,
      activePlan,
      serviceablePincodes,
      recentBookings: allCustomerJobs.slice(0, 5),
      // Issue 38: Return recent completed job awaiting customer rating/review
      pendingReviewJob: allCustomerJobs.find(
        (j: any) =>
          ['WORK_COMPLETED', 'COMPLETED', 'SETTLED'].includes(j.status) &&
          (j.customerRating === null || j.customerRating === undefined)
      ) ? {
        id: (allCustomerJobs.find((j: any) => ['WORK_COMPLETED', 'COMPLETED', 'SETTLED'].includes(j.status) && (j.customerRating === null || j.customerRating === undefined)) as any).id,
        jobTicketNumber: (allCustomerJobs.find((j: any) => ['WORK_COMPLETED', 'COMPLETED', 'SETTLED'].includes(j.status) && (j.customerRating === null || j.customerRating === undefined)) as any).jobTicketNumber,
        serviceTitle: (allCustomerJobs.find((j: any) => ['WORK_COMPLETED', 'COMPLETED', 'SETTLED'].includes(j.status) && (j.customerRating === null || j.customerRating === undefined)) as any).serviceTitle,
        technicianName: (allCustomerJobs.find((j: any) => ['WORK_COMPLETED', 'COMPLETED', 'SETTLED'].includes(j.status) && (j.customerRating === null || j.customerRating === undefined)) as any).technicianName || 'Field Specialist',
        totalAmountInr: (allCustomerJobs.find((j: any) => ['WORK_COMPLETED', 'COMPLETED', 'SETTLED'].includes(j.status) && (j.customerRating === null || j.customerRating === undefined)) as any).totalAmountInr,
      } : null,
    }, 'Customer profile and live operational context retrieved');
  } catch (error) {
    return apiError(
      'Failed to load customer profile',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Authorization Bearer token required', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return apiError('Invalid or expired authentication token', 401);
    }

    const body = await request.json();
    const {
      customerId,
      fullName,
      email,
      phone,
      address,
      defaultAddressLine,
      pincode,
      defaultPincode,
      defaultLatitude,
      defaultLongitude,
      avatarUrl,
    } = body;

    let targetId = (payload.customerId as string) || payload.sub;
    if (customerId && customerId !== targetId) {
      if (payload.role !== 'SUPER_ADMIN') {
        return apiError('Access denied: You can only update your own customer profile', 403);
      }
      targetId = customerId;
    }

    const addressToUse = defaultAddressLine || address;
    const pinToUse = defaultPincode || pincode;

    // Validate avatarUrl format if provided (accept HTTPS CDN URLs, data URIs, or relative /uploads/)
    let validatedAvatarUrl: string | undefined = undefined;
    if (avatarUrl !== undefined) {
      if (typeof avatarUrl === 'string' && avatarUrl.trim().length > 0) {
        const clean = avatarUrl.trim();
        if (clean.startsWith('https://') || clean.startsWith('http://') || clean.startsWith('/uploads/') || clean.startsWith('data:image/')) {
          validatedAvatarUrl = clean;
        } else {
          return apiError('Invalid avatarUrl: Must be a valid HTTP/HTTPS URL or /uploads/ path', 400);
        }
      } else if (avatarUrl === null) {
        validatedAvatarUrl = '';
      }
    }

    const updated = await db.updateCustomer(targetId, {
      fullName,
      email,
      phone,
      defaultAddressLine: addressToUse,
      defaultPincode: pinToUse,
      defaultLatitude,
      defaultLongitude,
      avatarUrl: validatedAvatarUrl,
    });

    if (!updated) {
      return apiError(`Customer '${targetId}' not found`, 404);
    }

    return apiSuccess(updated, 'Customer profile updated successfully');
  } catch (error) {
    return apiError(
      'Failed to update customer profile',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request);
}
