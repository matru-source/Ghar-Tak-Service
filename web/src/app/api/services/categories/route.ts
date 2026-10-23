import { NextRequest } from 'next/server';
import { isDatabaseConnected } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/mock-data';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    if (await isDatabaseConnected()) {
      try {
        const liveCategories = await prisma.serviceCategory.findMany({
          where: { isActive: true },
          include: { catalogServices: { where: { isActive: true } } },
          orderBy: { displayOrder: 'asc' },
        });

        if (liveCategories && liveCategories.length > 0) {
          const categoriesWithCount = liveCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            servicesCount: cat.catalogServices.length,
            services: cat.catalogServices.map((s) => ({
              id: s.id,
              code: s.code,
              title: s.title,
              basePriceInr: s.basePriceInr,
              isEmergencySosEligible: s.isEmergencySosEligible,
            })),
          }));

          return apiSuccess(
            {
              count: categoriesWithCount.length,
              categories: categoriesWithCount,
            },
            `Retrieved ${categoriesWithCount.length} service categories from live database`,
            200
          );
        }
      } catch (err) {
        console.warn('Prisma categories query fallback:', err);
      }
    }

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

