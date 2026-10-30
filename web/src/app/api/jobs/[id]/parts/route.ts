import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError, corsOptionsResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

/**
 * GET: Retrieve in-job spare parts, pending quote awaiting customer approval,
 * and the standardized verified partner inventory catalog (Issues 31 & 32).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.findOrRecoverJob(id);
    if (!job) {
      return apiError(`Work order '${id}' not found`, 404);
    }

    const parts = (job as any).parts || [];
    const pendingQuote = (job as any).pendingQuote || null;
    const catalog = await db.getPartnerInventory(job.partnerId);

    const approvedPartsTotalInr = parts.reduce(
      (sum: number, p: any) => sum + (Number(p.subtotalInr) || (Number(p.unitPriceInr) * Number(p.quantity))),
      0
    );
    const approvedGstInr = Number((approvedPartsTotalInr * 0.18).toFixed(2));
    const approvedGrossInr = Number((approvedPartsTotalInr + approvedGstInr).toFixed(2));

    return apiSuccess(
      {
        jobId: job.id,
        ticketNumber: job.jobTicketNumber,
        status: job.status,
        isPausedForApproval: job.status === 'WAITING_CUSTOMER_APPROVAL',
        partsCount: parts.length,
        parts,
        pendingQuote,
        catalog,
        approvedPartsTotalInr,
        approvedGstInr,
        approvedGrossInr,
        jobTotalAmountInr: (job as any).totalAmountInr,
      },
      `Retrieved ${parts.length} approved parts and ${catalog.length} verified catalog items`,
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
 * POST: Technician proposes spare part from standardized catalog with mandatory damaged photo (Issues 31, 32, 34).
 * If approval payload is detected, routes seamlessly to db.approveJobPartQuote.
 * Transitions job to WAITING_CUSTOMER_APPROVAL and pauses work until customer accepts.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Detect inline customer approval/rejection decision
    if (body.decision || body.action === 'APPROVE' || body.action === 'ACCEPT' || body.action === 'REJECT' || body.action === 'DECLINE') {
      const rawPartId = body.partId || body.id || 'latest';
      const effectivePartId = String(rawPartId || 'latest').trim();
      const rawDecision = String(body.decision || body.action || 'ACCEPT').toUpperCase().trim();
      const isAccept = rawDecision === 'ACCEPT' || rawDecision === 'APPROVE' || rawDecision === 'ACCEPTED';
      const dec: 'ACCEPT' | 'REJECT' = isAccept ? 'ACCEPT' : 'REJECT';

      const result = await db.approveJobPartQuote(id, effectivePartId, dec, {
        customerId: body.customerId,
        actorRole: 'CUSTOMER',
      });

      const actionText = dec === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
      return apiSuccess(
        {
          jobId: result.job.id,
          ticketNumber: result.job.jobTicketNumber,
          status: result.job.status,
          decision: result.decision,
          part: result.part,
          revisedTotalAmountInr: result.revisedTotalAmountInr,
        },
        `Customer has ${actionText} the spare parts estimate. Work order resumed in IN_PROGRESS.`,
        200
      );
    }

    const {
      sku,
      partNumber,
      partName,
      unitPriceInr,
      quantity = 1,
      damagedComponentPhotoUrl,
      photoUrl,
      technicianId,
    } = body;

    const targetSku = (sku || partNumber || '').trim();
    if (!targetSku) {
      return apiError(
        "Standardized Catalog Enforcement: Mandatory field 'sku' (e.g. 'SKU-MCB-63A-DP') is required.",
        400
      );
    }

    // Issue 34: Mandatory Damaged Component Photographic Evidence
    const photo = (damagedComponentPhotoUrl || photoUrl || '').trim();
    if (!photo) {
      return apiError(
        'Mandatory Photographic Evidence Required: Field technicians must upload clear photographic evidence of the damaged/burned component before submitting a spare parts estimate.',
        422
      );
    }

    const qty = Math.max(1, parseInt(String(quantity), 10) || 1);

    const result = await db.proposeJobPart(id, {
      sku: targetSku,
      quantity: qty,
      unitPriceInr: unitPriceInr !== undefined ? Number(unitPriceInr) : undefined,
      damagedComponentPhotoUrl: photo,
      technicianId,
    });

    return apiSuccess(
      {
        jobId: result.job.id,
        ticketNumber: result.job.jobTicketNumber,
        status: result.job.status,
        pendingQuote: result.part,
        message: `Quote for '${result.part.name}' submitted. Work order transitioned to WAITING_CUSTOMER_APPROVAL. Awaiting customer in-app acceptance.`,
      },
      `Quote submitted for customer approval. Work paused until quote is accepted.`,
      201
    );
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    const isValidationErr =
      msg.includes('Standardized Catalog') ||
      msg.includes('Price Cap') ||
      msg.includes('Mandatory Photographic Evidence') ||
      msg.includes('Insufficient Warehouse Inventory');

    return apiError(
      msg,
      isValidationErr ? 422 : 500,
      msg
    );
  }
}

/**
 * PATCH / PUT: Direct quote approval or rejection endpoint
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const rawPartId = body.partId || body.id || 'latest';
    const effectivePartId = String(rawPartId || 'latest').trim();

    const rawDecision = String(body.decision || body.action || body.status || 'ACCEPT').toUpperCase().trim();
    const isAccept = rawDecision === 'ACCEPT' || rawDecision === 'APPROVE' || rawDecision === 'ACCEPTED';
    const isReject = rawDecision === 'REJECT' || rawDecision === 'DECLINE' || rawDecision === 'REJECTED';

    if (!isAccept && !isReject) {
      return apiError("Decision must be either 'ACCEPT' or 'REJECT'", 422);
    }

    const dec: 'ACCEPT' | 'REJECT' = isAccept ? 'ACCEPT' : 'REJECT';
    const result = await db.approveJobPartQuote(id, effectivePartId, dec, {
      customerId: body.customerId,
      actorRole: 'CUSTOMER',
    });

    const actionText = dec === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    return apiSuccess(
      {
        jobId: result.job.id,
        ticketNumber: result.job.jobTicketNumber,
        status: result.job.status,
        decision: result.decision,
        part: result.part,
        revisedTotalAmountInr: result.revisedTotalAmountInr,
      },
      `Customer has ${actionText} the spare parts estimate. Work order resumed in IN_PROGRESS.`,
      200
    );
  } catch (error: any) {
    return apiError(
      'Failed to process parts quote decision',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}
