import { NextRequest } from 'next/server';
import { isDatabaseConnected } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export function getCategoryEmoji(name: string = '', slug: string = ''): string {
  const combined = (name + ' ' + slug).toLowerCase();
  if (combined.includes('electr')) return '💡';
  if (combined.includes('plumb')) return '🚰';
  if (combined.includes('carp')) return '🪚';
  if (combined.includes('clean')) return '🧹';
  if (combined.includes('raj') || combined.includes('mason') || combined.includes('brick')) return '🧱';
  if (combined.includes('cool') || combined.includes('appliance') || combined.includes('ac') || combined.includes('hvac')) return '❄️';
  if (combined.includes('gas') || combined.includes('stove')) return '🔥';
  if (combined.includes('pest')) return '🐜';
  if (combined.includes('pack') || combined.includes('move')) return '📦';
  if (combined.includes('paint')) return '🎨';
  if (combined.includes('cctv') || combined.includes('secur') || combined.includes('camera')) return '📹';
  if (combined.includes('solar') || combined.includes('ev') || combined.includes('energy') || combined.includes('battery')) return '☀️';
  if (combined.includes('glass') || combined.includes('alumin') || combined.includes('window')) return '🪟';
  if (combined.includes('ceiling') || combined.includes('roof')) return '🏠';
  if (combined.includes('it') || combined.includes('tech') || combined.includes('comput') || combined.includes('network')) return '💻';
  if (combined.includes('laund') || combined.includes('wash')) return '🧺';
  if (combined.includes('wall') || combined.includes('paper')) return '🖼️';
  if (combined.includes('generat')) return '⚡';
  if (combined.includes('emerg')) return '🚨';
  if (combined.includes('garden') || combined.includes('lawn')) return '🌱';
  if (combined.includes('lock') || combined.includes('key')) return '🔑';
  if (combined.includes('welding') || combined.includes('iron')) return '⚙️';
  return '🛠️';
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET: Retrieve all active service categories with dynamic service counts
 */

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

function filterCategoriesByTrades(categories: any[], trades: string[]) {
  if (!trades || trades.length === 0) return [];
  const allowedTokens = new Set<string>();
  trades.forEach((tr) => {
    const list = TRADE_CATEGORY_MAP[tr] || [tr.toLowerCase()];
    list.forEach((tok) => allowedTokens.add(tok.toLowerCase()));
  });

  return categories.filter((cat) => {
    const slug = (cat.slug || '').toLowerCase();
    const name = (cat.name || '').toLowerCase();
    const id = (cat.id || '').toLowerCase();
    return (
      allowedTokens.has(id) ||
      allowedTokens.has(slug) ||
      Array.from(allowedTokens).some((tok) => slug.includes(tok) || name.includes(tok) || id.includes(tok))
    );
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeAll') === 'true';
    const pincodeParam = searchParams.get('pincode')?.trim();

    let activeTradesInPin: string[] | null = null;
    if (pincodeParam && pincodeParam.length === 6) {
      const techs = await db.getAllTechnicians({ pincode: pincodeParam });
      activeTradesInPin = Array.from(new Set(techs.map((t: any) => (t.trade || 'ELECTRICAL').toUpperCase())));

      if (techs.length === 0) {
        return apiSuccess(
          {
            count: 0,
            categories: [],
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
        const liveCategories = await prisma.serviceCategory.findMany({
          where: includeInactive ? {} : { isActive: true },
          include: {
            catalogServices: {
              where: { isActive: true },
              select: {
                id: true,
                code: true,
                title: true,
                basePriceInr: true,
              },
            },
          },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });

        if (liveCategories && liveCategories.length > 0) {
          const categoriesWithCount = liveCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            icon: getCategoryEmoji(cat.name, cat.slug),
            displayOrder: cat.displayOrder,
            isActive: cat.isActive,
            servicesCount: cat.catalogServices.length,
            services: cat.catalogServices,
          }));

          let finalCategories = categoriesWithCount;
          if (activeTradesInPin) {
            finalCategories = filterCategoriesByTrades(categoriesWithCount, activeTradesInPin);
          }
          return apiSuccess(
            {
              count: finalCategories.length,
              categories: finalCategories,
              pincode: pincodeParam || undefined,
              availableTrades: activeTradesInPin || undefined,
            },
            `Retrieved ${finalCategories.length} service categories${pincodeParam ? ' for pincode ' + pincodeParam : ''}`,
            200
          );
        }
      } catch (err) {
        console.warn('Prisma categories query fallback:', err);
      }
    }

    const categoriesWithCount = dbStore.serviceCategories.map((cat) => {
      const services = dbStore.serviceCatalog.filter((s: any) => s.categoryId === cat.id && !s.isPaused);
      return {
        ...cat,
        icon: getCategoryEmoji(cat.name, cat.slug),
        servicesCount: services.length,
        services: services.map((s) => ({
          id: s.id,
          code: s.code,
          title: s.title,
          basePriceInr: s.basePriceInr,
        })),
      };
    });

    let finalCategories = categoriesWithCount;
    if (activeTradesInPin) {
      finalCategories = filterCategoriesByTrades(categoriesWithCount, activeTradesInPin);
    }
    return apiSuccess(
      {
        count: finalCategories.length,
        categories: finalCategories,
        pincode: pincodeParam || undefined,
        availableTrades: activeTradesInPin || undefined,
      },
      `Retrieved ${finalCategories.length} service categories${pincodeParam ? ' for pincode ' + pincodeParam : ''}`,
      200
    );
  } catch (error) {
    return apiError('Failed to fetch service categories', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * POST: Create a new service category (Dynamic Category Creator)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, displayOrder } = body;

    if (!name || !name.trim()) {
      return apiError('Category name is required', 400);
    }

    const cleanName = name.trim();
    const baseSlug =
      slug?.trim() ||
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    let finalSlug = baseSlug;

    if (await isDatabaseConnected()) {
      try {
        // Ensure unique slug
        const existingWithSlug = await prisma.serviceCategory.findUnique({
          where: { slug: finalSlug },
        });

        if (existingWithSlug) {
          finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
        }

        const maxOrder = await prisma.serviceCategory.aggregate({
          _max: { displayOrder: true },
        });
        const nextOrder = displayOrder !== undefined ? Number(displayOrder) : (maxOrder._max.displayOrder || 0) + 1;

        const createdCategory = await prisma.serviceCategory.create({
          data: {
            name: cleanName,
            slug: finalSlug,
            description: description?.trim() || undefined,
            displayOrder: nextOrder,
            isActive: true,
          },
        });

        // Also sync to dbStore
        dbStore.serviceCategories.push({
          id: createdCategory.id,
          name: createdCategory.name,
          slug: createdCategory.slug,
          description: createdCategory.description || '',
          displayOrder: createdCategory.displayOrder,
          isActive: true,
        } as any);

        const enriched = {
          ...createdCategory,
          icon: getCategoryEmoji(createdCategory.name, createdCategory.slug),
          servicesCount: 0,
          services: [],
        };

        realtimeBus.publish({
          type: 'CATEGORY_CREATED',
          details: { id: createdCategory.id, name: createdCategory.name, slug: createdCategory.slug },
        });

        return apiSuccess(enriched, `Category "${cleanName}" created successfully`, 201);
      } catch (prismaErr) {
        console.error('Prisma category create error:', prismaErr);
      }
    }

    // Memory fallback
    const newId = `cat_${Date.now()}`;
    const newCat = {
      id: newId,
      name: cleanName,
      slug: finalSlug,
      description: description?.trim() || '',
      displayOrder: dbStore.serviceCategories.length + 1,
      isActive: true,
    };
    dbStore.serviceCategories.push(newCat as any);

    return apiSuccess(
      {
        ...newCat,
        icon: getCategoryEmoji(cleanName, finalSlug),
        servicesCount: 0,
        services: [],
      },
      `Category "${cleanName}" created successfully`,
      201
    );
  } catch (error) {
    return apiError('Failed to create category', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * PATCH: Update an existing service category
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, description, displayOrder, isActive } = body;

    if (!id) {
      return apiError("'id' is required to update category", 400);
    }

    if (await isDatabaseConnected()) {
      try {
        const updateData: any = {};
        if (name && name.trim()) updateData.name = name.trim();
        if (slug && slug.trim()) updateData.slug = slug.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
        if (isActive !== undefined) updateData.isActive = !!isActive;

        const updated = await prisma.serviceCategory.update({
          where: { id },
          data: updateData,
          include: { catalogServices: { where: { isActive: true } } },
        });

        // Sync to dbStore
        const mem = dbStore.serviceCategories.find((c) => c.id === id || c.slug === id);
        if (mem) {
          if (updateData.name) mem.name = updateData.name;
          if (updateData.slug) mem.slug = updateData.slug;
          if (updateData.description !== undefined) mem.description = updateData.description;
        }

        return apiSuccess(
          {
            ...updated,
            icon: getCategoryEmoji(updated.name, updated.slug),
            servicesCount: updated.catalogServices.length,
            services: updated.catalogServices,
          },
          `Category "${updated.name}" updated successfully`,
          200
        );
      } catch (prismaErr) {
        console.error('Prisma category update error:', prismaErr);
      }
    }

    // Memory fallback
    const mem = dbStore.serviceCategories.find((c) => c.id === id || c.slug === id);
    if (!mem) {
      return apiError('Category not found', 404);
    }
    if (name && name.trim()) mem.name = name.trim();
    if (slug && slug.trim()) mem.slug = slug.trim();
    if (description !== undefined) mem.description = description.trim();

    return apiSuccess(
      {
        ...mem,
        icon: getCategoryEmoji(mem.name, mem.slug),
        servicesCount: 0,
        services: [],
      },
      `Category updated successfully`,
      200
    );
  } catch (error) {
    return apiError('Failed to update category', 500, error instanceof Error ? error.message : String(error));
  }
}

/**
 * DELETE: Deactivate a service category
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError("'id' parameter is required to remove category", 400);
    }

    if (await isDatabaseConnected()) {
      try {
        const existing = await prisma.serviceCategory.findUnique({
          where: { id },
          include: { catalogServices: true },
        });

        if (existing) {
          // Check if any services reference this category
          const serviceCount = await prisma.serviceCatalog.count({
            where: { categoryId: existing.id },
          });

          if (serviceCount === 0) {
            // Hard delete empty category
            await prisma.serviceCategory.delete({
              where: { id: existing.id },
            });
          } else {
            // Soft-delete to preserve relationship integrity
            await prisma.serviceCategory.update({
              where: { id: existing.id },
              data: { isActive: false },
            });
          }

          // Sync to dbStore
          const memIdx = dbStore.serviceCategories.findIndex((c) => c.id === id || c.slug === id);
          if (memIdx !== -1) dbStore.serviceCategories.splice(memIdx, 1);

          return apiSuccess(
            { id: existing.id, name: existing.name, permanentlyDeleted: serviceCount === 0 },
            `Category "${existing.name}" ${serviceCount === 0 ? 'permanently removed' : 'deactivated'} successfully`,
            200
          );
        }
      } catch (prismaErr) {
        console.error('Prisma category delete error:', prismaErr);
      }
    }

    const memIdx = dbStore.serviceCategories.findIndex((c) => c.id === id || c.slug === id);
    if (memIdx === -1) {
      return apiError('Category not found', 404);
    }
    const removed = dbStore.serviceCategories.splice(memIdx, 1)[0];
    return apiSuccess(removed, 'Category removed successfully', 200);
  } catch (error) {
    return apiError('Failed to remove category', 500, error instanceof Error ? error.message : String(error));
  }
}
