import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { calculateHaversineDistanceKm, calculateEtaMinutes, resolveAreaFromCoordinates } from '@/lib/pincode-resolver';
import { isDatabaseConnected } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST /api/jobs/[id]/customer-telemetry
 * Receives periodic GPS coordinates from Customer Phone during active tracking.
 * Dynamically updates destination coordinates and checks doorstep geofence.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return apiError("'latitude' and 'longitude' must be valid numbers", 400);
    }

    const job = await db.findOrRecoverJob(id);
    if (!job) {
      return apiError('Job not found', 404);
    }

    // Update live destination coordinates on job
    job.customerLatitude = latitude;
    job.customerLongitude = longitude;

    // Check distance against assigned technician's live coordinates
    let techLat = 0.0;
    let techLng = 0.0;
    if (job.technicianId) {
      const tech = dbStore.technicians.find(
        (t) => t.id === job.technicianId || t.badgeNumber === (job as any).technicianBadge
      );
      if (tech && tech.currentLatitude && tech.currentLongitude) {
        techLat = tech.currentLatitude;
        techLng = tech.currentLongitude;
      }
    }

    let distanceKm = 0.0;
    let isDoorstepNearby = false;

    if (techLat !== 0.0 && techLng !== 0.0) {
      const rawDist = calculateHaversineDistanceKm(techLat, techLng, latitude, longitude);
      isDoorstepNearby = rawDist <= 0.05 || (Math.abs(techLat - latitude) < 0.0002 && Math.abs(techLng - longitude) < 0.0002);
      distanceKm = isDoorstepNearby ? 0.0 : Number(rawDist.toFixed(2));

      if (isDoorstepNearby && (job.status === 'EN_ROUTE' || job.status === 'ASSIGNED')) {
        job.status = 'ARRIVED';

        // Broadcast Doorstep Arrival
        realtimeBus.publish({
          type: 'TECH_ARRIVED',
          jobId: job.id,
          ticketNumber: job.jobTicketNumber,
          partnerId: job.partnerId,
          technicianId: job.technicianId,
          customerId: job.customerId,
          status: 'ARRIVED',
          details: {
            doorstepGeofenced: true,
            arrivalTimestamp: new Date().toISOString(),
          },
        });
      }
    }

    if (await isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.job.updateMany({
          where: { OR: [{ id: job.id }, { jobTicketNumber: job.jobTicketNumber }] },
          data: {
            customerLatitude: latitude,
            customerLongitude: longitude,
            ...(isDoorstepNearby ? { status: 'ARRIVED' as any } : {}),
          },
        });
      } catch (_) {}
    }

    const customerArea = resolveAreaFromCoordinates(latitude, longitude);

    return apiSuccess({
      jobId: job.id,
      ticketNumber: job.jobTicketNumber,
      customerLatitude: latitude,
      customerLongitude: longitude,
      customerArea,
      distanceToTechnicianKm: distanceKm,
      isDoorstepNearby,
      status: job.status,
    }, 'Customer live coordinates updated successfully');

  } catch (error) {
    return apiError(
      'Failed to update customer telemetry',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
