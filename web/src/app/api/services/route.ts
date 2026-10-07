import { NextRequest } from 'next/server';
import { dbStore } from '@/lib/mock-data';
import { calculateIndianGst18 } from '@/lib/tax-engine';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const emergencyOnly = searchParams.get('emergencyOnly') === 'true';
    const search = searchParams.get('search')?.toLowerCase();

    let filtered = dbStore.serviceCatalog;

    if (categoryParam) {
      const matchedCat = dbStore.serviceCategories.find(
        (c) => c.slug === categoryParam || c.id === categoryParam
      );
      if (matchedCat) {
        filtered = filtered.filter((s) => s.categoryId === matchedCat.id);
      }
    }

    if (emergencyOnly) {
      filtered = filtered.filter((s) => s.isEmergencySosEligible);
    }

    if (search) {
      filtered = filtered.filter(
        (s) => s.title.toLowerCase().includes(search) || s.code.toLowerCase().includes(search)
      );
    }

    const servicesWithTax = filtered.map((s) => {
      const category = dbStore.serviceCategories.find((c) => c.id === s.categoryId);
      const tax = calculateIndianGst18({ baseLaborInr: s.basePriceInr });

      return {
        id: s.id,
        code: s.code,
        title: s.title,
        categoryId: s.categoryId,
        categoryName: category?.name || 'General',
        basePriceInr: s.basePriceInr,
        gstRatePct: s.gstRatePct,
        estimatedDurationMinutes: s.estimatedDurationMinutes,
        isEmergencySosEligible: s.isEmergencySosEligible,
        pricing: {
          baseAmount: tax.baseLaborInr,
          cgstAmount: tax.cgstAmountInr,
          sgstAmount: tax.sgstAmountInr,
          totalGstAmount: tax.totalGstAmountInr,
          totalPayableInr: tax.totalPayableInr,
          formatted: tax.formattedTotal,
        },
      };
    });

    return apiSuccess(
      {
        count: servicesWithTax.length,
        services: servicesWithTax,
      },
      `Retrieved ${servicesWithTax.length} electrical catalog offerings`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch service offerings', 500, error instanceof Error ? error.message : String(error));
  }
}
