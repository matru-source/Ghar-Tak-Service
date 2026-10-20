import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import {
  getCoordinatesForPincode,
  resolveAreaFromCoordinates,
  calculateHaversineDistanceKm,
  calculateEtaMinutes,
} from '@/lib/pincode-resolver';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * POST: Continuous GPS Telemetry Ping from Field Technician (Android App / Companion)
 * Broadcasts live location to Customer Map and Regional Partner Dispatch Board
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      technicianId,
      jobId,
      latitude,
      longitude,
      heading,
      speedKmh,
      batteryLevelPct,
      isOnline,
    } = body;

    if (!technicianId) {
      return apiError("'technicianId' is required", 400);
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return apiError("'latitude' and 'longitude' must be valid numbers", 400);
    }

    // 1. Update in-memory technician record
    const tech = dbStore.technicians.find((t) => t.id === technicianId || t.badgeNumber === technicianId);
    if (tech) {
      tech.currentLatitude = latitude;
      tech.currentLongitude = longitude;
      if (typeof isOnline === 'boolean') {
        tech.isOnline = isOnline;
      }
    }

    // 2. Compute job distance & ETA if active work order is attached
    let distanceRemainingKm: number | null = null;
    let etaMinutes: number | null = null;
    let isDoorstepNearby = false;
    let targetJob = null;

    let techArea = resolveAreaFromCoordinates(latitude, longitude);
    let customerArea = '';

    if (jobId) {
      targetJob = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
      if (targetJob) {
        const destGeo = getCoordinatesForPincode(targetJob.pincode || '759001');
        const destLat = targetJob.customerLatitude || destGeo.latitude;
        const destLng = targetJob.customerLongitude || destGeo.longitude;
        customerArea = resolveAreaFromCoordinates(destLat, destLng);

        const rawDist = calculateHaversineDistanceKm(latitude, longitude, destLat, destLng);
        distanceRemainingKm = Number(rawDist.toFixed(2));

        // Transit speed (25 km/h average)
        etaMinutes = calculateEtaMinutes(distanceRemainingKm, 25.0);

        // Geofence Doorstep Check (under 50 meters = 0.05 km)
        if (distanceRemainingKm <= 0.05 && (targetJob.status === 'EN_ROUTE' || targetJob.status === 'ASSIGNED')) {
          isDoorstepNearby = true;
          targetJob.status = 'ARRIVED';

          // Broadcast Automatic Doorstep Arrival Event
          realtimeBus.publish({
            type: 'TECH_ARRIVED',
            jobId: targetJob.id,
            ticketNumber: targetJob.jobTicketNumber,
            partnerId: targetJob.partnerId,
            technicianId: tech?.id || technicianId,
            customerId: targetJob.customerId,
            status: 'ARRIVED',
            details: {
              doorstepGeofenced: true,
              arrivalTimestamp: new Date().toISOString(),
            },
          });
        }
      }
    }

    // 3. Broadcast High-Frequency Real-Time Location Update to Event Bus
    realtimeBus.publish({
      type: 'TECH_LOCATION_UPDATE',
      jobId: targetJob?.id || jobId,
      ticketNumber: targetJob?.jobTicketNumber,
      partnerId: tech?.partnerId || targetJob?.partnerId,
      technicianId: tech?.id || technicianId,
      customerId: targetJob?.customerId,
      status: targetJob?.status,
      location: {
        latitude,
        longitude,
        heading: typeof heading === 'number' ? heading : undefined,
        speed: typeof speedKmh === 'number' ? speedKmh : undefined,
        etaMinutes: etaMinutes ?? undefined,
      },
      details: {
        technicianName: tech?.fullName || targetJob?.technicianName || 'Field Technician',
        distanceRemainingKm,
        isDoorstepNearby,
        technicianArea: techArea,
        customerArea: customerArea || undefined,
        batteryLevelPct: typeof batteryLevelPct === 'number' ? batteryLevelPct : 85,
        isOnline: tech?.isOnline ?? true,
      },
    });

    return apiSuccess(
      {
        technicianId,
        jobId: targetJob?.jobTicketNumber || jobId,
        coordinates: { latitude, longitude },
        technicianArea: techArea,
        customerArea: customerArea || undefined,
        distanceRemainingKm,
        etaMinutes,
        isDoorstepNearby,
        updatedStatus: targetJob?.status,
        timestamp: new Date().toISOString(),
      },
      'Technician GPS telemetry recorded and broadcasted in real time',
      200
    );
  } catch (error) {
    return apiError('Failed to record technician GPS telemetry', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * GET: Retrieve live GPS locations of fleet technicians
 * Used by Customer Live Tracking Map and Partner Dispatch Console
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get('technicianId') || undefined;
    const jobId = searchParams.get('jobId') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;

    // If querying by jobId, find assigned technician's live coordinates
    if (jobId) {
      const job = dbStore.jobs.find((j) => j.id === jobId || j.jobTicketNumber === jobId);
      if (!job) {
        return apiError('Job not found', 404);
      }
      const tech = dbStore.technicians.find((t) => t.id === job.technicianId);

      const destGeo = getCoordinatesForPincode(job.pincode || '759001');
      const destLat = job.customerLatitude || destGeo.latitude;
      const destLng = job.customerLongitude || destGeo.longitude;
      const techLat = tech?.currentLatitude || destLat;
      const techLng = tech?.currentLongitude || destLng;

      const dist = Number(calculateHaversineDistanceKm(techLat, techLng, destLat, destLng).toFixed(2));
      const eta = calculateEtaMinutes(dist, 25.0);
      const techArea = resolveAreaFromCoordinates(techLat, techLng);
      const destArea = resolveAreaFromCoordinates(destLat, destLng);

      const rawBasePrice = (job as any).basePriceInr || (job as any).priceInr || 299.0;
      const rawTotalAmount = (job as any).totalAmountInr || (job as any).totalPriceInr || Number((rawBasePrice * 1.18).toFixed(2));

      return apiSuccess({
        jobId: job.id,
        jobTicketNumber: job.jobTicketNumber,
        status: job.status,
        handoverOtp: job.handoverOtp,
        serviceTitle: job.serviceTitle || 'Doorstep Service',
        basePriceInr: rawBasePrice,
        totalAmountInr: rawTotalAmount,
        destination: {
          latitude: destLat,
          longitude: destLng,
          address: job.customerAddressText,
          area: destArea,
        },
        technician: {
          id: tech?.id || job.technicianId,
          badgeNumber: tech?.badgeNumber || 'GTS-TECH-101',
          name: tech?.fullName || job.technicianName,
          phone: tech?.phone || '9876543210',
          rating: tech?.rating || 4.9,
          coordinates: { latitude: techLat, longitude: techLng },
          area: techArea,
          distanceKm: dist,
          etaMinutes: eta,
          isOnline: tech?.isOnline ?? true,
        },
      }, 'Live job tracking telemetry retrieved');
    }

    // Otherwise, return fleet list filtered by partner or technicianId
    let fleet = dbStore.technicians.map((t) => ({
      id: t.id,
      badgeNumber: t.badgeNumber,
      fullName: t.fullName,
      phone: t.phone,
      partnerId: t.partnerId,
      pincode: t.assignedPincode,
      isOnline: t.isOnline,
      rating: t.rating,
      coordinates: {
        latitude: t.currentLatitude || 18.9067,
        longitude: t.currentLongitude || 72.8147,
      },
    }));

    if (technicianId) {
      fleet = fleet.filter((t) => t.id === technicianId || t.badgeNumber === technicianId);
    }
    if (partnerId) {
      fleet = fleet.filter((t) => t.partnerId === partnerId);
    }

    return apiSuccess({
      totalCount: fleet.length,
      onlineCount: fleet.filter((t) => t.isOnline).length,
      fleet,
    }, 'Fleet telemetry retrieved');
  } catch (error) {
    return apiError('Failed to retrieve fleet telemetry', 500, error instanceof Error ? error.message : String(error));
  }
}
