import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const technician = await db.getTechnicianById(id);

    if (!technician) {
      return apiError(`Technician with ID '${id}' not found in registry`, 404);
    }

    return apiSuccess(
      technician,
      `Technician dossier for ${'fullName' in technician ? technician.fullName : technician.id} loaded`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch technician dossier', 500, error instanceof Error ? error.message : String(error));
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.fullName !== undefined) updates.fullName = body.fullName;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
    if (body.trade !== undefined || body.specialization !== undefined) {
      updates.trade = body.trade || body.specialization;
    }
    if (body.assignedPincode !== undefined || body.pincode !== undefined) {
      updates.assignedPincode = body.assignedPincode || body.pincode;
    }
    if (body.currentLatitude !== undefined || body.latitude !== undefined) {
      updates.currentLatitude = body.currentLatitude ?? body.latitude;
    }
    if (body.currentLongitude !== undefined || body.longitude !== undefined) {
      updates.currentLongitude = body.currentLongitude ?? body.longitude;
    }
    if (body.isOnline !== undefined) updates.isOnline = Boolean(body.isOnline);
    if (body.electricalLicenseNumber !== undefined || body.license !== undefined) {
      updates.electricalLicenseNumber = body.electricalLicenseNumber || body.license;
    }
    if (body.insulatedGlovesVerified !== undefined) {
      updates.insulatedGlovesVerified = Boolean(body.insulatedGlovesVerified);
    }
    if (body.safetyKitSerial !== undefined) updates.safetyKitSerial = body.safetyKitSerial;
    if (body.partnerId !== undefined) updates.partnerId = body.partnerId;

    const updated = await db.updateTechnician(id, updates);
    if (!updated) {
      return apiError(`Technician '${id}' not found to update`, 404);
    }

    return apiSuccess(
      updated,
      `Technician ${'fullName' in updated ? updated.fullName : id} profile successfully synced and updated`,
      200
    );
  } catch (error) {
    return apiError('Failed to update technician profile', 500, error instanceof Error ? error.message : String(error));
  }
}
