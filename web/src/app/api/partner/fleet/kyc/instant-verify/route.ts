import { NextRequest, NextResponse } from 'next/server';
import { kycVerificationService } from '@/lib/kyc-verification';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (token) {
      const payload = await verifyAccessToken(token);
      if (!payload || (payload.role !== 'PARTNER' && payload.role !== 'SUPER_ADMIN')) {
        return NextResponse.json(
          { success: false, error: 'Access denied: PARTNER or SUPER_ADMIN role required' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { technicianId } = body;

    if (!technicianId) {
      return NextResponse.json(
        { success: false, error: 'technicianId is required for instant verification' },
        { status: 400 }
      );
    }

    const result = await kycVerificationService.verifyTechnicianKyc(technicianId);

    return NextResponse.json({
      success: result.overallStatus === 'VERIFIED',
      verification: result,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Instant KYC verification failed' },
      { status: 500 }
    );
  }
}
