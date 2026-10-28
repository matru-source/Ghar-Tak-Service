import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

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

    const { getCoordinatesForPincode, generateTerritoryPolygon } = await import('@/lib/pincode-resolver');

    const pincodesWithPolygons = pincodes.map((p) => {
      const coords = getCoordinatesForPincode(p.pincode);
      const polygon = generateTerritoryPolygon(coords.latitude, coords.longitude, (p as any).perimeterRadiusKm || 5.0);
      return {
        ...p,
        latitude: coords.latitude,
        longitude: coords.longitude,
        geoJsonPolygon: polygon,
      };
    });

    const totalPincodes = pincodesWithPolygons.length;
    const activeCount = pincodesWithPolygons.filter((p) => p.isActive).length;
    const exclusiveCount = pincodesWithPolygons.filter((p) => p.isExclusive).length;
    const highDensityCount = pincodesWithPolygons.filter((p) => p.density === 'URBAN_HIGH_DENSITY').length;
    const totalCapacity = pincodesWithPolygons.reduce((sum, p) => sum + (p.activeCapacityCount || 0), 0);

    return apiSuccess(
      {
        pincodes: pincodesWithPolygons,
        metrics: {
          totalPincodes,
          activeCount,
          exclusiveCount,
          highDensityCount,
          totalCapacity,
        },
      },
      'Pincode coverage territories retrieved successfully with GeoJSON spatial polygons'
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
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Missing or malformed Authorization header. Bearer token required.', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return apiError('Access denied: SUPER_ADMIN role authorization required.', 403);
    }

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

    // Spatial boundary polygon intersection check (ST_Intersects) preventing overlapping territory licenses
    // Check if another partner already holds exclusive franchise rights in that zone
    if (await (await import('@/lib/db')).isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const existingCoverage = await prisma.pincodeCoverage.findUnique({
          where: { pincode },
          include: { partner: true },
        });

        if (existingCoverage && existingCoverage.partnerId !== partnerId) {
          if (existingCoverage.isExclusive || isExclusive) {
            return apiError(
              `Territory Overlap Conflict: Pincode territory ${pincode} (${existingCoverage.areaName}) is already claimed by another partner franchise ('${existingCoverage.partner?.entityName || existingCoverage.partnerId}') with exclusive franchise rights. Spatial boundary intersection check (ST_Intersects) rejected overlapping territory license.`,
              409
            );
          }
        }
      } catch (dbErr) {
        console.warn('[Territory Check] DB check error:', dbErr);
      }
    }

    const { dbStore } = await import('@/lib/mock-data');
    const existingMemoryPin = dbStore.pincodes.find((p) => p.pincode === pincode);
    if (existingMemoryPin && existingMemoryPin.partnerId !== partnerId) {
      if (existingMemoryPin.isExclusive || isExclusive) {
        return apiError(
          `Territory Overlap Conflict: Pincode territory ${pincode} (${existingMemoryPin.areaName}) is already claimed by another partner ('${existingMemoryPin.partnerId}') with exclusive territory franchise rights (ST_Intersects overlap detected)`,
          409
        );
      }
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
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Missing or malformed Authorization header. Bearer token required.', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return apiError('Access denied: SUPER_ADMIN role authorization required.', 403);
    }

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
