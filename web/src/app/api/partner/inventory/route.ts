import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET /api/partner/inventory
 * Franchise local warehouse inventory stock management (Issue 35)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId') || 'ptnr_mah_01';
    const category = searchParams.get('category') || undefined;

    let inventory = await db.getPartnerInventory(partnerId);
    if (category && category !== 'ALL') {
      inventory = inventory.filter((item: any) => item.category === category);
    }

    const totalSkus = inventory.length;
    const totalUnitsInStock = inventory.reduce((sum: number, item: any) => sum + item.stockQuantity, 0);
    const lowStockItems = inventory.filter((item: any) => item.stockQuantity <= 10);
    const totalInventoryValueInr = inventory.reduce(
      (sum: number, item: any) => sum + (item.costPriceInr * item.stockQuantity),
      0
    );

    return apiSuccess(
      {
        partnerId,
        totalSkus,
        totalUnitsInStock,
        totalInventoryValueInr: Math.round(totalInventoryValueInr * 100) / 100,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        inventory,
      },
      `Retrieved ${totalSkus} warehouse SKUs (${totalUnitsInStock} units in stock)`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to load partner warehouse inventory',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
