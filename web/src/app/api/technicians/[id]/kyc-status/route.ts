import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason, insulatedGlovesVerified } = body;

    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      return apiError("Status must be either 'VERIFIED' or 'REJECTED'", 400);
    }

    const existing = await db.getTechnicianById(id);
    if (!existing) {
      return apiError(`Technician '${id}' not found`, 404);
    }

    const updated = await db.updateTechnicianKycStatus(
      id,
      status as 'VERIFIED' | 'REJECTED',
      {
        reason,
        verifierId: 'usr_admin_01',
        insulatedGlovesVerified,
      }
    );

    return apiSuccess(
      updated,
      `Technician KYC status successfully updated to '${status}'${status === 'VERIFIED' ? ' with 1000V Insulated Gloves clearance' : ''}`,
      200
    );
  } catch (error) {
    return apiError('Failed to update KYC status', 500, error instanceof Error ? error.message : String(error));
  }
}
