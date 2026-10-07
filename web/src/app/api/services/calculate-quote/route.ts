import { NextRequest } from 'next/server';
import { dbStore } from '@/lib/mock-data';
import { calculateIndianGst18 } from '@/lib/tax-engine';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceCode,
      serviceId,
      baseLaborInr,
      materialsCostInr = 0,
      surgeMultiplier = 1.0,
      discountInr = 0,
    } = body;

    let baseLabor = baseLaborInr;

    if (baseLabor === undefined) {
      const codeOrId = serviceCode || serviceId;
      if (!codeOrId) {
        return apiError('Either serviceCode, serviceId, or custom baseLaborInr is required', 400);
      }

      const cleanTarget = String(codeOrId).toUpperCase().trim();
      const matched = dbStore.serviceCatalog.find(
        (s) => s.code.toUpperCase() === cleanTarget || s.id.toLowerCase() === String(codeOrId).toLowerCase()
      );

      if (!matched) {
        return apiError(`Service '${codeOrId}' not found in catalog`, 404);
      }

      baseLabor = matched.basePriceInr;
    }

    if (typeof baseLabor !== 'number' || baseLabor < 0) {
      return apiError('baseLaborInr must be a valid non-negative number', 400);
    }

    const calculation = calculateIndianGst18({
      baseLaborInr: baseLabor,
      materialsCostInr: Number(materialsCostInr) || 0,
      surgeMultiplier: Number(surgeMultiplier) || 1.0,
      discountInr: Number(discountInr) || 0,
    });

    return apiSuccess(
      calculation,
      `Quotation computed: ${calculation.formattedTotal} (includes 18% GST: 9% CGST + 9% SGST)`,
      200
    );
  } catch (error) {
    return apiError('Failed to compute quotation', 500, error instanceof Error ? error.message : String(error));
  }
}
