import { NextRequest } from 'next/server';
import db from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET /api/admin/safety/queue
 * Real-time Safety Inspection Queue for Admin Portal (Issue 29)
 * Highlights high-voltage jobs requiring safety verification audits.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'ALL') as any;
    const voltageLevel = (searchParams.get('voltageLevel') || 'ALL') as any;
    const category = searchParams.get('category') || undefined;

    const queueData = await db.getSafetyInspectionQueue({
      status,
      voltageLevel,
      category,
    });

    return apiSuccess(
      queueData,
      `Retrieved ${queueData.items.length} safety inspection records (${queueData.telemetry.highVoltageCount} High-Voltage)`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to load safety inspection queue',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
