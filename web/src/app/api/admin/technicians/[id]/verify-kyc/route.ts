import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, insulatedGlovesVerified, verifierId, safetyKitSerial, electricalLicenseNumber } = body;

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
        verifierId: verifierId || 'usr_admin_01',
        insulatedGlovesVerified: action === 'VERIFY' ? (insulatedGlovesVerified ?? true) : false,
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
