import { NextRequest } from 'next/server';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const categoriesWithCount = dbStore.serviceCategories.map((cat) => {
      const services = dbStore.serviceCatalog.filter((s) => s.categoryId === cat.id);
      return {
        ...cat,
        servicesCount: services.length,
        services: services.map((s) => ({
          code: s.code,
          title: s.title,
          basePriceInr: s.basePriceInr,
          isEmergencySosEligible: s.isEmergencySosEligible,
        })),
      };
    });

    return apiSuccess(
      {
        count: categoriesWithCount.length,
        categories: categoriesWithCount,
      },
      `Retrieved ${categoriesWithCount.length} service categories`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch service categories', 500, error instanceof Error ? error.message : String(error));
  }
}
