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

    const technicians = await db.getAllTechnicians({
      partnerId,
      pincode,
      isOnline,
      kycStatus,
      search,
    });

    const sortBy = searchParams.get('sortBy') || searchParams.get('orderBy');
    if (sortBy === 'rating') {
      technicians.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'jobs') {
      technicians.sort((a, b) => (b.totalJobsCompleted || 0) - (a.totalJobsCompleted || 0));
    } else if (sortBy === 'distance') {
      technicians.sort((a, b) => ((a as any).distanceKm || 0) - ((b as any).distanceKm || 0));
    }

    const summary = {
      totalCount: technicians.length,
      onlineCount: technicians.filter((t) => t.isOnline).length,
      verifiedKycCount: technicians.filter((t) => t.kycStatus === 'VERIFIED').length,
      pendingKycCount: technicians.filter((t) => t.kycStatus === 'PENDING_REVIEW').length,
    };

    return apiSuccess(
      {
        summary,
        technicians,
      },
      `Retrieved ${technicians.length} technician records`,
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

