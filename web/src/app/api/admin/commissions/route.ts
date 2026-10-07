import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET() {
  try {
    const config = await db.getGlobalCommissionConfig();
    return apiSuccess(config, 'Global commission split configuration retrieved');
  } catch (error) {
    return apiError(
      'Failed to retrieve commission configuration',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platformRevenueSharePct,
      partnerDefaultSharePct,
      technicianNetSharePct,
      gstStatutoryRatePct,
      emergencySosPremiumPct,
      autoEscrowDisbursement,
      minWithdrawalThresholdInr,
    } = body;

    // Validate that the base labor shares sum up to 100%
    const current = await db.getGlobalCommissionConfig();
    const platform = platformRevenueSharePct !== undefined ? Number(platformRevenueSharePct) : current.platformRevenueSharePct;
    const partner = partnerDefaultSharePct !== undefined ? Number(partnerDefaultSharePct) : current.partnerDefaultSharePct;
    const tech = technicianNetSharePct !== undefined ? Number(technicianNetSharePct) : current.technicianNetSharePct;

    const totalShare = Math.round((platform + partner + tech) * 100) / 100;
    if (Math.abs(totalShare - 100) > 0.01) {
      return apiError(
        `Invalid split: Platform (${platform}%) + Partner (${partner}%) + Tech (${tech}%) must equal exactly 100.0%. Current total: ${totalShare}%`,
        400
      );
    }

    const updated = await db.updateGlobalCommissionConfig({
      platformRevenueSharePct: platform,
      partnerDefaultSharePct: partner,
      technicianNetSharePct: tech,
      ...(gstStatutoryRatePct !== undefined && { gstStatutoryRatePct: Number(gstStatutoryRatePct) }),
      ...(emergencySosPremiumPct !== undefined && { emergencySosPremiumPct: Number(emergencySosPremiumPct) }),
      ...(autoEscrowDisbursement !== undefined && { autoEscrowDisbursement: Boolean(autoEscrowDisbursement) }),
      ...(minWithdrawalThresholdInr !== undefined && { minWithdrawalThresholdInr: Number(minWithdrawalThresholdInr) }),
    });

    return apiSuccess(updated, 'Global commission distribution parameters updated successfully');
  } catch (error) {
    return apiError(
      'Failed to update commission parameters',
      500,
      error instanceof Error ? error.message : String(error)
    );
  }
}
