import { NextRequest } from 'next/server';
import { PaymentGateway } from '@/lib/payment-gateway';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const telemetry = PaymentGateway.getTelemetry();
    return apiSuccess(
      telemetry,
      `Payment gateway healthy. Total GMV processed: ₹${telemetry.totalGmvProcessedInr} across ${telemetry.totalOrdersPaid} paid transactions.`
    );
  } catch (error) {
    return apiError(
      'Failed to fetch payment telemetry',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
