import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;
    const search = searchParams.get('search') || undefined;
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const pincodes = await db.getAllPincodes({
      state,
      partnerId,
      search,
      activeOnly,
    });

    return apiSuccess(
      {
        count: pincodes.length,
        pincodes,
      },
      `Retrieved ${pincodes.length} serviceable territory pincodes`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch territory pincodes', 500, error instanceof Error ? error.message : String(error));
  }
}
