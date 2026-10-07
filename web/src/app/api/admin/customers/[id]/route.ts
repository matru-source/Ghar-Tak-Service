import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await db.getCustomerById(id);

    if (!customer) {
      return apiError(`Customer '${id}' not found`, 404);
    }

    return apiSuccess(customer, `Customer dossier for '${customer.fullName}' retrieved`);
  } catch (error) {
    return apiError(
      'Failed to retrieve customer dossier',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.updateCustomer(id, body);
    if (!updated) {
      return apiError(`Customer '${id}' not found`, 404);
    }

    return apiSuccess(updated, `Customer '${updated.fullName}' profile updated successfully`);
  } catch (error) {
    return apiError(
      'Failed to update customer profile',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
