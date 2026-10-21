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
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Authorization Bearer token required', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return apiError('Invalid or expired authentication token', 401);
    }

    const { searchParams } = new URL(request.url);
    const paramCustomerId = searchParams.get('customerId');

    let targetId = (payload.customerId as string) || payload.sub;
    if (paramCustomerId && paramCustomerId !== targetId) {
      if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'PARTNER') {
        return apiError('Access denied: You can only access your own customer profile', 403);
      }
      targetId = paramCustomerId;
    }

    // Find customer in mockStore / db
    let customer = await db.getCustomerById(targetId);
    if (!customer) {
      const found = dbStore.customers.find(
        (c) => c.id === targetId || c.userId === targetId || (payload.phone && c.phone === payload.phone)
      );
      if (found) {
        customer = await db.getCustomerById(found.id);
      }
    }

    if (!customer) {
      return apiError('Customer profile not found', 404);
    }

    // Find active / live job for customer (e.g. #J-1001 or latest non-settled job)
    const allCustomerJobs = dbStore.jobs.filter(
      (j) => j.customerId === customer?.id || j.customerId === customer?.userId
    );

    const activeJob = allCustomerJobs.find(
      (j) => !['SETTLED', 'CANCELLED'].includes(j.status)
    ) || allCustomerJobs[0] || null;

    // Attach technician details if assigned
    let assignedTechnician = null;
    if (activeJob && activeJob.technicianId) {
      const tech = dbStore.technicians.find((t) => t.id === activeJob.technicianId);
      if (tech) {
        assignedTechnician = {
          id: tech.id,
          fullName: tech.fullName,
          phone: tech.phone,
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
        activeSubscriptionPlan: customer.activeSubscriptionPlan,
        subscriptionExpiryDate: customer.subscriptionExpiryDate,
        totalOrdersCount: customer.totalOrdersCount,
        totalSpendInr: customer.totalSpendInr,
        isVip: customer.isVip,
        memberSince: customer.memberSince,
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

    const updated = await db.updateCustomer(targetId, {
      fullName,
      email,
      phone,
      defaultAddressLine: addressToUse,
      defaultPincode: pinToUse,
      defaultLatitude,
      defaultLongitude,
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
