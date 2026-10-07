import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      electricalLicenseNumber,
      electricalLicenseDocUrl,
      safetyKitSerial,
      aadharDocUrl,
      panDocUrl,
    } = body;

    const existing = await db.getTechnicianById(id);
    if (!existing) {
      return apiError(`Technician '${id}' not found`, 404);
    }

    if (!electricalLicenseNumber && !existing.electricalLicenseNumber) {
      return apiError('Valid government electrical wireman / supervisor license number is mandatory', 400);
    }

    const updated = await db.updateTechnicianKyc(id, {
      electricalLicenseNumber,
      electricalLicenseDocUrl,
      safetyKitSerial,
      aadharDocUrl,
      panDocUrl,
    });

    return apiSuccess(
      updated,
      'KYC documents submitted successfully. Status updated to PENDING_REVIEW for administrator audit.',
      200
    );
  } catch (error) {
    return apiError('Failed to submit KYC documents', 500, error instanceof Error ? error.message : String(error));
  }
}
