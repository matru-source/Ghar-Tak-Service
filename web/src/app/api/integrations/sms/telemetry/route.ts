import { NextRequest } from 'next/server';
import { SmsGateway } from '@/lib/sms-gateway';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

    const telemetry = SmsGateway.getTelemetry();
    const recentLogs = SmsGateway.getAuditLog(limit);

    return apiSuccess({
      telemetry,
      recentMessages: recentLogs,
    }, `Retrieved SMS gateway telemetry. Total messages dispatched: ${telemetry.totalDispatched}`);
  } catch (error) {
    return apiError(
      'Failed to fetch SMS telemetry',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
