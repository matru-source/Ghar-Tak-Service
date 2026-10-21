import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Missing or malformed Authorization header. Bearer token required.', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return apiError('Access denied: SUPER_ADMIN role authorization required.', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason, insulatedGlovesVerified, safetyKitSerial, electricalLicenseNumber } = body;

    if (!action || !['VERIFY', 'REJECT'].includes(action)) {
      return apiError("Field 'action' must be either 'VERIFY' or 'REJECT'", 400);
    }

    if (action === 'REJECT' && !reason) {
      return apiError('Rejection requires a documented reason for technician notification', 400);
    }

    const tech = await db.getTechnicianById(id);
    if (!tech) {
      return apiError(`Technician '${id}' not found`, 404);
    }

    if (safetyKitSerial || electricalLicenseNumber) {
      await db.updateTechnicianKyc(id, {
        safetyKitSerial,
        electricalLicenseNumber,
      });
    }

    const updated = await db.updateTechnicianKycStatus(
      id,
      action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
      {
        reason,
        verifierId: payload.sub,
        insulatedGlovesVerified: action === 'VERIFY' ? Boolean(insulatedGlovesVerified) : false,
      }
    );

    return apiSuccess(
      updated,
      action === 'VERIFY'
        ? `Technician '${(tech as any).fullName}' KYC verified and certified for live dispatch`
        : `Technician '${(tech as any).fullName}' KYC rejected. Reason: ${reason}`
    );
  } catch (error) {
    return apiError(
      'Failed to update technician KYC verification status',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
