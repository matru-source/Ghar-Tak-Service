import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search') || undefined;

    const pincodes = await db.getAllPincodes({
      state: state === 'ALL' ? undefined : state,
      partnerId: partnerId === 'ALL' ? undefined : partnerId,
      activeOnly,
      search,
    });

    const totalPincodes = pincodes.length;
    const activeCount = pincodes.filter((p) => p.isActive).length;
    const exclusiveCount = pincodes.filter((p) => p.isExclusive).length;
    const highDensityCount = pincodes.filter((p) => p.density === 'URBAN_HIGH_DENSITY').length;
    const totalCapacity = pincodes.reduce((sum, p) => sum + (p.activeCapacityCount || 0), 0);

    return apiSuccess(
      {
        pincodes,
        metrics: {
          totalPincodes,
          activeCount,
          exclusiveCount,
          highDensityCount,
          totalCapacity,
        },
      },
      'Pincode coverage territories retrieved successfully'
    );
  } catch (error) {
    return apiError(
      'Failed to retrieve pincode territories',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pincode,
      areaName,
      district,
      state,
      partnerId,
      density,
      targetEtaMinutes,
      isExclusive,
      perimeterRadiusKm,
    } = body;

    if (!pincode || !areaName || !district || !state || !partnerId) {
      return apiError(
        'Missing required fields: pincode, areaName, district, state, and partnerId are mandatory',
        400
      );
    }

    if (!/^\d{6}$/.test(pincode)) {
      return apiError('Pincode must be a 6-digit Indian Postal Code', 400);
    }

    const created = await db.createPincode({
      pincode,
      areaName,
      district,
      state,
      partnerId,
      density: density || 'URBAN_HIGH_DENSITY',
      targetEtaMinutes: Number(targetEtaMinutes) || 20,
      isExclusive: isExclusive !== undefined ? Boolean(isExclusive) : true,
      perimeterRadiusKm: Number(perimeterRadiusKm) || 5.0,
    });

    return apiSuccess(created, `Territory pincode ${pincode} created successfully`, 201);
  } catch (error) {
    return apiError(
      'Failed to create pincode territory',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, pincode, ...updates } = body;

    const targetKey = id || pincode;
    if (!targetKey) {
      return apiError("Field 'id' or 'pincode' is required to update", 400);
    }

    const updated = await db.updatePincode(targetKey, updates);
    if (!updated) {
      return apiError(`Pincode territory '${targetKey}' not found`, 404);
    }

    return apiSuccess(updated, `Pincode territory ${updated.pincode} settings updated`);
  } catch (error) {
    return apiError(
      'Failed to update pincode territory',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
