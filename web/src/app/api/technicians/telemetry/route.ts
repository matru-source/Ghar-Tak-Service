import { NextRequest } from 'next/server';
import { db, isDatabaseConnected } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import {
  getCoordinatesForPincode,
  resolveAreaFromCoordinates,
  calculateHaversineDistanceKm,
  calculateEtaMinutes,
} from '@/lib/pincode-resolver';

import { getRedisClient } from '@/lib/redis-client';

export const dynamic = 'force-dynamic';

// In-process memory stores for write throttling and breadcrumbs fallback
const lastDbFlushMap = new Map<string, number>();
export const memoryBreadcrumbs = new Map<string, any[]>();

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
      isGpsActive: rawIsGpsActive,
    } = body;

    const isGpsActive = typeof rawIsGpsActive === 'boolean' ? rawIsGpsActive : true;
    const isMockLocation = body.isMockLocation === true || body.isFromMockProvider === true || body.isMock === true;

    if (isMockLocation) {
      return apiError(
        'Security Violation: Simulated mock GPS provider detected. Mock locations are strictly rejected by the Ghar Tak anti-spoofing engine.',
        403
      );
    }

    if (!technicianId) {
      return apiError("'technicianId' is required", 400);
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return apiError("'latitude' and 'longitude' must be valid numbers", 400);
    }

    // 1. Update in-memory technician record
    let tech = dbStore.technicians.find((t) => t.id === technicianId || t.badgeNumber === technicianId);
    if (!tech) {
      const dbTech = await db.getTechnicianById(technicianId);
      if (dbTech) {
        tech = dbTech as any;
      }
    }

    if (!tech) {
      return apiError(`Technician '${technicianId}' not registered in platform dispatch roster`, 404);
    }

    tech.currentLatitude = latitude;
    tech.currentLongitude = longitude;
    if (typeof isOnline === 'boolean') {
      tech.isOnline = isOnline;
    }

    // --------------------------------------------------------------------------
    // Issue 22: High-Frequency GPS pings to Redis Geospatial (GEOADD)
    // Eliminates disk I/O thrashing under heavy fleet load
    // --------------------------------------------------------------------------
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.geoadd('technicians:geo', longitude, latitude, tech.id);
        await redis.hset(`technician:${tech.id}:telemetry`, {
          latitude: String(latitude),
          longitude: String(longitude),
          heading: String(heading ?? 0),
          speedKmh: String(speedKmh ?? 0),
          isOnline: typeof isOnline === 'boolean' ? String(isOnline) : 'true',
          updatedAt: String(Date.now()),
          jobId: jobId || '',
        });
      } catch (rErr) {
        console.warn('[Telemetry] Redis geoadd warning:', rErr);
      }
    }

    // --------------------------------------------------------------------------
    // Issue 24: Store timestamped GPS breadcrumb points in Redis list & memory
    // Key: tech:breadcrumbs:[id]:[jobId]
    // --------------------------------------------------------------------------
    const breadcrumbKey = `tech:breadcrumbs:${tech.id}:${jobId || 'patrol'}`;
    const breadcrumbItem = {
      latitude,
      longitude,
      heading: heading ?? 0,
      speedKmh: speedKmh ?? 0,
      timestamp: Date.now(),
    };
    if (redis) {
      try {
        await redis.rpush(breadcrumbKey, JSON.stringify(breadcrumbItem));
        await redis.ltrim(breadcrumbKey, -100, -1); // Keep last 100 points
      } catch (_) {}
    }
    const memTrail = memoryBreadcrumbs.get(breadcrumbKey) || [];
    memTrail.push(breadcrumbItem);
    if (memTrail.length > 100) memTrail.shift();
    memoryBreadcrumbs.set(breadcrumbKey, memTrail);

    // --------------------------------------------------------------------------
    // Issue 22: Throttled database flush — flush to PostgreSQL only every 5 mins
    // or when online/offline shift status explicitly transitions
    // --------------------------------------------------------------------------
    const nowMs = Date.now();
    const lastFlush = lastDbFlushMap.get(tech.id) || 0;
    const statusChanged = typeof isOnline === 'boolean' && tech.isOnline !== isOnline;
    const shouldFlushToPostgres = statusChanged || (nowMs - lastFlush > 5 * 60 * 1000);

    if (shouldFlushToPostgres && await isDatabaseConnected()) {
      lastDbFlushMap.set(tech.id, nowMs);
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.technician.updateMany({
          where: { OR: [{ id: tech.id }, { badgeNumber: tech.badgeNumber }] },
          data: {
            currentLatitude: latitude,
            currentLongitude: longitude,
            ...(typeof isOnline === 'boolean' ? { isOnline } : {}),
          },
        });
      } catch (err) {}
    }

    // 2. Compute job distance & ETA if active work order is attached
    let distanceRemainingKm: number | null = null;
    let etaMinutes: number | null = null;
    let isDoorstepNearby = false;
    let targetJob = null;

    let techArea = resolveAreaFromCoordinates(latitude, longitude);
    let customerArea = '';

    if (jobId) {
      targetJob = await db.findOrRecoverJob(jobId);
      if (targetJob) {
        const destGeo = getCoordinatesForPincode(targetJob.pincode || '759001');
        const destLat = targetJob.customerLatitude || destGeo.latitude;
        const destLng = targetJob.customerLongitude || destGeo.longitude;
        customerArea = resolveAreaFromCoordinates(destLat, destLng);

        const rawDist = calculateHaversineDistanceKm(latitude, longitude, destLat, destLng);

        // ----------------------------------------------------------------------
        // Issue 19: Geofence Arrival Interlock (Haversine < 150m)
        // ----------------------------------------------------------------------
        const isWithin150mGeofence = rawDist <= 0.15; // 150 meters
        const isCoLocated = isGpsActive && (rawDist <= 0.05 || (Math.abs(latitude - destLat) < 0.0002 && Math.abs(longitude - destLng) < 0.0002));

        if (body.status === 'ARRIVED' && !isWithin150mGeofence) {
          return apiError(
            `Arrival Geofence Interlock Active: Technician is ${Math.round(rawDist * 1000)}m away from customer destination. Proximity within 150m required.`,
            400
          );
        }

        if (isCoLocated || isWithin150mGeofence) {
          distanceRemainingKm = Number(rawDist.toFixed(2));
          etaMinutes = isCoLocated ? 0 : 1;
          isDoorstepNearby = true;
          if (targetJob.status === 'EN_ROUTE' && isCoLocated) {
            targetJob.status = 'ARRIVED';
          }
        } else {
          distanceRemainingKm = Number(rawDist.toFixed(2));
          etaMinutes = calculateEtaMinutes(distanceRemainingKm, 25.0);
        }

        // Geofence Doorstep Check (under 150 meters with explicit arrival or 50m auto-arrival)
        // ONLY transition to ARRIVED if technician is actively EN_ROUTE!
        if (isDoorstepNearby && targetJob.status === 'EN_ROUTE' && (body.status === 'ARRIVED' || isCoLocated)) {
          targetJob.status = 'ARRIVED';
          if (await isDatabaseConnected()) {
            try {
              const { prisma } = await import('@/lib/prisma');
              await prisma.job.updateMany({
                where: {
                  OR: [{ id: targetJob.id }, { jobTicketNumber: targetJob.jobTicketNumber }],
                  status: 'EN_ROUTE' as any
                },
                data: { status: 'ARRIVED' as any },
              });
            } catch (_) {}
          }

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
        isGpsActive,
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
        isGpsActive,
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
      const job = await db.findOrRecoverJob(jobId);
      if (!job) {
        return apiError('Job not found', 404);
      }
      let tech: any = dbStore.technicians.find((t) => t.id === job.technicianId || t.badgeNumber === (job as any).technicianBadge);
      if (!tech && job.technicianId) {
        tech = (await db.getTechnicianById(job.technicianId)) || undefined;
      }

      const destGeo = getCoordinatesForPincode(job.pincode || '759001');
      const destLat = job.customerLatitude || destGeo.latitude;
      const destLng = job.customerLongitude || destGeo.longitude;

      let techLat = tech?.currentLatitude;
      let techLng = tech?.currentLongitude;

      // If no live coordinates yet, default to technician's assigned hub
      if (!techLat || !techLng) {
        const hubGeo = getCoordinatesForPincode(tech?.assignedPincode || job.pincode || '759001');
        techLat = hubGeo.latitude;
        techLng = hubGeo.longitude;
      }

      const rawDist = calculateHaversineDistanceKm(techLat, techLng, destLat, destLng);
      const isDoorstep = rawDist <= 0.05 || (Math.abs(techLat - destLat) < 0.0002 && Math.abs(techLng - destLng) < 0.0002) || job.status === 'ARRIVED';
      const dist = isDoorstep ? 0.0 : Number(rawDist.toFixed(2));
      const eta = isDoorstep ? 0 : calculateEtaMinutes(dist, 25.0);

      if (isDoorstep && (job.status === 'EN_ROUTE' || job.status === 'ASSIGNED')) {
        job.status = 'ARRIVED';
      }

      const techArea = resolveAreaFromCoordinates(techLat, techLng);
      const destArea = resolveAreaFromCoordinates(destLat, destLng);

      const rawBasePrice = (job as any).basePriceInr || (job as any).priceInr || 299.0;
      const rawTotalAmount = (job as any).totalAmountInr || (job as any).totalPriceInr || Number((rawBasePrice * 1.18).toFixed(2));

      return apiSuccess({
        jobId: job.id,
        jobTicketNumber: job.jobTicketNumber,
        status: job.status,
        handoverOtp: undefined, // SECURITY: Never leak customer's secret handover OTP to technician telemetry
        isHandoverOtpRequired: true,
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
          badgeNumber: tech?.badgeNumber || (job as any).technicianBadge || 'TECH-FIELD',
          name: tech?.fullName || job.technicianName,
          phone: tech?.phone || '',
          rating: tech?.rating || 5.0,
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
