import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET() {
  try {
    const telemetry = await db.getCentralFinanceTelemetry();
    const ledgersData = await db.getLedgerEntries();

    return apiSuccess(
      {
        ...telemetry,
        ledgerTelemetry: ledgersData.telemetry,
        recentLedgers: ledgersData.ledgerEntries.slice(-10).reverse(),
      },
      'Central finance and escrow telemetry retrieved successfully'
    );
  } catch (error) {
    return apiError(
      'Failed to retrieve central finance telemetry',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
