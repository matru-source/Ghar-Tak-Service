import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const plan = searchParams.get('plan') || undefined;

    const customers = await db.getAllCustomers({
      search,
      subscriptionPlan: plan === 'ALL' ? undefined : plan,
    });

    const totalCustomers = customers.length;
    const totalLifetimeSpend = customers.reduce((sum, c) => sum + (c.totalSpendInr || 0), 0);
    const activeSubscribersCount = customers.filter(
      (c) => c.activeSubscriptionPlan && c.activeSubscriptionPlan !== 'NONE'
    ).length;
    const vipCustomersCount = customers.filter((c) => c.isVip).length;
    const totalDisputes = customers.reduce((sum, c) => sum + (c.disputeCount || 0), 0);

    return apiSuccess(
      {
        customers,
        metrics: {
          totalCustomers,
          totalLifetimeSpend,
          activeSubscribersCount,
          vipCustomersCount,
          totalDisputes,
        },
      },
      'Customer directory retrieved successfully'
    );
  } catch (error) {
    return apiError(
      'Failed to retrieve customer directory',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, email, defaultAddressLine, defaultPincode, activeSubscriptionPlan } = body;

    if (!fullName || !phone || !defaultAddressLine || !defaultPincode) {
      return apiError(
        'Missing required fields: fullName, phone, defaultAddressLine, and defaultPincode are required',
        400
      );
    }

    const customer = await db.createCustomer({
      fullName,
      phone,
      email,
      defaultAddressLine,
      defaultPincode,
      activeSubscriptionPlan,
    });

    return apiSuccess(customer, `Customer '${fullName}' created successfully`, 201);
  } catch (error) {
    return apiError(
      'Failed to create customer',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
