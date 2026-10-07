import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  try {
    const { pincode } = await params;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return apiError('Valid 6-digit Indian postal pincode is required (e.g. 400001)', 400);
    }

    const coverage = await db.getPincodeCoverage(pincode);

    if (!coverage || !coverage.isActive) {
      return apiError(
        `Pincode ${pincode} is currently not within active ElectriCare territory coverage. Expansion planned soon!`,
        404
      );
    }

    // Get technicians active in this postal jurisdiction
    const techniciansInCluster = dbStore.technicians.filter(
      (t) => t.assignedPincode === pincode && t.isOnline
    );

    return apiSuccess(
      {
        pincode: coverage.pincode,
        areaName: coverage.areaName,
        district: coverage.district,
        state: coverage.state,
        densityClassification: coverage.density,
        targetEtaMinutes: coverage.targetEtaMinutes,
        activeCapacityCount: coverage.activeCapacityCount,
        isExclusive: coverage.isExclusive,
        serviceable: true,
        assignedPartner: coverage.partner
          ? {
              id: coverage.partner.id,
              entityName: coverage.partner.entityName,
              stateLicensed: coverage.partner.stateLicensed,
              status: coverage.partner.status,
            }
          : null,
        activeTechniciansOnline: techniciansInCluster.map((t) => ({
          id: t.id,
          badgeNumber: t.badgeNumber,
          fullName: t.fullName,
          rating: t.rating,
          totalJobsCompleted: t.totalJobsCompleted,
          insulatedGlovesVerified: t.insulatedGlovesVerified,
        })),
      },
      `Pincode ${pincode} (${coverage.areaName}) is active and serviceable`,
      200
    );
  } catch (error) {
    return apiError('Failed to lookup pincode coverage', 500, error instanceof Error ? error.message : String(error));
  }
}
