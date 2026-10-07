import { NextRequest } from 'next/server';
import { GoogleMapsService } from '@/lib/maps-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, pincode } = body;

    if (!address || typeof address !== 'string') {
      return apiError("'address' string is required for geocoding", 400);
    }

    const geocoded = await GoogleMapsService.geocodeAddress(address, pincode);

    return apiSuccess(
      geocoded,
      `Address successfully geocoded to [${geocoded.latitude}, ${geocoded.longitude}] (${geocoded.pincode})`
    );
  } catch (error) {
    return apiError(
      'Geocoding failed',
      400,
      error instanceof Error ? error.message : String(error)
    );
  }
}
