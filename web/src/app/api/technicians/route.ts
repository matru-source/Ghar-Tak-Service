import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import {
  getCoordinatesForPincode,
  calculateHaversineDistanceKm,
  calculateEtaMinutes,
  resolveAreaFromCoordinates,
} from '@/lib/pincode-resolver';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || undefined;
    const pincode = searchParams.get('pincode') || undefined;
    const isOnlineParam = searchParams.get('isOnline');
    const isOnline = isOnlineParam !== null ? isOnlineParam === 'true' : undefined;
    const kycStatus = searchParams.get('kycStatus') || undefined;
    const search = searchParams.get('search') || undefined;

    let technicians = await db.getAllTechnicians({
      partnerId,
      pincode,
      isOnline,
      kycStatus,
      search,
    });

    // If no exact match for this pincode, provide online technicians in same 2-digit postal region
    if (technicians.length === 0 && pincode) {
      const statePrefix = pincode.substring(0, 2);
      const allOnline = await db.getAllTechnicians({ isOnline: true, kycStatus });
      technicians = allOnline.filter((t) => (t.assignedPincode && t.assignedPincode.startsWith(statePrefix)));
    }

    // Resolve customer coordinates from params or pincode
    const latParam = searchParams.get('lat') || searchParams.get('latitude');
    const lngParam = searchParams.get('lng') || searchParams.get('longitude');
    const customerGeo = (latParam && lngParam)
      ? { latitude: parseFloat(latParam), longitude: parseFloat(lngParam) }
      : (pincode ? getCoordinatesForPincode(pincode) : null);

    const busyTechnicianIds = new Set<string>();
    for (const j of dbStore.jobs) {
      if (['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'SAFETY_CHECKED'].includes(j.status)) {
        if (j.technicianId) busyTechnicianIds.add(j.technicianId);
      }
    }
    try {
      const activePrismaJobs = await prisma.job.findMany({
        where: {
          status: { in: ['ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'SAFETY_CHECKED'] as any },
          technicianId: { not: null },
        },
        select: { technicianId: true },
      });
      for (const pj of activePrismaJobs) {
        if (pj.technicianId) busyTechnicianIds.add(pj.technicianId);
      }
    } catch {
      // Prisma offline or schema mismatch
    }

    const enhancedTechnicians = technicians.map((t: any, index: number) => {
      let dist: number;
      let eta: number;

      const techLat = t.currentLatitude || (t.assignedPincode ? getCoordinatesForPincode(t.assignedPincode).latitude : null);
      const techLng = t.currentLongitude || (t.assignedPincode ? getCoordinatesForPincode(t.assignedPincode).longitude : null);

      if (customerGeo && techLat && techLng) {
        const rawDist = calculateHaversineDistanceKm(
          techLat,
          techLng,
          customerGeo.latitude,
          customerGeo.longitude
        );
        // If in same building or same device (< 50 meters), show exact 0.0 km
        if (rawDist < 0.05) {
          dist = 0.0;
          eta = 1;
        } else {
          dist = Number(rawDist.toFixed(1));
          eta = calculateEtaMinutes(dist, 25.0);
        }
      } else {
        dist = t.distanceKm ?? 0.5;
        eta = t.etaMinutes ?? 2;
      }

      const area = resolveAreaFromCoordinates(techLat || customerGeo?.latitude || 20.6678, techLng || customerGeo?.longitude || 85.5959);

      const isBusy = busyTechnicianIds.has(t.id);
      const distanceDisplay = dist <= 0.0 ? '0.0 km away (Same Location)' : `${dist} km away`;
      const etaDisplay = eta <= 1 ? '1 min (Immediate)' : `${eta} mins`;

      return {
        ...t,
        isBusy,
        availabilityStatus: isBusy ? 'BUSY_ON_JOB' : 'AVAILABLE',
        area,
        distanceKm: dist,
        etaMinutes: eta,
        distance: distanceDisplay,
        eta: etaDisplay,
      };
    });

    const sortBy = searchParams.get('sortBy') || searchParams.get('orderBy');
    if (sortBy === 'rating') {
      enhancedTechnicians.sort((a, b) => (a.isBusy ? 1 : 0) - (b.isBusy ? 1 : 0) || (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'jobs') {
      enhancedTechnicians.sort((a, b) => (a.isBusy ? 1 : 0) - (b.isBusy ? 1 : 0) || (b.totalJobsCompleted || 0) - (a.totalJobsCompleted || 0));
    } else {
      enhancedTechnicians.sort((a, b) => (a.isBusy ? 1 : 0) - (b.isBusy ? 1 : 0) || a.distanceKm - b.distanceKm);
    }

    const summary = {
      totalCount: enhancedTechnicians.length,
      onlineCount: enhancedTechnicians.filter((t) => t.isOnline).length,
      verifiedKycCount: enhancedTechnicians.filter((t) => t.kycStatus === 'VERIFIED').length,
      pendingKycCount: enhancedTechnicians.filter((t) => t.kycStatus === 'PENDING_REVIEW').length,
    };

    return apiSuccess(
      {
        summary,
        technicians: enhancedTechnicians,
      },
      `Retrieved ${enhancedTechnicians.length} technician records`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch technicians fleet roster', 500, error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      pincode,
      trade,
      badgeNumber,
      id,
      latitude,
      longitude,
    } = body;

    if (!fullName || fullName.trim().length < 2) {
      return apiError("'fullName' is required", 400);
    }
    if (!phone || phone.trim().length < 10) {
      return apiError("Valid 10-digit 'phone' is required", 400);
    }

    const registered = await db.registerTechnician({
      id,
      badgeNumber,
      fullName,
      phone,
      email,
      trade,
      pincode: pincode || '759001',
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    });

    return apiSuccess(
      registered,
      `Technician ${registered.fullName} successfully registered and connected to dispatch roster`,
      201
    );
  } catch (error) {
    return apiError('Failed to register technician', 500, error instanceof Error ? error.message : String(error));
  }
}

