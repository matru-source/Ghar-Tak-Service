import { NextRequest } from 'next/server';
import { GoogleMapsService } from '@/lib/maps-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return apiError("'latitude' and 'longitude' numeric coordinates are required", 400);
    }

    const result = await GoogleMapsService.reverseGeocode(latitude, longitude);

    return apiSuccess(
      result,
      `Coordinates [${latitude}, ${longitude}] reverse-geocoded to ${result.formattedAddress}`
    );
  } catch (error) {
    return apiError(
      'Reverse geocoding failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
