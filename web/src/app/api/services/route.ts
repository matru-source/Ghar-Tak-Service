import { NextRequest } from 'next/server';
import { db, isDatabaseConnected } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { calculateIndianGst18 } from '@/lib/tax-engine';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';
import { extractBearerToken, verifyAccessToken } from '@/lib/jwt';

const TRADE_CATEGORY_MAP: Record<string, string[]> = {
  CARPENTRY: ['cat_carpenter', 'carpentry', 'carpenter', 'furniture'],
  ELECTRICAL: ['cat_electrician', 'electrical', 'electrician'],
  PLUMBING: ['cat_plumber', 'plumbing', 'plumber'],
  APPLIANCE: ['cat_hot_cool', 'cat_gas_stove', 'cat_generator', 'appliance', 'ac', 'refrigerator', 'geyser', 'heating', 'cool'],
  CLEANING: ['cat_cleaner', 'cat_laundry', 'cat_pest_control', 'cleaning', 'cleaner'],
  PAINTING: ['cat_house_painting', 'cat_wallpaper', 'painting', 'painter'],
  MASONRY: ['cat_rajmistri', 'cat_false_ceiling', 'cat_aluminum_glass', 'masonry'],
  IT_SECURITY: ['cat_cctv', 'cat_it_service', 'cat_digital_marketer', 'cctv'],
};

function filterServicesByTrades(services: any[], trades: string[]) {
  if (!trades || trades.length === 0) return [];
  const allowedTokens = new Set<string>();
  trades.forEach((tr) => {
    const list = TRADE_CATEGORY_MAP[tr] || [tr.toLowerCase()];
    list.forEach((tok) => allowedTokens.add(tok.toLowerCase()));
  });

  return services.filter((srv) => {
    const catId = (srv.categoryId || '').toLowerCase();
    const catName = (srv.categoryName || '').toLowerCase();
    const code = (srv.code || '').toLowerCase();
    return (
      allowedTokens.has(catId) ||
      Array.from(allowedTokens).some((tok) => catId.includes(tok) || catName.includes(tok) || code.includes(tok))
    );
  });
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const emergencyOnly = searchParams.get('emergencyOnly') === 'true';
    const search = searchParams.get('search')?.toLowerCase();
    const includeAll = searchParams.get('includeAll') === 'true';
    const pincodeParam = searchParams.get('pincode')?.trim();

    // Hyperlocal Skill Matchmaking: If customer enters pincode, resolve available trades
    let activeTradesInPin: string[] | null = null;
    if (pincodeParam && pincodeParam.length === 6) {
      const techs = await db.getAllTechnicians({ pincode: pincodeParam });
      activeTradesInPin = Array.from(new Set(techs.map((t: any) => (t.trade || 'ELECTRICAL').toUpperCase())));

      // If no technicians in this pincode, immediately return empty with coverage notice
      if (techs.length === 0) {
        return apiSuccess(
          {
            count: 0,
            services: [],
            availableTrades: [],
            pincode: pincodeParam,
            isServiceable: false,
            message: `No technicians are currently stationed in pincode ${pincodeParam}. Territory coverage pending.`,
          },
          `No active technicians stationed in pincode ${pincodeParam}`,
          200
        );
      }
    }

    if (await isDatabaseConnected()) {
      try {
        const whereClause: any = includeAll ? {} : { isActive: true };

        if (categoryParam && categoryParam !== 'ALL') {
          whereClause.category = {
            OR: [
              { slug: categoryParam },
              { id: categoryParam },
              { name: { contains: categoryParam, mode: 'insensitive' } },
            ],
          };
        }

        if (emergencyOnly) {
          whereClause.isEmergencySosEligible = true;
        }

        if (search) {
          whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        const liveServices = await prisma.serviceCatalog.findMany({
          where: whereClause,
          include: { category: true },
          orderBy: { title: 'asc' },
        });

        if (liveServices.length > 0 || categoryParam || search || emergencyOnly || includeAll) {
          const servicesWithTax = liveServices.map((s) => {
            const tax = calculateIndianGst18({ baseLaborInr: s.basePriceInr });
            return {
              id: s.id,
              code: s.code,
              title: s.title,
              categoryId: s.categoryId,
              categoryName: s.category?.name || 'General',
              basePriceInr: s.basePriceInr,
              gstRatePct: s.gstRatePct,
              estimatedDurationMinutes: s.estimatedDurationMinutes,
              isEmergencySosEligible: s.isEmergencySosEligible,
              isPaused: !s.isActive,
              description: s.description || undefined,
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

          let finalServices = servicesWithTax;
          if (activeTradesInPin) {
            finalServices = filterServicesByTrades(servicesWithTax, activeTradesInPin);
          }
          return apiSuccess(
            {
              count: finalServices.length,
              services: finalServices,
              pincode: pincodeParam || undefined,
              availableTrades: activeTradesInPin || undefined,
            },
            `Retrieved ${finalServices.length} service catalog offerings${pincodeParam ? ' for pincode ' + pincodeParam : ''}`,
            200
          );
        }
      } catch (err) {
        console.warn('Prisma services query fallback:', err);
      }
    }

    let filtered = dbStore.serviceCatalog;

    if (!includeAll) {
      filtered = filtered.filter((s: any) => !s.isPaused);
    }

    if (categoryParam && categoryParam !== 'ALL') {
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
        description: (s as any).description,
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

    let finalServices = servicesWithTax;
    if (activeTradesInPin) {
      finalServices = filterServicesByTrades(servicesWithTax, activeTradesInPin);
    }
    return apiSuccess(
      {
        count: finalServices.length,
        services: finalServices,
        pincode: pincodeParam || undefined,
        availableTrades: activeTradesInPin || undefined,
      },
      `Retrieved ${finalServices.length} service catalog offerings${pincodeParam ? ' for pincode ' + pincodeParam : ''}`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch service offerings', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * POST: Add a new service offering to catalog
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      categoryId,
      categorySlug,
      basePriceInr,
      estimatedDurationMinutes,
      isEmergencySosEligible,
      code,
      description,
    } = body;

    if (!title || !basePriceInr) {
      return apiError('Service title and basePriceInr are required', 400);
    }

    const cleanTitle = title.trim();
    const numPrice = Number(basePriceInr);
    const numDuration = Number(estimatedDurationMinutes) || 45;
    const isSos = !!isEmergencySosEligible;

    let targetCatId = categoryId;

    if (await isDatabaseConnected()) {
      try {
        if (targetCatId) {
          const found = await prisma.serviceCategory.findFirst({
            where: { OR: [{ id: targetCatId }, { slug: targetCatId }] },
          });
          if (found) targetCatId = found.id;
        } else if (categorySlug) {
          const found = await prisma.serviceCategory.findFirst({
            where: { OR: [{ slug: categorySlug }, { id: categorySlug }] },
          });
          if (found) targetCatId = found.id;
        }

        if (!targetCatId) {
          const defaultCat = await prisma.serviceCategory.findFirst();
          targetCatId = defaultCat?.id;
        }

        if (!targetCatId) {
          const createdCat = await prisma.serviceCategory.create({
            data: {
              name: 'General Maintenance',
              slug: 'general-maintenance',
            },
          });
          targetCatId = createdCat.id;
        }

        const generatedCode =
          code ||
          `SRV-${cleanTitle.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(100 + Math.random() * 900)}`;

        const createdService = await prisma.serviceCatalog.create({
          data: {
            title: cleanTitle,
            code: generatedCode,
            basePriceInr: numPrice,
            gstRatePct: 18.0,
            estimatedDurationMinutes: numDuration,
            isEmergencySosEligible: isSos,
            description: description || undefined,
            isActive: true,
            categoryId: targetCatId,
          },
          include: { category: true },
        });

        // Also sync to dbStore
        dbStore.serviceCatalog.unshift({
          id: createdService.id,
          categoryId: createdService.categoryId,
          title: createdService.title,
          code: createdService.code,
          basePriceInr: createdService.basePriceInr,
          gstRatePct: 18.0,
          estimatedDurationMinutes: createdService.estimatedDurationMinutes,
          isEmergencySosEligible: createdService.isEmergencySosEligible,
        } as any);

        const tax = calculateIndianGst18({ baseLaborInr: createdService.basePriceInr });
        realtimeBus.publish({
          type: 'SERVICE_CREATED',
          details: { id: createdService.id, title: createdService.title, code: createdService.code },
        });

        return apiSuccess(
          {
            ...createdService,
            categoryName: createdService.category?.name || 'General',
            isPaused: false,
            pricing: {
              baseAmount: tax.baseLaborInr,
              cgstAmount: tax.cgstAmountInr,
              sgstAmount: tax.sgstAmountInr,
              totalGstAmount: tax.totalGstAmountInr,
              totalPayableInr: tax.totalPayableInr,
              formatted: tax.formattedTotal,
            },
          },
          `Service "${cleanTitle}" added successfully to catalog`,
          201
        );
      } catch (prismaErr) {
        console.error('Prisma service create error:', prismaErr);
      }
    }

    // Memory fallback
    if (!targetCatId && categorySlug) {
      const found = dbStore.serviceCategories.find((c) => c.slug === categorySlug);
      if (found) targetCatId = found.id;
    }
    targetCatId = targetCatId || dbStore.serviceCategories[0]?.id || 'cat_electrician';

    const newCode =
      code ||
      `SRV-${cleanTitle.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(10 + Math.random() * 90)}`;
    const newService = {
      id: `srv_${Date.now()}`,
      categoryId: targetCatId,
      title: cleanTitle,
      code: newCode,
      basePriceInr: numPrice,
      gstRatePct: 18.0,
      estimatedDurationMinutes: numDuration,
      isEmergencySosEligible: isSos,
      isPaused: false,
      description: description || undefined,
    };

    dbStore.serviceCatalog.unshift(newService as any);

    return apiSuccess(newService, 'Service offering added successfully to catalog', 201);
  } catch (error) {
    return apiError('Failed to create service offering', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * PATCH: Edit/Update an existing service offering or toggle Pause
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      code,
      categoryId,
      categorySlug,
      basePriceInr,
      estimatedDurationMinutes,
      isEmergencySosEligible,
      isPaused,
      description,
    } = body;

    if (!id) {
      return apiError("'id' is required to update service", 400);
    }

    if (await isDatabaseConnected()) {
      try {
        const existing = await prisma.serviceCatalog.findFirst({
          where: { OR: [{ id }, { code: id }] },
        });

        if (existing) {
          const updateData: any = {};

          if (title && title.trim()) updateData.title = title.trim();
          if (typeof basePriceInr === 'number' && basePriceInr > 0) updateData.basePriceInr = basePriceInr;
          if (typeof estimatedDurationMinutes === 'number' && estimatedDurationMinutes > 0) {
            updateData.estimatedDurationMinutes = estimatedDurationMinutes;
          }
          if (typeof isEmergencySosEligible === 'boolean') updateData.isEmergencySosEligible = isEmergencySosEligible;
          if (typeof isPaused === 'boolean') updateData.isActive = !isPaused;
          if (description !== undefined) updateData.description = description;

          if (categoryId) {
            const cat = await prisma.serviceCategory.findFirst({
              where: { OR: [{ id: categoryId }, { slug: categoryId }] },
            });
            if (cat) updateData.categoryId = cat.id;
          } else if (categorySlug) {
            const cat = await prisma.serviceCategory.findFirst({
              where: { OR: [{ slug: categorySlug }, { id: categorySlug }] },
            });
            if (cat) updateData.categoryId = cat.id;
          }

          const updated = await prisma.serviceCatalog.update({
            where: { id: existing.id },
            data: updateData,
            include: { category: true },
          });

          // Sync to dbStore
          const mem = dbStore.serviceCatalog.find((s) => s.id === existing.id || s.code === existing.code);
          if (mem) {
            if (updateData.title) mem.title = updateData.title;
            if (updateData.basePriceInr) mem.basePriceInr = updateData.basePriceInr;
            if (updateData.estimatedDurationMinutes) mem.estimatedDurationMinutes = updateData.estimatedDurationMinutes;
            if (typeof isPaused === 'boolean') (mem as any).isPaused = isPaused;
          }

          const tax = calculateIndianGst18({ baseLaborInr: updated.basePriceInr });
          realtimeBus.publish({
            type: 'SERVICE_UPDATED',
            details: { id: updated.id, title: updated.title, isPaused: !updated.isActive },
          });

          return apiSuccess(
            {
              ...updated,
              categoryName: updated.category?.name || 'General',
              isPaused: !updated.isActive,
              pricing: {
                baseAmount: tax.baseLaborInr,
                cgstAmount: tax.cgstAmountInr,
                sgstAmount: tax.sgstAmountInr,
                totalGstAmount: tax.totalGstAmountInr,
                totalPayableInr: tax.totalPayableInr,
                formatted: tax.formattedTotal,
              },
            },
            `Service "${updated.title}" updated successfully`,
            200
          );
        }
      } catch (prismaErr) {
        console.error('Prisma service update error:', prismaErr);
      }
    }

    // Memory fallback
    const item = dbStore.serviceCatalog.find((s) => s.id === id || s.code === id);
    if (!item) {
      return apiError('Service offering not found', 404);
    }

    if (title && title.trim()) item.title = title.trim();
    if (typeof isPaused === 'boolean') (item as any).isPaused = isPaused;
    if (typeof basePriceInr === 'number' && basePriceInr > 0) item.basePriceInr = basePriceInr;
    if (typeof estimatedDurationMinutes === 'number' && estimatedDurationMinutes > 0) {
      item.estimatedDurationMinutes = estimatedDurationMinutes;
    }
    if (typeof isEmergencySosEligible === 'boolean') item.isEmergencySosEligible = isEmergencySosEligible;

    return apiSuccess(item, `Service updated successfully`, 200);
  } catch (error) {
    return apiError('Failed to update service offering', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * DELETE: Remove or deactivate a service offering from catalog
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError("'id' parameter is required to remove service", 400);
    }

    if (await isDatabaseConnected()) {
      try {
        const existing = await prisma.serviceCatalog.findFirst({
          where: { OR: [{ id }, { code: id }] },
        });

        if (existing) {
          // Check if any jobs reference this service
          const jobCount = await prisma.job.count({
            where: { serviceId: existing.id },
          });

          if (jobCount === 0) {
            // Hard delete from PostgreSQL if no historical jobs exist
            await prisma.serviceCatalog.delete({
              where: { id: existing.id },
            });
          } else {
            // Soft-delete by marking inactive so historical work orders preserve foreign key references
            await prisma.serviceCatalog.update({
              where: { id: existing.id },
              data: { isActive: false },
            });
          }

          // Also remove from dbStore
          const memIdx = dbStore.serviceCatalog.findIndex((s) => s.id === existing.id || s.code === existing.code);
          if (memIdx !== -1) dbStore.serviceCatalog.splice(memIdx, 1);

          realtimeBus.publish({
            type: 'SERVICE_UPDATED',
            details: { id: existing.id, title: existing.title, deleted: true },
          });

          return apiSuccess(
            { id: existing.id, title: existing.title, permanentlyDeleted: jobCount === 0 },
            `Service "${existing.title}" ${jobCount === 0 ? 'permanently removed' : 'deactivated'} from catalog`,
            200
          );
        }
      } catch (prismaErr) {
        console.error('Prisma service delete error:', prismaErr);
      }
    }

    const idx = dbStore.serviceCatalog.findIndex((s) => s.id === id || s.code === id);
    if (idx === -1) {
      return apiError('Service offering not found', 404);
    }

    const removed = dbStore.serviceCatalog.splice(idx, 1)[0];
    return apiSuccess(removed, 'Service offering removed from catalog', 200);
  } catch (error) {
    return apiError('Failed to remove service offering', 500, error instanceof Error ? error.message : String(error));
  }
}
