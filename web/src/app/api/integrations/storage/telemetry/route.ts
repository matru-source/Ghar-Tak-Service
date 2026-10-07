import { NextRequest } from 'next/server';
import { CloudStorageService } from '@/lib/storage-service';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const telemetry = CloudStorageService.getTelemetry();
    return apiSuccess(
      telemetry,
      `Storage bucket '${telemetry.bucketName}' healthy. ${telemetry.totalObjectsStored} objects stored (${telemetry.totalStorageFormatted}).`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch storage telemetry',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
