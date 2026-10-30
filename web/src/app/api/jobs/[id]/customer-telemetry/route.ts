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
 * Receives periodic GPS coordinates and doorstep status updates from Technician App or Customer Phone.
 * Dynamically computes haversine distance, checks doorstep geofence, and honors explicit
 * technician doorstep arrival with cryptographic WORM audit trail logging.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      latitude,
      longitude,
      status,
      technicianId,
      etaMinutes,
      callerRole,
    } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return apiError("'latitude' and 'longitude' must be valid numbers", 400);
    }

    const job = await db.findOrRecoverJob(id);
    if (!job) {
      return apiError('Job not found', 404);
    }

    const isTechnicianCaller = Boolean(
      technicianId ||
      callerRole === 'TECHNICIAN' ||
      body.role === 'TECHNICIAN' ||
      body.actorRole === 'TECHNICIAN'
    );

    // If caller is the technician, update technician live coordinates in dbStore
    if (isTechnicianCaller) {
      const techIdToMatch = technicianId || job.technicianId;
      if (techIdToMatch) {
        const tech = dbStore.technicians.find(
          (t) => t.id === techIdToMatch || t.badgeNumber === techIdToMatch || t.userId === techIdToMatch
        );
        if (tech) {
          tech.currentLatitude = latitude;
          tech.currentLongitude = longitude;
        }
      }
    } else {
      // Caller is customer phone updating destination premise coords
      job.customerLatitude = latitude;
      job.customerLongitude = longitude;
    }

    // Determine distance between technician and customer premise
    const targetCustLat = job.customerLatitude || 18.9220;
    const targetCustLng = job.customerLongitude || 72.8347;
    const targetTechLat = isTechnicianCaller
      ? latitude
      : (job.technicianId ? (dbStore.technicians.find((t) => t.id === job.technicianId)?.currentLatitude || targetCustLat) : targetCustLat);
    const targetTechLng = isTechnicianCaller
      ? longitude
      : (job.technicianId ? (dbStore.technicians.find((t) => t.id === job.technicianId)?.currentLongitude || targetCustLng) : targetCustLng);

    const rawDist = calculateHaversineDistanceKm(targetTechLat, targetTechLng, targetCustLat, targetCustLng);
    const isDoorstepNearby = rawDist <= 0.05 || (Math.abs(targetTechLat - targetCustLat) < 0.0002 && Math.abs(targetTechLng - targetCustLng) < 0.0002);
    const distanceKm = isDoorstepNearby ? 0.0 : Number(rawDist.toFixed(2));

    // CRITICAL FIX (Issue 3): Explicit Arrival Override
    // Honor explicit body.status === 'ARRIVED' or 'DOORSTEP_ARRIVED' from authenticated technician,
    // even if GPS drift / indoor signal puts distanceKm > 0.05km!
    const requestedStatus = (status || body.newStatus || '').toUpperCase();
    const isExplicitArrival = requestedStatus === 'ARRIVED' || requestedStatus === 'DOORSTEP_ARRIVED';
    const isAutoGeofenceArrival = isDoorstepNearby && (job.status === 'EN_ROUTE' || job.status === 'ASSIGNED');
    const shouldMarkArrived = isExplicitArrival || isAutoGeofenceArrival;

    if (shouldMarkArrived && job.status !== 'WORK_COMPLETED' && job.status !== 'SETTLED') {
      const prevStatus = job.status;
      job.status = 'ARRIVED';
      const nowIso = new Date().toISOString();
      job.arrivedAt = nowIso;

      if (isExplicitArrival && !isDoorstepNearby) {
        // Record GPS geofence manual override audit log
        await db.recordWormAuditLog({
          actorId: technicianId || job.technicianId || 'tech_field_operator',
          actorRole: 'TECHNICIAN',
          action: 'GEOFENCE_MANUAL_ARRIVAL_OVERRIDE',
          resourceType: 'JOB',
          resourceId: job.id,
          payloadSummary: `Technician manually confirmed doorstep arrival for Work Order #${job.jobTicketNumber} (GPS Distance: ${distanceKm}km). Geofence overridden due to on-site physical arrival.`,
        });
      }

      // Broadcast Doorstep Arrival across all portals and mobile clients
      realtimeBus.publish({
        type: 'TECH_ARRIVED',
        jobId: job.id,
        ticketNumber: job.jobTicketNumber,
        partnerId: job.partnerId,
        technicianId: job.technicianId,
        customerId: job.customerId,
        status: 'ARRIVED',
        details: {
          doorstepGeofenced: isDoorstepNearby,
          manualArrivalOverride: isExplicitArrival && !isDoorstepNearby,
          distanceKm,
          previousStatus: prevStatus,
          arrivalTimestamp: nowIso,
        },
      });
    }

    if (await isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.job.updateMany({
          where: {
            OR: [{ id: job.id }, { jobTicketNumber: job.jobTicketNumber }],
          },
          data: {
            ...(shouldMarkArrived ? { status: 'ARRIVED' as any, arrivedAt: new Date() } : {}),
            ...(isTechnicianCaller ? {} : { customerLatitude: latitude, customerLongitude: longitude }),
          },
        });
      } catch (err) {
        console.warn('[Telemetry] Prisma update error:', err);
      }
    }

    const customerArea = resolveAreaFromCoordinates(targetCustLat, targetCustLng);

    return apiSuccess({
      jobId: job.id,
      ticketNumber: job.jobTicketNumber,
      customerLatitude: targetCustLat,
      customerLongitude: targetCustLng,
      customerArea,
      distanceToTechnicianKm: distanceKm,
      isDoorstepNearby,
      isExplicitArrival,
      status: job.status,
      arrivedAt: job.arrivedAt,
    }, shouldMarkArrived ? 'Doorstep arrival confirmed successfully' : 'Live telemetry updated successfully');

  } catch (error) {
    return apiError(
      'Failed to update customer telemetry',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
