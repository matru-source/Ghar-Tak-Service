import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis-client';
import { memoryBreadcrumbs } from '@/app/api/technicians/telemetry/route';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET /api/technicians/[id]/breadcrumbs?jobId=...
 * Retrieves timestamped GPS breadcrumb polyline points for fleet route playback & verification
 * Stored in Redis list `tech:breadcrumbs:[id]:[jobId]` with in-memory fallback (Issue 24)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: technicianId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId') || 'patrol';

    const breadcrumbKey = `tech:breadcrumbs:${technicianId}:${jobId}`;
    let trail: any[] = [];

    // 1. Check Redis list
    const redis = getRedisClient();
    if (redis) {
      try {
        const rawPoints = await redis.lrange(breadcrumbKey, 0, -1);
        if (rawPoints && rawPoints.length > 0) {
          trail = rawPoints.map((p) => {
            try {
              return JSON.parse(p);
            } catch {
              return null;
            }
          }).filter(Boolean);
        }
      } catch (err: any) {
        console.warn('[Breadcrumbs] Redis lrange error:', err.message);
      }
    }

    // 2. Fallback to memory store if Redis returned 0 points
    if (trail.length === 0) {
      trail = memoryBreadcrumbs.get(breadcrumbKey) || [];
    }

    // If still empty, check if technician has a current location to synthesize initial point
    if (trail.length === 0) {
      const tech = await db.getTechnicianById(technicianId);
      if (tech && tech.currentLatitude && tech.currentLongitude) {
        trail = [
          {
            latitude: tech.currentLatitude,
            longitude: tech.currentLongitude,
            heading: 0,
            speedKmh: 0,
            timestamp: Date.now(),
          },
        ];
      }
    }

    return apiSuccess(
      {
        technicianId,
        jobId,
        totalPoints: trail.length,
        breadcrumbs: trail,
        storageProvider: redis ? 'REDIS_LIST' : 'MEMORY_BUFFER',
        timestamp: new Date().toISOString(),
      },
      `Retrieved ${trail.length} GPS breadcrumb points for technician '${technicianId}'`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to retrieve breadcrumbs',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
