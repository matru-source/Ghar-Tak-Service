import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;

    const data = await db.getEscalatedJobs({ pincode, partnerId });

    return apiSuccess(
      data,
      `Retrieved ${data.counts.totalEscalated} escalated and ${data.counts.totalAtRisk} at-risk jobs`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch escalated jobs',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
