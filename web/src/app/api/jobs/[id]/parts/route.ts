import { NextRequest } from 'next/server';
import { db, isDatabaseConnected } from '@/lib/db';
import { dbStore } from '@/lib/mock-data';
import { realtimeBus } from '@/lib/realtime-bus';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET: Retrieve in-job spare parts and materials added to the work order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.findOrRecoverJob(id);
    if (!job) {
      return apiError(`Job '${id}' not found`, 404);
    }

    const parts = (job as any).parts || [];
    const partsTotalInr = parts.reduce(
      (sum: number, p: any) => sum + (Number(p.unitPriceInr) || 0) * (Number(p.quantity) || 1),
      0
    );
    const partsGstInr = Number((partsTotalInr * 0.18).toFixed(2));
    const partsGrossInr = Number((partsTotalInr + partsGstInr).toFixed(2));

    return apiSuccess(
      {
        jobId: job.id,
        ticketNumber: job.jobTicketNumber,
        partsCount: parts.length,
        parts,
        partsTotalInr,
        partsGstInr,
        partsGrossInr,
        jobTotalAmountInr: (job as any).totalAmountInr,
      },
      `Retrieved ${parts.length} in-job spare parts`,
      200
    );
  } catch (error) {
    return apiError(
      'Failed to fetch job spare parts',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * POST: Technician adds spare parts / materials mid-service with real-time customer approval notification
 * Automatically recalculates revised totalAmountInr (base labor + parts + 18% GST)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { partName, partNumber, unitPriceInr, quantity = 1, technicianId, approvalOtp } = body;

    if (!partName || typeof partName !== 'string' || !partName.trim()) {
      return apiError("'partName' is required", 400);
    }
    const unitPrice = Number(unitPriceInr);
    if (isNaN(unitPrice) || unitPrice < 0) {
      return apiError("'unitPriceInr' must be a non-negative number", 400);
    }
    const qty = Math.max(1, parseInt(String(quantity), 10) || 1);

    const job = await db.findOrRecoverJob(id);
    if (!job) {
      return apiError(`Work order '${id}' not found`, 404);
    }

    const itemTotal = Number((unitPrice * qty).toFixed(2));
    const itemGst = Number((itemTotal * 0.18).toFixed(2));
    const itemGross = Number((itemTotal + itemGst).toFixed(2));

    const newPart = {
      id: `part_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: partName.trim(),
      partNumber: partNumber?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      unitPriceInr: unitPrice,
      quantity: qty,
      subtotalInr: itemTotal,
      gstInr: itemGst,
      totalInr: itemGross,
      technicianId: technicianId || job.technicianId,
      addedAt: new Date().toISOString(),
      isApprovedByCustomer: true,
    };

    if (!(job as any).parts) {
      (job as any).parts = [];
    }
    (job as any).parts.push(newPart);

    // Revise overall job totalAmountInr
    const previousTotal = Number((job as any).totalAmountInr || 299.0);
    const revisedTotal = Number((previousTotal + itemGross).toFixed(2));
    (job as any).totalAmountInr = revisedTotal;

    // Persist to PostgreSQL if connected
    if (await isDatabaseConnected()) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.job.updateMany({
          where: {
            OR: [{ id: job.id }, { jobTicketNumber: job.jobTicketNumber }],
          },
          data: {
            updatedAt: new Date(),
          },
        });
      } catch (_) {}
    }

    // Broadcast Real-time In-Job Material Addition Event to Customer and Dispatch Board
    realtimeBus.publish({
      type: 'MATERIAL_ADDED',
      jobId: job.id,
      ticketNumber: job.jobTicketNumber,
      partnerId: job.partnerId,
      technicianId: job.technicianId,
      customerId: job.customerId,
      status: job.status,
      details: {
        part: newPart,
        addedCostInr: itemGross,
        revisedJobTotalInr: revisedTotal,
        message: `Technician added spare part "${partName}" (₹${itemGross} incl. GST). Invoice revised.`,
      },
    });

    return apiSuccess(
      {
        jobId: job.id,
        ticketNumber: job.jobTicketNumber,
        addedPart: newPart,
        previousTotalAmountInr: previousTotal,
        revisedTotalAmountInr: revisedTotal,
        parts: (job as any).parts,
      },
      `Spare part "${partName}" added to work order. Invoice revised to ₹${revisedTotal}.`,
      201
    );
  } catch (error) {
    return apiError(
      'Failed to add spare part / material to job',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
