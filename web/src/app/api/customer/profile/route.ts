import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || 'cust_amit_01';

    // Find customer in mockStore / db
    let customer = await db.getCustomerById(customerId);
    if (!customer) {
      // Fallback search by userId or default to Amit Sharma
      const found = dbStore.customers.find(
        (c) => c.id === customerId || c.userId === customerId || c.phone.includes(customerId)
      );
      if (found) {
        customer = await db.getCustomerById(found.id);
      } else {
        customer = await db.getCustomerById('cust_amit_01');
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, defaultAddressLine, defaultPincode, defaultLatitude, defaultLongitude } = body;

    const id = customerId || 'cust_amit_01';
    const customer = dbStore.customers.find((c) => c.id === id || c.userId === id);

    if (!customer) {
      return apiError(`Customer '${id}' not found`, 404);
    }

    if (defaultAddressLine) customer.defaultAddressLine = defaultAddressLine;
    if (defaultPincode) customer.defaultPincode = defaultPincode;
    if (defaultLatitude !== undefined) customer.defaultLatitude = defaultLatitude;
    if (defaultLongitude !== undefined) customer.defaultLongitude = defaultLongitude;

    return apiSuccess(customer, 'Customer profile updated successfully');
  } catch (error) {
    return apiError(
      'Failed to update customer profile',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
