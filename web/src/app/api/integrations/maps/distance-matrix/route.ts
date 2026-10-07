import { NextRequest } from 'next/server';
import { GoogleMapsService } from '@/lib/maps-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination } = body;

    if (!origin || !destination) {
      return apiError("'origin' and 'destination' coordinate objects are required", 400);
    }
    if (typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
      return apiError("Invalid 'origin' coordinates", 400);
    }
    if (typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
      return apiError("Invalid 'destination' coordinates", 400);
    }

    const matrix = await GoogleMapsService.getDistanceMatrix(origin, destination);

    return apiSuccess(
      matrix,
      `Calculated route: ${matrix.distanceFormatted} in ${matrix.durationFormatted} (${matrix.trafficStatus})`
    );
  } catch (error) {
    return apiError(
      'Distance Matrix calculation failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
