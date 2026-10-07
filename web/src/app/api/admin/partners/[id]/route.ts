import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partner = await db.getPartnerById(id);

    if (!partner) {
      return apiError(`Franchise partner '${id}' not found`, 404);
    }

    return apiSuccess(partner, `Partner dossier for '${partner.entityName}' retrieved`);
  } catch (error) {
    return apiError(
      'Failed to retrieve partner dossier',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.updatePartner(id, body);
    if (!updated) {
      return apiError(`Franchise partner '${id}' not found`, 404);
    }

    return apiSuccess(updated, `Partner '${updated.entityName}' settings updated successfully`);
  } catch (error) {
    return apiError(
      'Failed to update partner settings',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
