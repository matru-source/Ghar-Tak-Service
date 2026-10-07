import { NextRequest } from 'next/server';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  const telemetry = realtimeBus.getTelemetry();
  return apiSuccess(telemetry, 'Real-time telemetry retrieved');
}
