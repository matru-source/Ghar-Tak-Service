import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

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

    // If no exact match for this pincode, provide online technicians in region
    if (technicians.length === 0 && pincode) {
      const statePrefix = pincode.substring(0, 2);
      const allOnline = await db.getAllTechnicians({ isOnline: true, kycStatus });
      technicians = allOnline.filter((t) => (t.assignedPincode && t.assignedPincode.startsWith(statePrefix)));
      if (technicians.length === 0) {
        technicians = allOnline;
      }
    }

    const enhancedTechnicians = technicians.map((t: any, index: number) => {
      const dist = t.distanceKm !== undefined ? t.distanceKm : Number((1.2 + (index * 0.9)).toFixed(1));
      const eta = t.etaMinutes !== undefined ? t.etaMinutes : Math.max(8, Math.round(dist * 6));
      return {
        ...t,
        distanceKm: dist,
        etaMinutes: eta,
        distance: `${dist} km away`,
        eta: `${eta} mins`,
      };
    });

    const sortBy = searchParams.get('sortBy') || searchParams.get('orderBy');
    if (sortBy === 'rating') {
      enhancedTechnicians.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'jobs') {
      enhancedTechnicians.sort((a, b) => (b.totalJobsCompleted || 0) - (a.totalJobsCompleted || 0));
    } else {
      enhancedTechnicians.sort((a, b) => a.distanceKm - b.distanceKm);
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
      pincode: pincode || '400001',
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

