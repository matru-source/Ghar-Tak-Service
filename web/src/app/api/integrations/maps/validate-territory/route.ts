import { NextRequest } from 'next/server';
import { GoogleMapsService } from '@/lib/maps-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pincode, latitude, longitude, maxRadiusKm } = body;

    if (!pincode || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return apiError("'pincode', 'latitude', and 'longitude' are required", 400);
    }

    const validation = GoogleMapsService.validateTerritoryBoundary(
      pincode,
      latitude,
      longitude,
      typeof maxRadiusKm === 'number' ? maxRadiusKm : 10.0
    );

    return apiSuccess(
      validation,
      validation.isWithinTerritory
        ? `Location is within serviceable territory (${validation.distanceToCenterKm.toFixed(2)} km from hub center)`
        : `Location is outside permissible territory (${validation.distanceToCenterKm.toFixed(2)} km exceeds ${validation.allowedRadiusKm} km limit)`
    );
  } catch (error) {
    return apiError(
      'Territory boundary validation failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
