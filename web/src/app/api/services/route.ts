import { NextRequest } from 'next/server';
import { dbStore } from '@/lib/mock-data';
import { calculateIndianGst18 } from '@/lib/tax-engine';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

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
        isPaused: !!(s as any).isPaused,
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
      `Retrieved ${servicesWithTax.length} service catalog offerings`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch service offerings', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * POST: Add a new service offering to partner territory catalog
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Authorization Bearer token required', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'PARTNER')) {
      return apiError('Access denied: SUPER_ADMIN or PARTNER role required', 403);
    }

    const body = await request.json();
    const { title, categoryId, categorySlug, basePriceInr, estimatedDurationMinutes, isEmergencySosEligible, code } = body;

    if (!title || !basePriceInr) {
      return apiError('Service title and basePriceInr are required', 400);
    }

    let targetCatId = categoryId;
    if (!targetCatId && categorySlug) {
      const found = dbStore.serviceCategories.find(c => c.slug === categorySlug);
      if (found) targetCatId = found.id;
    }
    if (!targetCatId) {
      targetCatId = dbStore.serviceCategories[0]?.id || 'cat_electrician';
    }

    const newCode = code || `SRV-${title.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(10 + Math.random() * 90)}`;
    const newService = {
      id: `srv_${Date.now()}`,
      categoryId: targetCatId,
      title: title.trim(),
      code: newCode,
      basePriceInr: Number(basePriceInr),
      gstRatePct: 18.0,
      estimatedDurationMinutes: Number(estimatedDurationMinutes) || 45,
      isEmergencySosEligible: !!isEmergencySosEligible,
      isPaused: false,
    };

    dbStore.serviceCatalog.unshift(newService as any);

    return apiSuccess(newService, 'Service offering added successfully to partner catalog', 201);
  } catch (error) {
    return apiError('Failed to create service offering', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * PATCH: Pause, resume, or update an existing service offering
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Authorization Bearer token required', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'PARTNER')) {
      return apiError('Access denied: SUPER_ADMIN or PARTNER role required', 403);
    }

    const body = await request.json();
    const { id, isPaused, basePriceInr, estimatedDurationMinutes } = body;

    if (!id) {
      return apiError("'id' is required to update service", 400);
    }

    const item = dbStore.serviceCatalog.find(s => s.id === id || s.code === id);
    if (!item) {
      return apiError('Service offering not found', 404);
    }

    if (typeof isPaused === 'boolean') {
      (item as any).isPaused = isPaused;
    }
    if (typeof basePriceInr === 'number' && basePriceInr > 0) {
      item.basePriceInr = basePriceInr;
    }
    if (typeof estimatedDurationMinutes === 'number' && estimatedDurationMinutes > 0) {
      item.estimatedDurationMinutes = estimatedDurationMinutes;
    }

    return apiSuccess(item, `Service ${(item as any).isPaused ? 'paused' : 'updated'} successfully`, 200);
  } catch (error) {
    return apiError('Failed to update service offering', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * DELETE: Remove a service offering from catalog
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (!token) {
      return apiError('Authorization Bearer token required', 401);
    }
    const payload = await verifyAccessToken(token);
    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'PARTNER')) {
      return apiError('Access denied: SUPER_ADMIN or PARTNER role required', 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError("'id' parameter is required to remove service", 400);
    }

    const idx = dbStore.serviceCatalog.findIndex(s => s.id === id || s.code === id);
    if (idx === -1) {
      return apiError('Service offering not found', 404);
    }

    const removed = dbStore.serviceCatalog.splice(idx, 1)[0];
    return apiSuccess(removed, 'Service offering removed from catalog', 200);
  } catch (error) {
    return apiError('Failed to remove service offering', 500, error instanceof Error ? error.message : String(error));
  }
}
