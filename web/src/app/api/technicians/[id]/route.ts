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
