import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

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
      partnerId: partnerId === 'ALL' ? undefined : partnerId,
      pincode: pincode === 'ALL' ? undefined : pincode,
      isOnline,
      kycStatus: kycStatus === 'ALL' ? undefined : kycStatus,
      search,
    });

    // Compute KYC breakdown
    const all = await db.getAllTechnicians();
    const totalCount = all.length;
    const verifiedCount = all.filter((t: any) => t.kycStatus === 'VERIFIED').length;
    const pendingReviewCount = all.filter((t: any) => t.kycStatus === 'PENDING_REVIEW').length;
    const rejectedCount = all.filter((t: any) => t.kycStatus === 'REJECTED').length;
    const onlineCount = all.filter((t: any) => t.isOnline).length;
    const safetyCompliantCount = all.filter((t: any) => t.insulatedGlovesVerified).length;

    return apiSuccess(
      {
        technicians,
        metrics: {
          totalCount,
          verifiedCount,
          pendingReviewCount,
          rejectedCount,
          onlineCount,
          safetyCompliantCount,
        },
      },
      'Technicians fleet directory and KYC registry retrieved'
    );
  } catch (error) {
    return apiError(
      'Failed to retrieve technician fleet',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
