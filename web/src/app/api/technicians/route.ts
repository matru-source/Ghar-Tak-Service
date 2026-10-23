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

import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '+91 ••••••••••';
  const clean = phone.trim();
  return clean.replace(/(\+?\d{2,4})\s*(\d{2})\d{4,6}(\d{2})/, '$1 $2••••••$3');
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
    const maxRadiusKm = parseFloat(searchParams.get('maxRadiusKm') || searchParams.get('radius') || '35.0');

    // Customer GPS coordinates
    const latParam = searchParams.get('lat') || searchParams.get('latitude');
    const lngParam = searchParams.get('lng') || searchParams.get('longitude');
    const hasCoordinates = Boolean(
      latParam && lngParam && !isNaN(parseFloat(latParam)) && !isNaN(parseFloat(lngParam))
    );
    const customerGeo = hasCoordinates
      ? { latitude: parseFloat(latParam!), longitude: parseFloat(lngParam!) }
      : (pincode ? getCoordinatesForPincode(pincode) : null);

    // Check authorization: Admin & Partner see full unmasked PII; customer search gets sanitized PII
    const authHeaderToken = extractBearerToken(request);
    const tokenPayload = authHeaderToken ? await verifyAccessToken(authHeaderToken) : null;
    const isInternalAdmin = tokenPayload?.role === 'SUPER_ADMIN' || tokenPayload?.role === 'PARTNER';

    // If customer provided exact GPS coordinates, do not filter out technicians merely on a pincode boundary.
    // Query online candidates and rank by true radial proximity.
    let technicians = await db.getAllTechnicians({
      partnerId,
      pincode: hasCoordinates ? undefined : pincode,
      isOnline,
      kycStatus,
      search,
    });

    // If no exact match for this pincode (and no coordinates), provide online technicians in same 2-digit postal region
    if (technicians.length === 0 && pincode && !hasCoordinates) {
      const statePrefix = pincode.substring(0, 2);
      const allOnline = await db.getAllTechnicians({ isOnline: true, kycStatus });
      technicians = allOnline.filter((t) => (t.assignedPincode && t.assignedPincode.startsWith(statePrefix)));
    }

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

    let enhancedTechnicians = technicians.map((t: any) => {
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

      // Customer Privacy Shield (DPDP & GDPR Compliance):
      // Mask phone number, withhold private personal email, and withhold exact home coordinates.
      const sanitizedPhone = isInternalAdmin ? (t.phone || '') : maskPhoneNumber(t.phone);

      const payload: Record<string, unknown> = {
        id: t.id,
        badgeNumber: t.badgeNumber,
        fullName: t.fullName,
        rating: t.rating ?? 5.0,
        totalJobsCompleted: t.totalJobsCompleted ?? 0,
        isOnline: t.isOnline ?? true,
        trade: t.trade || 'Certified Professional',
        kycStatus: t.kycStatus || 'VERIFIED',
        assignedPincode: t.assignedPincode,
        isBusy,
        availabilityStatus: isBusy ? 'BUSY_ON_JOB' : 'AVAILABLE',
        area,
        distanceKm: dist,
        etaMinutes: eta,
        distance: distanceDisplay,
        eta: etaDisplay,
        phone: sanitizedPhone,
        maskedPhone: maskPhoneNumber(t.phone),
      };

      if (isInternalAdmin) {
        payload.email = t.email;
        payload.userId = t.userId;
        payload.partnerId = t.partnerId;
        payload.currentLatitude = t.currentLatitude;
        payload.currentLongitude = t.currentLongitude;
        payload.electricalLicenseNumber = t.electricalLicenseNumber;
      }

      return payload;
    });

    // If customer provided GPS, filter to technicians within service radius (or show nearest available)
    if (hasCoordinates && enhancedTechnicians.length > 0) {
      const withinRadius = enhancedTechnicians.filter((t) => ((t.distanceKm as number) <= maxRadiusKm));
      if (withinRadius.length > 0) {
        enhancedTechnicians = withinRadius;
      }
    }

    const sortBy = searchParams.get('sortBy') || searchParams.get('orderBy');
    if (sortBy === 'rating') {
      enhancedTechnicians.sort((a, b) => ((a.isBusy ? 1 : 0) - (b.isBusy ? 1 : 0)) || (((b.rating as number) || 0) - ((a.rating as number) || 0)));
    } else if (sortBy === 'jobs') {
      enhancedTechnicians.sort((a, b) => ((a.isBusy ? 1 : 0) - (b.isBusy ? 1 : 0)) || (((b.totalJobsCompleted as number) || 0) - ((a.totalJobsCompleted as number) || 0)));
    } else {
      enhancedTechnicians.sort((a, b) => ((a.isBusy ? 1 : 0) - (b.isBusy ? 1 : 0)) || ((a.distanceKm as number) - (b.distanceKm as number)));
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
      password,
    } = body;

    if (!fullName || fullName.trim().length < 2) {
      return apiError("'fullName' is required", 400);
    }
    if (!phone || phone.trim().length < 10) {
      return apiError("Valid 10-digit 'phone' is required", 400);
    }

    const cleanPin = (pincode || '').trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return apiError("Valid 6-digit Indian postal 'pincode' is required", 400);
    }

    const registered = await db.registerTechnician({
      id,
      badgeNumber,
      fullName,
      phone,
      email,
      password,
      trade,
      pincode: cleanPin,
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

