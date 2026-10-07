import { NextRequest } from 'next/server';
import { GoogleMapsService } from '@/lib/maps-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const telemetry = GoogleMapsService.getTelemetry();
    return apiSuccess(
      telemetry,
      `Google Maps engine active. Supported postal clusters: ${telemetry.supportedClusters.join(', ')}`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch maps telemetry',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
