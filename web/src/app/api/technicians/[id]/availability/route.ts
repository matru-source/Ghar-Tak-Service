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
    const { isOnline, latitude, longitude } = body;

    if (isOnline === undefined || typeof isOnline !== 'boolean') {
      return apiError("'isOnline' boolean flag is required", 400);
    }

    const existing = await db.getTechnicianById(id);
    if (!existing) {
      return apiError(`Technician '${id}' not found`, 404);
    }

    // Safety protocol: Technician cannot go online if KYC is REJECTED
    if (isOnline && existing.kycStatus === 'REJECTED') {
      return apiError(
        'Cannot go online: Technician KYC is rejected. Please resubmit valid government licensing documents.',
        403
      );
    }

    const updated = await db.updateTechnicianAvailability(id, isOnline, {
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    });

    return apiSuccess(
      updated,
      `Technician status switched to ${isOnline ? 'ONLINE (Ready for Dispatches)' : 'OFFLINE (Duty Ended)'}`,
      200
    );
  } catch (error) {
    return apiError('Failed to update availability status', 500, error instanceof Error ? error.message : String(error));
  }
}
