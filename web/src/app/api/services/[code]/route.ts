import { NextRequest } from 'next/server';
import { dbStore } from '@/lib/mock-data';
import { calculateIndianGst18 } from '@/lib/tax-engine';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = code.toUpperCase().trim();

    const service = dbStore.serviceCatalog.find(
      (s) => s.code.toUpperCase() === cleanCode || s.id.toLowerCase() === code.toLowerCase()
    );

    if (!service) {
      return apiError(`Service with identifier '${code}' not found in catalog`, 404);
    }

    const category = dbStore.serviceCategories.find((c) => c.id === service.categoryId);
    const tax = calculateIndianGst18({ baseLaborInr: service.basePriceInr });

    return apiSuccess(
      {
        id: service.id,
        code: service.code,
        title: service.title,
        categoryId: service.categoryId,
        categoryName: category?.name || 'General',
        basePriceInr: service.basePriceInr,
        gstRatePct: service.gstRatePct,
        estimatedDurationMinutes: service.estimatedDurationMinutes,
        isEmergencySosEligible: service.isEmergencySosEligible,
        taxBreakdown: tax,
      },
      `Service ${service.code} (${service.title}) loaded`,
      200
    );
  } catch (error) {
    return apiError('Failed to lookup service details', 500, error instanceof Error ? error.message : String(error));
  }
}
